import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react'
import {
  clearLevelUpFlash,
  clearAnswerFlash,
  createInitialSession,
  DEBUG_AUTO_CHECK_ALWAYS_ENABLED,
  markBeatRecord,
  returnToMenu,
  setInputValue,
  startGame,
  submitAnswer,
  SUBMIT_LOCK_MS,
  tickTimer,
  unlockSubmit,
} from '../engine/game-state-machine'
import { PERFECT_ANSWER_COINS, scoreToCoins } from '../engine/rewards'
import type { GameSession } from '../engine/types'
import { usePlayer } from './usePlayer'
import { useBenchmark } from './useBenchmark'
import { ensureDailyFresh } from '../platform/daily-reset'
import { isAnyGameChangerActive } from '../engine/game-changer-cycles'
import {
  loadDevModeEnabled,
  loadSoundEnabled,
  loadTopScores,
  saveDevModeEnabled,
  saveSoundEnabled,
  saveTopScore,
  type ScoreRecord,
} from '../platform/storage'
import { playCorrectAnswerSfx, playRandomWriteSfx, playSfx, preloadSfx, syncAmbient } from '../platform/audio-service'
import { gameTimerStore } from '../platform/game-timer-store'
import type { BenchmarkVirtualKey } from '../engine/benchmark-types'

const TIMER_UI_PUBLISH_MS = 100
const DAILY_GOAL_SCORE = 1000
const DAILY_GOAL_XP_REWARD = 1000
const PERFECT_ANSWER_RATIO = 0.9

export interface PostGameRewards {
  xpGained: number
  coinsGained: number
  goalCompleted: boolean
}

