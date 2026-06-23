import { useCallback, useEffect, useRef, useState } from 'react'
import {
  benchmarkCycleForPhase,
  clearAllSideCycles,
  computeBenchmarkGrades,
  computeFrameStats,
  computeOverallBenchmarkGrade,
  isBenchmarkPhaseComplete,
  nextBenchmarkPhase,
  shouldInjectBenchmarkCycle,
  startBenchmarkCycle,
} from '../engine/benchmark-driver'
import {
  BENCHMARK_PHASE_LABELS,
  type BenchmarkMetrics,
  type BenchmarkPhaseId,
  type BenchmarkPhaseTiming,
  type BenchmarkVirtualKey,
} from '../engine/benchmark-types'
import {
  createInitialSession,
  setInputValue,
  startGame,
  submitAnswer,
} from '../engine/game-state-machine'
import { isAnyGameChangerActive } from '../engine/game-changer-cycles'
import type { GameSession } from '../engine/types'

const BENCHMARK_STEP_DELAY_MS = 500
const BENCHMARK_KEYPRESS_BUDGET_MS = 200
const BENCHMARK_SUBMIT_PRESS_DELAY_MS = 20

interface BenchmarkRuntime {
  phase: BenchmarkPhaseId
  phaseStartedAt: number
  phaseAnswers: number
  totalAnswers: number
  totalAnswerIntervalsMs: number
  lastAnswerAt: number
  startedAt: number
  cycleInjected: boolean
  autoCheckCycleGranted: boolean
  autoCheckUseDone: boolean
  plusGcStarted: boolean
  minusGcStarted: boolean
  fourSecondsGcStarted: boolean
  timesDivGcStarted: boolean
  phaseTimings: BenchmarkPhaseTiming[]
}

function toBenchmarkDigitKey(digit: string): BenchmarkVirtualKey | null {
  if (!/^[0-9]$/.test(digit)) return null
  return `digit-${digit}` as BenchmarkVirtualKey
}

