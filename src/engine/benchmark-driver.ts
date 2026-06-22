import {
  isFourSecondsGameChangerActive,
  isMinusGameChangerActive,
  isPlusGameChangerActive,
  isTimesDivGameChangerActive,
} from './game-changer-cycles'
import type {
  BenchmarkCycle,
  BenchmarkFrameStats,
  BenchmarkMetricGrade,
  BenchmarkPhaseId,
} from './benchmark-types'
import { BENCHMARK_PHASE_ORDER } from './benchmark-types'
import type { GameSession } from './types'

export function clearAllSideCycles(session: GameSession): GameSession {
  return {
    ...session,
    autoCheckCycleStep: null,
    fourSecondsCycleStep: null,
    fourSecondsGameChangerRemaining: 0,
    timesDivCycleStep: null,
    timesDivGameChangerRemaining: 0,
    plusCycleStep: null,
    plusGameChangerActive: false,
    minusCycleStep: null,
    minusGameChangerActive: false,
  }
}

export function startBenchmarkCycle(session: GameSession, cycle: BenchmarkCycle): GameSession {
  const cleared = clearAllSideCycles(session)

  switch (cycle) {
    case 'autoCheck':
      return { ...cleared, autoCheckCycleStep: 1 }
    case 'plus':
      return { ...cleared, plusCycleStep: 1 }
    case 'minus':
      return { ...cleared, minusCycleStep: 1 }
    case 'fourSeconds':
      return { ...cleared, fourSecondsCycleStep: 1 }
    case 'timesDiv':
      return { ...cleared, timesDivCycleStep: 1 }
  }
}

export function benchmarkCycleForPhase(phase: BenchmarkPhaseId): BenchmarkCycle | null {
  switch (phase) {
    case 'auto-check-ciclo':
      return 'autoCheck'
    case 'gc-plus':
      return 'plus'
    case 'gc-minus':
      return 'minus'
    case 'gc-4s':
      return 'fourSeconds'
    case 'gc-mult-div':
      return 'timesDiv'
    default:
      return null
  }
}

export function nextBenchmarkPhase(phase: BenchmarkPhaseId): BenchmarkPhaseId | null {
  const index = BENCHMARK_PHASE_ORDER.indexOf(phase)
  if (index < 0 || index >= BENCHMARK_PHASE_ORDER.length - 1) return null
  return BENCHMARK_PHASE_ORDER[index + 1]
}

export function isBenchmarkPhaseComplete(
  phase: BenchmarkPhaseId,
  session: GameSession,
  flags: {
    autoCheckCycleGranted: boolean
    autoCheckUseDone: boolean
    plusGcStarted: boolean
    minusGcStarted: boolean
    fourSecondsGcStarted: boolean
    timesDivGcStarted: boolean
  },
): boolean {
  switch (phase) {
    case 'ritmo-l5':
      return session.rhythmLevel >= 5
    case 'auto-check-ciclo':
      return flags.autoCheckCycleGranted
    case 'auto-check-uso':
      return flags.autoCheckUseDone
    case 'gc-plus':
      return flags.plusGcStarted && !isPlusGameChangerActive(session) && session.plusCycleStep === null
    case 'gc-minus':
      return flags.minusGcStarted && !isMinusGameChangerActive(session) && session.minusCycleStep === null
    case 'gc-4s':
      return (
        flags.fourSecondsGcStarted &&
        !isFourSecondsGameChangerActive(session) &&
        session.fourSecondsCycleStep === null
      )
    case 'gc-mult-div':
      return (
        flags.timesDivGcStarted &&
        !isTimesDivGameChangerActive(session) &&
        session.timesDivCycleStep === null
      )
    default:
      return false
  }
}

export function shouldInjectBenchmarkCycle(
  phase: BenchmarkPhaseId,
  session: GameSession,
  cycleInjected: boolean,
): boolean {
  if (cycleInjected) return false

  const cycle = benchmarkCycleForPhase(phase)
  if (!cycle) return false

  switch (cycle) {
    case 'autoCheck':
      return session.autoCheckCycleStep === null
    case 'plus':
      return session.plusCycleStep === null && !session.plusGameChangerActive
    case 'minus':
      return session.minusCycleStep === null && !session.minusGameChangerActive
    case 'fourSeconds':
      return session.fourSecondsCycleStep === null && session.fourSecondsGameChangerRemaining === 0
    case 'timesDiv':
      return session.timesDivCycleStep === null && session.timesDivGameChangerRemaining === 0
  }
}