export function useGame() {
  const [session, setSession] = useState<GameSession>(createInitialSession)
  const [inputValue, setInputValueState] = useState(session.inputValue)
  const [topScores, setTopScores] = useState<ScoreRecord[]>(() => loadTopScores())
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled())
  const [devModeEnabled, setDevModeEnabled] = useState(() => loadDevModeEnabled())
  const [lastGameRewards, setLastGameRewards] = useState<PostGameRewards>({
    xpGained: 0,
    coinsGained: 0,
    goalCompleted: false,
  })
  const [perfectAnswerToken, setPerfectAnswerToken] = useState(0)
  const { player, commitPlayer, grantAutoCheck, spendAutoCheck, setEquippedTheme, ...playerActions } =
    usePlayer()
  const sessionRef = useRef(session)
  const playerRef = useRef(player)
  const soundEnabledRef = useRef(soundEnabled)
  const gameOverFxHandledRef = useRef(false)
  const lastPersistedScoreRef = useRef<number | null>(null)
  const timerMsRef = useRef(session.timerMs)
  const elapsedMsRef = useRef(session.elapsedMs)
  const cycleStartedAtRef = useRef(0)
  const cycleTimerMaxRef = useRef(session.timerMaxMs)
  const cycleScoreRef = useRef(session.score)
  const prevPhaseRef = useRef(session.phase)
  const inputValueRef = useRef(inputValue)
  const setSessionWithInputSync = useCallback((action: SetStateAction<GameSession>) => {
    setSession((current) => {
      const next =
        typeof action === 'function' ? (action as (current: GameSession) => GameSession)(current) : action
      if (next.inputValue !== inputValueRef.current) {
        inputValueRef.current = next.inputValue
        setInputValueState(next.inputValue)
      }
      return next
    })
  }, [])

  const benchmarkSessionRef = useRef(false)
  const [benchmarkMode, setBenchmarkMode] = useState(false)
  const onBenchmarkVirtualKeyPress = useCallback(
    (key: BenchmarkVirtualKey) => {
      if (key.startsWith('digit-')) {
        playRandomWriteSfx(soundEnabledRef.current)
      }
    },
    [],
  )
  const onBenchmarkCorrectAnswer = useCallback(
    (sessionBeforeSubmit: GameSession, fromAutoCheck: boolean) => {
      playCorrectAnswerSfx(
        isAnyGameChangerActive(sessionBeforeSubmit),
        soundEnabledRef.current,
        fromAutoCheck,
      )
    },
    [],
  )
  const onBenchmarkPerfectAnswer = useCallback((timerMaxMs: number) => {
    if (timerMaxMs <= 0) return
    const liveTimerRatio = Math.max(0, timerMsRef.current) / timerMaxMs
    if (liveTimerRatio >= PERFECT_ANSWER_RATIO) {
      setPerfectAnswerToken((token) => token + 1)
    }
  }, [])
  const {
    benchmarkActive,
    benchmarkMetrics,
    benchmarkVirtualKeypadPress,
    onStartBenchmark,
    onInterruptBenchmark,
    resetBenchmark,
  } = useBenchmark({
    session,
    setSession: setSessionWithInputSync,
    grantAutoCheck,
    spendAutoCheck,
    onVirtualKeyPress: onBenchmarkVirtualKeyPress,
    onBenchmarkPerfectAnswer,
    onBenchmarkCorrectAnswer,
  })

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    inputValueRef.current = inputValue
  }, [inputValue])

  useEffect(() => {
    preloadSfx()
  }, [])

  useEffect(() => {
    syncAmbient(soundEnabled && session.phase === 'playing' && !session.awaitingAutoCheckChoice)
  }, [soundEnabled, session.phase, session.awaitingAutoCheckChoice])

  useEffect(() => {
    timerMsRef.current = session.timerMs
    elapsedMsRef.current = session.elapsedMs
    gameTimerStore.sync(session.timerMs, session.elapsedMs)
  }, [session.phase, session.score, session.timerMs, session.elapsedMs, session.awaitingAutoCheckChoice])

  useEffect(() => {
    const phaseChanged = prevPhaseRef.current !== session.phase
    if (session.phase === 'playing' && (phaseChanged || session.score !== cycleScoreRef.current)) {
      cycleStartedAtRef.current = performance.now()
      cycleTimerMaxRef.current = session.timerMaxMs
      cycleScoreRef.current = session.score
    }

    if (session.phase !== 'playing') {
      cycleScoreRef.current = session.score
      cycleTimerMaxRef.current = session.timerMaxMs
    }

    prevPhaseRef.current = session.phase
  }, [session.phase, session.score, session.timerMaxMs])

  useEffect(() => {
    if (session.phase !== 'playing') return
    if (benchmarkActive) return

    let lastTick = performance.now()
    let lastPublish = lastTick
    let frameId = 0

    const loop = (now: number) => {
      const delta = now - lastTick
      lastTick = now

      if (!sessionRef.current.awaitingAutoCheckChoice) {
        timerMsRef.current = Math.max(0, timerMsRef.current - delta)
        elapsedMsRef.current += delta
      }

      if (timerMsRef.current <= 0 && !sessionRef.current.awaitingAutoCheckChoice) {
        setSessionWithInputSync((current) => {
          if (current.phase !== 'playing') return current
          if (current.awaitingAutoCheckChoice) return current
          if (playerRef.current.walletAutoChecks > 0) {
            return { ...current, timerMs: 0, awaitingAutoCheckChoice: true }
          }
          return tickTimer({ ...current, timerMs: 0 }, 0)
        })
      }

      if (now - lastPublish >= TIMER_UI_PUBLISH_MS && !sessionRef.current.awaitingAutoCheckChoice) {
        lastPublish = now
        gameTimerStore.set(timerMsRef.current, elapsedMsRef.current)
      }

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [session.phase, benchmarkActive, setSessionWithInputSync])

  useEffect(() => {
    if (session.phase !== 'game_over') return
    if (benchmarkSessionRef.current) return
    if (gameOverFxHandledRef.current && lastPersistedScoreRef.current === session.score) return

    gameOverFxHandledRef.current = true
    lastPersistedScoreRef.current = session.score

    const coinsGained = scoreToCoins(session.score)
    let goalCompleted = false
    let xpGained = session.score

    commitPlayer((current) => {
      const fresh = ensureDailyFresh(current)
      const dailyScore = fresh.daily.scoreAccumulated + session.score
      goalCompleted = !fresh.daily.goalClaimed && dailyScore >= DAILY_GOAL_SCORE
      if (goalCompleted) {
        xpGained += DAILY_GOAL_XP_REWARD
      }

      return {
        ...fresh,
        xp: fresh.xp + xpGained,
        coins: fresh.coins + coinsGained,
        walletAutoChecks: fresh.walletAutoChecks + (goalCompleted ? 1 : 0),
        daily: {
          ...fresh.daily,
          scoreAccumulated: dailyScore,
          goalClaimed: fresh.daily.goalClaimed || goalCompleted,
        },
      }
    })

    setLastGameRewards({ xpGained, coinsGained, goalCompleted })

    const result = saveTopScore(session.score, session.elapsedMs)
    setTopScores(result.scores)
    setSessionWithInputSync((current) =>
      current.phase === 'game_over' && current.beatRecord === result.isTop1
        ? current
        : markBeatRecord(current, result.isTop1),
    )
    playSfx(result.isTop1 ? 'record' : 'gameOver', soundEnabledRef.current)
  }, [session.phase, session.score, session.elapsedMs, commitPlayer, setSessionWithInputSync])

  useEffect(() => {
    if (!session.isSubmitLocked) return
    const timeout = window.setTimeout(() => {
      setSessionWithInputSync((current) => unlockSubmit(current))
    }, SUBMIT_LOCK_MS)
    return () => window.clearTimeout(timeout)
  }, [session.isSubmitLocked, setSessionWithInputSync])

  useEffect(() => {
    if (session.answerFlash === null) return
    const timeout = window.setTimeout(() => {
      setSessionWithInputSync((current) => clearAnswerFlash(current))
    }, 560)
    return () => window.clearTimeout(timeout)
  }, [session.answerFlash, setSessionWithInputSync])

  useEffect(() => {
    if (session.rhythmLevelUpFlash === null) return
    const timeout = window.setTimeout(() => {
      setSessionWithInputSync((current) => clearLevelUpFlash(current))
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [session.rhythmLevelUpFlash, setSessionWithInputSync])

  const onStart = useCallback(() => {
    if (sessionRef.current.phase === 'playing') return
    benchmarkSessionRef.current = false
    setBenchmarkMode(false)
    resetBenchmark()
    gameOverFxHandledRef.current = false
    lastPersistedScoreRef.current = null
    setLastGameRewards({ xpGained: 0, coinsGained: 0, goalCompleted: false })
    setInputValueState('')
    setSessionWithInputSync(startGame())
  }, [resetBenchmark, setSessionWithInputSync])

  const onStartBenchmarkSession = useCallback(() => {
    if (sessionRef.current.phase === 'playing') return
    benchmarkSessionRef.current = true
    setBenchmarkMode(true)
    gameOverFxHandledRef.current = false
    lastPersistedScoreRef.current = null
    setLastGameRewards({ xpGained: 0, coinsGained: 0, goalCompleted: false })
    setInputValueState('')
    onStartBenchmark()
  }, [onStartBenchmark])

  const onReturnToMenu = useCallback(() => {
    onInterruptBenchmark()
    benchmarkSessionRef.current = false
    setBenchmarkMode(false)
    resetBenchmark()
    gameOverFxHandledRef.current = false
    lastPersistedScoreRef.current = null
    setInputValueState('')
    setSessionWithInputSync(returnToMenu())
  }, [onInterruptBenchmark, resetBenchmark, setSessionWithInputSync])

  const applyAnswerResult = useCallback(
    (current: GameSession, fromAutoCheck = false) => {
      const sessionWithInput = setInputValue(current, inputValueRef.current)
      const { session: next, result, autoCheckGranted } = submitAnswer(sessionWithInput, {
        autoCheck: fromAutoCheck,
      })
      setSessionWithInputSync(next)

      if (autoCheckGranted) {
        grantAutoCheck(1)
      }

      if (result === 'correct') {
        const elapsedInCycleMs = Math.max(0, performance.now() - cycleStartedAtRef.current)
        const cycleTimerMaxMs = Math.max(1, cycleTimerMaxRef.current)
        const liveTimerRatio = Math.max(0, 1 - elapsedInCycleMs / cycleTimerMaxMs)
        if (
          !fromAutoCheck &&
          !benchmarkSessionRef.current &&
          liveTimerRatio >= PERFECT_ANSWER_RATIO
        ) {
          setPerfectAnswerToken((token) => token + 1)
          commitPlayer((fresh) => ({
            ...fresh,
            coins: fresh.coins + PERFECT_ANSWER_COINS,
          }))
        }
        playCorrectAnswerSfx(isAnyGameChangerActive(current), soundEnabledRef.current, fromAutoCheck)
      } else if (result === 'wrong') {
        playSfx('error', soundEnabledRef.current)
      }
    },
    [commitPlayer, grantAutoCheck, setSessionWithInputSync],
  )

  const onConfirm = useCallback(() => {
    applyAnswerResult(sessionRef.current)
  }, [applyAnswerResult])

  const runAutoCorrect = useCallback((consumeWallet: boolean) => {
    const current = sessionRef.current
    if (current.phase !== 'playing' || current.isSubmitLocked || !current.operation) return

    let spent = false
    if (!DEBUG_AUTO_CHECK_ALWAYS_ENABLED && consumeWallet) {
      spent = spendAutoCheck()
      if (!spent) return
    }

    const forcedAnswer = setInputValue(current, String(current.operation.result))
    const { session: next, result, autoCheckGranted } = submitAnswer(forcedAnswer, { autoCheck: true })
    setSessionWithInputSync(next)

    if (result === 'locked' && spent && consumeWallet) {
      grantAutoCheck(1)
      return
    }
    if (autoCheckGranted) {
      grantAutoCheck(1)
    }
    if (result === 'correct') {
      playCorrectAnswerSfx(isAnyGameChangerActive(current), soundEnabledRef.current, true)
    } else if (result === 'wrong') {
      playSfx('error', soundEnabledRef.current)
    }
  }, [grantAutoCheck, spendAutoCheck, setSessionWithInputSync])

  const onAutoCorrect = useCallback(() => {
    runAutoCorrect(true)
  }, [runAutoCorrect])

  const onUseAutoCheckAtTimeout = useCallback(() => {
    const current = sessionRef.current
    if (current.phase !== 'playing' || !current.awaitingAutoCheckChoice) return
    runAutoCorrect(true)
  }, [runAutoCorrect])

  const onDeclineAutoCheckAtTimeout = useCallback(() => {
    setSessionWithInputSync((current) => {
      if (current.phase !== 'playing') return current
      return {
        ...current,
        phase: 'game_over',
        timerMs: 0,
        awaitingAutoCheckChoice: false,
      }
    })
  }, [setSessionWithInputSync])

  const onInputChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 2)
    setInputValueState(digitsOnly)
  }, [])

  const playClick = useCallback(() => {
    playSfx('click', soundEnabledRef.current)
  }, [])
  const playGameStart = useCallback(() => {
    playSfx('gameStart', soundEnabledRef.current)
  }, [])
  const playWriteKey = useCallback(() => {
    playRandomWriteSfx(soundEnabledRef.current)
  }, [])
  const playEraseKey = useCallback(() => {
    playSfx('erase', soundEnabledRef.current)
  }, [])
  const playGoToMenu = useCallback(() => {
    playSfx('goToMenu', soundEnabledRef.current)
  }, [])

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled)
    saveSoundEnabled(enabled)
  }, [])

  const toggleDevMode = useCallback((enabled: boolean) => {
    setDevModeEnabled(enabled)
    saveDevModeEnabled(enabled)
  }, [])

  return {
    session,
    inputValue,
    topScores,
    soundEnabled,
    devModeEnabled,
    backgroundTheme: player.equippedThemeId,
    player,
    lastGameRewards,
    benchmarkActive,
    benchmarkMetrics,
    benchmarkVirtualKeypadPress,
    benchmarkMode,
    perfectAnswerToken,
    onStart,
    onStartBenchmarkSession,
    onReturnToMenu,
    onConfirm,
    onAutoCorrect,
    onUseAutoCheckAtTimeout,
    onDeclineAutoCheckAtTimeout,
    onInputChange,
    toggleSound,
    toggleDevMode,
    setBackgroundTheme: setEquippedTheme,
    grantAutoCheck,
    spendAutoCheck,
    ...playerActions,
    playClick,
    playGameStart,
    playWriteKey,
    playEraseKey,
    playGoToMenu,
  }
}