function createBenchmarkRuntime(now: number): BenchmarkRuntime {
  return {
    phase: 'ritmo-l5',
    phaseStartedAt: now,
    phaseAnswers: 0,
    totalAnswers: 0,
    totalAnswerIntervalsMs: 0,
    lastAnswerAt: now,
    startedAt: now,
    cycleInjected: false,
    autoCheckCycleGranted: false,
    autoCheckUseDone: false,
    plusGcStarted: false,
    minusGcStarted: false,
    fourSecondsGcStarted: false,
    timesDivGcStarted: false,
    phaseTimings: [],
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function computeDigitGapMs(digitCount: number): number {
  if (digitCount <= 1) return 0
  const available = Math.max(0, BENCHMARK_KEYPRESS_BUDGET_MS - BENCHMARK_SUBMIT_PRESS_DELAY_MS)
  const raw = Math.floor(available / (digitCount - 1))
  return Math.max(35, Math.min(70, raw))
}

function snapshotFlags(runtime: BenchmarkRuntime) {
  return {
    autoCheckCycleGranted: runtime.autoCheckCycleGranted,
    autoCheckUseDone: runtime.autoCheckUseDone,
    plusGcStarted: runtime.plusGcStarted,
    minusGcStarted: runtime.minusGcStarted,
    fourSecondsGcStarted: runtime.fourSecondsGcStarted,
    timesDivGcStarted: runtime.timesDivGcStarted,
  }
}

function markGameChangerStarted(runtime: BenchmarkRuntime, session: GameSession) {
  if (session.plusGameChangerActive) runtime.plusGcStarted = true
  if (session.minusGameChangerActive) runtime.minusGcStarted = true
  if (session.fourSecondsGameChangerRemaining > 0) runtime.fourSecondsGcStarted = true
  if (session.timesDivGameChangerRemaining > 0) runtime.timesDivGcStarted = true
}

function finishPhase(runtime: BenchmarkRuntime, now: number) {
  runtime.phaseTimings.push({
    id: runtime.phase,
    label: BENCHMARK_PHASE_LABELS[runtime.phase],
    durationMs: now - runtime.phaseStartedAt,
    answers: runtime.phaseAnswers,
  })
}

function advanceBenchmarkPhase(runtime: BenchmarkRuntime, now: number): BenchmarkPhaseId | null {
  finishPhase(runtime, now)
  const next = nextBenchmarkPhase(runtime.phase)
  if (!next) return null

  runtime.phase = next
  runtime.phaseStartedAt = now
  runtime.phaseAnswers = 0
  runtime.cycleInjected = false
  return next
}

interface UseBenchmarkOptions {
  session: GameSession
  setSession: React.Dispatch<React.SetStateAction<GameSession>>
  grantAutoCheck: (amount: number) => void
  spendAutoCheck: () => boolean
  onVirtualKeyPress: (key: BenchmarkVirtualKey) => void
  onBenchmarkPerfectAnswer: (timerMaxMs: number) => void
  onBenchmarkCorrectAnswer: (sessionBeforeSubmit: GameSession, fromAutoCheck: boolean) => void
}

export function useBenchmark({
  session,
  setSession,
  grantAutoCheck,
  spendAutoCheck,
  onVirtualKeyPress,
  onBenchmarkPerfectAnswer,
  onBenchmarkCorrectAnswer,
}: UseBenchmarkOptions) {
  const [benchmarkActive, setBenchmarkActive] = useState(false)
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics | null>(null)
  const [benchmarkVirtualKeypadPress, setBenchmarkVirtualKeypadPress] = useState<{
    key: BenchmarkVirtualKey
    token: number
  } | null>(null)

  const benchmarkActiveRef = useRef(false)
  const runtimeRef = useRef<BenchmarkRuntime | null>(null)
  const frameSamplesRef = useRef<number[]>([])
  const stepTimeoutRef = useRef<number | null>(null)
  const keyPressTokenRef = useRef(0)
  const stepRunningRef = useRef(false)

  const pushVirtualKeyPress = useCallback(
    (key: BenchmarkVirtualKey) => {
      keyPressTokenRef.current += 1
      setBenchmarkVirtualKeypadPress({ key, token: keyPressTokenRef.current })
      onVirtualKeyPress(key)
    },
    [onVirtualKeyPress],
  )

  const finalizeBenchmark = useCallback((completed: boolean) => {
    const runtime = runtimeRef.current
    if (!runtime || !benchmarkActiveRef.current) return

    const now = performance.now()
    if (runtime.phaseTimings.every((phase) => phase.id !== runtime.phase)) {
      finishPhase(runtime, now)
    }

    const totalDurationMs = Math.round(now - runtime.startedAt)
    const totalAnswers = runtime.totalAnswers
    const avgAnswerIntervalMs =
      totalAnswers > 1
        ? Math.round(runtime.totalAnswerIntervalsMs / (totalAnswers - 1))
        : 0

    const frames = computeFrameStats(frameSamplesRef.current)
    const grades = computeBenchmarkGrades(frames, avgAnswerIntervalMs)

    setBenchmarkMetrics({
      totalDurationMs,
      totalAnswers,
      avgAnswerIntervalMs,
      rhythmLevelReached: session.rhythmLevel,
      phases: runtime.phaseTimings,
      frames,
      grades,
      overallGrade: computeOverallBenchmarkGrade(grades),
      completed,
      interrupted: !completed,
    })

    benchmarkActiveRef.current = false
    setBenchmarkActive(false)
    runtimeRef.current = null
    frameSamplesRef.current = []
    setBenchmarkVirtualKeypadPress(null)
  }, [session.rhythmLevel])

  const onStartBenchmark = useCallback(() => {
    if (session.phase === 'playing') return

    benchmarkActiveRef.current = true
    setBenchmarkActive(true)
    setBenchmarkMetrics(null)
    runtimeRef.current = createBenchmarkRuntime(performance.now())
    frameSamplesRef.current = []
    keyPressTokenRef.current = 0
    setSession(startGame())
  }, [session.phase, setSession])

  const onInterruptBenchmark = useCallback(() => {
    if (!benchmarkActiveRef.current) return
    finalizeBenchmark(false)
  }, [finalizeBenchmark])

  const registerCorrectAnswer = useCallback((runtime: BenchmarkRuntime, sessionAfterAnswer: GameSession) => {
    const now = performance.now()
    if (runtime.totalAnswers > 0) {
      runtime.totalAnswerIntervalsMs += now - runtime.lastAnswerAt
    }
    runtime.totalAnswers += 1
    runtime.phaseAnswers += 1
    runtime.lastAnswerAt = now
    markGameChangerStarted(runtime, sessionAfterAnswer)
  }, [])

  const runBenchmarkAutoCheck = useCallback(async () => {
    const current = session
    const runtime = runtimeRef.current
    if (
      !runtime ||
      current.phase !== 'playing' ||
      current.isSubmitLocked ||
      !current.operation ||
      stepRunningRef.current
    ) {
      return
    }
    stepRunningRef.current = true

    try {
      if (!spendAutoCheck()) {
        grantAutoCheck(1)
        spendAutoCheck()
      }

      const answerText = String(current.operation.result)
      const digits = Array.from(answerText).filter((char) => /[0-9]/.test(char))

      let filledSession = setInputValue(current, '')
      setSession(filledSession)
      const digitGapMs = computeDigitGapMs(digits.length)
      for (const [index, digit] of digits.entries()) {
        const digitKey = toBenchmarkDigitKey(digit)
        if (digitKey) {
          pushVirtualKeyPress(digitKey)
        }
        filledSession = setInputValue(filledSession, `${filledSession.inputValue}${digit}`)
        setSession(filledSession)
        if (index < digits.length - 1) {
          await waitMs(digitGapMs)
          if (!benchmarkActiveRef.current) return
        }
      }

      await waitMs(BENCHMARK_SUBMIT_PRESS_DELAY_MS)
      if (!benchmarkActiveRef.current) return
      pushVirtualKeyPress('auto')
      const { session: next, result, autoCheckGranted } = submitAnswer(filledSession, { autoCheck: true })
      setSession(next)
      if (autoCheckGranted) grantAutoCheck(1)

      if (result === 'correct') {
        onBenchmarkCorrectAnswer(current, false)
        runtime.autoCheckUseDone = true
        registerCorrectAnswer(runtime, next)

        if (isBenchmarkPhaseComplete(runtime.phase, next, snapshotFlags(runtime))) {
          advanceBenchmarkPhase(runtime, performance.now())
        }
      }
    } finally {
      stepRunningRef.current = false
    }
  }, [
    grantAutoCheck,
    onBenchmarkCorrectAnswer,
    pushVirtualKeyPress,
    registerCorrectAnswer,
    session,
    setSession,
    spendAutoCheck,
  ])

  const runBenchmarkAnswer = useCallback(async () => {
    const runtime = runtimeRef.current
    let current = session
    if (
      !runtime ||
      current.phase !== 'playing' ||
      current.isSubmitLocked ||
      !current.operation ||
      stepRunningRef.current
    ) {
      return
    }
    stepRunningRef.current = true

    try {
      if (shouldInjectBenchmarkCycle(runtime.phase, current, runtime.cycleInjected)) {
        const cycle = benchmarkCycleForPhase(runtime.phase)
        if (cycle) {
          current = startBenchmarkCycle(current, cycle)
          runtime.cycleInjected = true
        }
      }

      if (!current.operation) return
      const answerText = String(current.operation.result)
      const digits = Array.from(answerText).filter((char) => /[0-9]/.test(char))

      let filledSession = setInputValue(current, '')
      setSession(filledSession)
      const digitGapMs = computeDigitGapMs(digits.length)
      for (const [index, digit] of digits.entries()) {
        const digitKey = toBenchmarkDigitKey(digit)
        if (digitKey) {
          pushVirtualKeyPress(digitKey)
        }
        filledSession = setInputValue(filledSession, `${filledSession.inputValue}${digit}`)
        setSession(filledSession)
        if (index < digits.length - 1) {
          await waitMs(digitGapMs)
          if (!benchmarkActiveRef.current) return
        }
      }

      await waitMs(BENCHMARK_SUBMIT_PRESS_DELAY_MS)
      if (!benchmarkActiveRef.current) return
      pushVirtualKeyPress('enter')
      const submitResult = submitAnswer(filledSession)
      let next = submitResult.session
      const { result, autoCheckGranted } = submitResult
      if (runtime.phase === 'ritmo-l5') {
        next = clearAllSideCycles(next)
      }
      setSession(next)

      if (autoCheckGranted) {
        runtime.autoCheckCycleGranted = true
        grantAutoCheck(1)
      }

      if (result !== 'correct') return

      onBenchmarkPerfectAnswer(current.timerMaxMs)
      onBenchmarkCorrectAnswer(current, false)
      registerCorrectAnswer(runtime, next)

      if (isBenchmarkPhaseComplete(runtime.phase, next, snapshotFlags(runtime))) {
        const nextPhase = advanceBenchmarkPhase(runtime, performance.now())
        if (!nextPhase) {
          setSession((currentSession) =>
            currentSession.phase === 'playing'
              ? {
                  ...currentSession,
                  phase: 'game_over',
                  timerMs: 0,
                  awaitingAutoCheckChoice: false,
                }
              : currentSession,
          )
          finalizeBenchmark(true)
        }
      }
    } finally {
      stepRunningRef.current = false
    }
  }, [
    finalizeBenchmark,
    grantAutoCheck,
    onBenchmarkPerfectAnswer,
    onBenchmarkCorrectAnswer,
    pushVirtualKeyPress,
    registerCorrectAnswer,
    session,
    setSession,
  ])

  useEffect(() => {
    if (!benchmarkActive) return

    let lastFrame = performance.now()
    let frameId = 0

    const loop = (now: number) => {
      frameSamplesRef.current.push(now - lastFrame)
      lastFrame = now
      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [benchmarkActive])

  useEffect(() => {
    if (!benchmarkActive || session.phase !== 'playing') return
    if (session.isSubmitLocked || session.awaitingAutoCheckChoice || stepRunningRef.current) return

    const runtime = runtimeRef.current
    if (!runtime) return

    if (stepTimeoutRef.current !== null) {
      window.clearTimeout(stepTimeoutRef.current)
    }

    const sinceLastAnswer = performance.now() - runtime.lastAnswerAt
    const waitForNextStep = Math.max(0, BENCHMARK_STEP_DELAY_MS - sinceLastAnswer)

    stepTimeoutRef.current = window.setTimeout(() => {
      stepTimeoutRef.current = null
      if (!benchmarkActiveRef.current) return

      if (runtime.phase === 'auto-check-uso') {
        void runBenchmarkAutoCheck()
        return
      }

      void runBenchmarkAnswer()
    }, waitForNextStep)

    return () => {
      if (stepTimeoutRef.current !== null) {
        window.clearTimeout(stepTimeoutRef.current)
        stepTimeoutRef.current = null
      }
    }
  }, [
    benchmarkActive,
    runBenchmarkAnswer,
    runBenchmarkAutoCheck,
    session.awaitingAutoCheckChoice,
    session.isSubmitLocked,
    session.phase,
    session.score,
    session.rhythmLevel,
    session.plusGameChangerActive,
    session.minusGameChangerActive,
    session.fourSecondsGameChangerRemaining,
    session.timesDivGameChangerRemaining,
    session.autoCheckCycleStep,
    session.plusCycleStep,
    session.minusCycleStep,
    session.fourSecondsCycleStep,
    session.timesDivCycleStep,
  ])

  useEffect(() => {
    if (!benchmarkActive || session.phase !== 'playing' || !session.awaitingAutoCheckChoice) return
    void runBenchmarkAutoCheck()
  }, [benchmarkActive, runBenchmarkAutoCheck, session.awaitingAutoCheckChoice, session.phase])

  const resetBenchmark = useCallback(() => {
    benchmarkActiveRef.current = false
    runtimeRef.current = null
    frameSamplesRef.current = []
    keyPressTokenRef.current = 0
    setBenchmarkActive(false)
    setBenchmarkMetrics(null)
    setBenchmarkVirtualKeypadPress(null)
    stepRunningRef.current = false
    setSession(createInitialSession())
  }, [setSession])

  return {
    benchmarkActive,
    benchmarkMetrics,
    benchmarkVirtualKeypadPress,
    onStartBenchmark,
    onInterruptBenchmark,
    resetBenchmark,
    isBenchmarkGameChangerActive: isAnyGameChangerActive(session),
  }
}