export function computeFrameStats(samples: number[]): {
  samples: number
  avgFrameMs: number
  maxFrameMs: number
  p95FrameMs: number
  jankFrames: number
  estimatedFps: number
} {
  if (samples.length === 0) {
    return {
      samples: 0,
      avgFrameMs: 0,
      maxFrameMs: 0,
      p95FrameMs: 0,
      jankFrames: 0,
      estimatedFps: 0,
    }
  }

  const sorted = [...samples].sort((a, b) => a - b)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  const avgFrameMs = total / sorted.length
  const maxFrameMs = sorted[sorted.length - 1]
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
  const p95FrameMs = sorted[p95Index]
  const jankFrames = sorted.filter((value) => value > 32).length
  const estimatedFps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0

  return {
    samples: sorted.length,
    avgFrameMs: Math.round(avgFrameMs * 10) / 10,
    maxFrameMs: Math.round(maxFrameMs * 10) / 10,
    p95FrameMs: Math.round(p95FrameMs * 10) / 10,
    jankFrames,
    estimatedFps: Math.round(estimatedFps),
  }
}

function gradeAtLeast(value: number, thresholds: number[]): BenchmarkMetricGrade['grade'] {
  if (value >= thresholds[0]) return 'S'
  if (value >= thresholds[1]) return 'A'
  if (value >= thresholds[2]) return 'B'
  if (value >= thresholds[3]) return 'C'
  if (value >= thresholds[4]) return 'D'
  if (value >= thresholds[5]) return 'E'
  return 'F'
}

function gradeAtMost(value: number, thresholds: number[]): BenchmarkMetricGrade['grade'] {
  if (value <= thresholds[0]) return 'S'
  if (value <= thresholds[1]) return 'A'
  if (value <= thresholds[2]) return 'B'
  if (value <= thresholds[3]) return 'C'
  if (value <= thresholds[4]) return 'D'
  if (value <= thresholds[5]) return 'E'
  return 'F'
}

export function computeBenchmarkGrades(
  frames: BenchmarkFrameStats,
  avgAnswerIntervalMs: number,
): BenchmarkMetricGrade[] {
  const jankRate = frames.samples > 0 ? (frames.jankFrames / frames.samples) * 100 : 100
  const intervalTarget = 510
  const intervalDelta = Math.abs(avgAnswerIntervalMs - intervalTarget)

  return [
    {
      id: 'fps',
      label: 'FPS médio',
      value: `${frames.estimatedFps} FPS`,
      target: '>= 60 FPS',
      grade: gradeAtLeast(frames.estimatedFps, [60, 57, 54, 50, 45, 40]),
    },
    {
      id: 'avgFrameMs',
      label: 'Frame médio',
      value: `${frames.avgFrameMs} ms`,
      target: '<= 16.7 ms',
      grade: gradeAtMost(frames.avgFrameMs, [16.7, 18, 20, 23, 27, 33]),
    },
    {
      id: 'p95FrameMs',
      label: 'Frame p95',
      value: `${frames.p95FrameMs} ms`,
      target: '<= 20 ms',
      grade: gradeAtMost(frames.p95FrameMs, [20, 24, 28, 32, 40, 50]),
    },
    {
      id: 'maxFrameMs',
      label: 'Frame máximo',
      value: `${frames.maxFrameMs} ms`,
      target: '<= 33 ms',
      grade: gradeAtMost(frames.maxFrameMs, [33, 40, 50, 66, 90, 120]),
    },
    {
      id: 'jankRate',
      label: 'Taxa de jank',
      value: `${jankRate.toFixed(1)}%`,
      target: '<= 0.5%',
      grade: gradeAtMost(jankRate, [0.5, 1, 2, 4, 7, 12]),
    },
    {
      id: 'answerIntervalMs',
      label: 'Intervalo de acerto',
      value: `${avgAnswerIntervalMs} ms`,
      target: '510 ms (0.5s + 10ms)',
      grade: gradeAtMost(intervalDelta, [25, 50, 90, 140, 220, 320]),
    },
  ]
}
