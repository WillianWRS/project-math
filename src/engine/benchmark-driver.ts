import {
  isFourSecondsGameChangerActive,
  isMinusGameChangerActive,
  isPlusGameChangerActive,
  isTimesDivGameChangerActive,
} from './game-changer-cycles'
import type {
  BenchmarkCycle,
  BenchmarkFrameStats,
  BenchmarkGrade,
  BenchmarkMetricGrade,
  BenchmarkPhaseDiagnosis,
  BenchmarkPhaseId,
  BenchmarkPhaseTiming,
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
  rawMaxFrameMs: number
  p95FrameMs: number
  p99FrameMs: number
  jankFrames: number
  estimatedFps: number
} {
  if (samples.length === 0) {
    return {
      samples: 0,
      avgFrameMs: 0,
      maxFrameMs: 0,
      rawMaxFrameMs: 0,
      p95FrameMs: 0,
      p99FrameMs: 0,
      jankFrames: 0,
      estimatedFps: 0,
    }
  }

  const sorted = [...samples].sort((a, b) => a - b)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  const avgFrameMs = total / sorted.length
  const rawMaxFrameMs = sorted[sorted.length - 1]
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
  const p95FrameMs = sorted[p95Index]
  const p99Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))
  const p99FrameMs = sorted[p99Index]
  // Treat max as a stable peak (p99) to avoid a single outlier frame dominating the grade.
  const maxFrameMs = p99FrameMs
  const jankFrames = sorted.filter((value) => value > 32).length
  const estimatedFps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0

  return {
    samples: sorted.length,
    avgFrameMs: Math.round(avgFrameMs * 10) / 10,
    maxFrameMs: Math.round(maxFrameMs * 10) / 10,
    rawMaxFrameMs: Math.round(rawMaxFrameMs * 10) / 10,
    p95FrameMs: Math.round(p95FrameMs * 10) / 10,
    p99FrameMs: Math.round(p99FrameMs * 10) / 10,
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

const GRADE_SCORE: Record<BenchmarkGrade, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
}

const GRADE_BY_SCORE: BenchmarkGrade[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S']

export function computeOverallBenchmarkGrade(grades: BenchmarkMetricGrade[]): BenchmarkGrade {
  if (grades.length === 0) return 'F'

  const average =
    grades.reduce((sum, metric) => sum + GRADE_SCORE[metric.grade], 0) / grades.length
  const index = Math.min(GRADE_BY_SCORE.length - 1, Math.max(0, Math.round(average)))
  return GRADE_BY_SCORE[index]
}

function phaseDiagnosisSeverity(p95FrameMs: number, stutterRate: number): BenchmarkPhaseDiagnosis['severity'] {
  if (p95FrameMs >= 40 || stutterRate >= 4) return 'critical'
  if (p95FrameMs >= 28 || stutterRate >= 2) return 'warn'
  return 'ok'
}

export function diagnoseBenchmarkPhases(phases: BenchmarkPhaseTiming[]): BenchmarkPhaseDiagnosis[] {
  return phases
    .flatMap((phase) => {
      if (!phase.frames || phase.frames.samples === 0) return []
      const stutterRate = (phase.frames.jankFrames / phase.frames.samples) * 100
      return [
        {
          phaseId: phase.id,
          label: phase.label,
          p95FrameMs: phase.frames.p95FrameMs,
          stutterRate: Math.round(stutterRate * 10) / 10,
          severity: phaseDiagnosisSeverity(phase.frames.p95FrameMs, stutterRate),
        },
      ]
    })
    .sort((left, right) => right.p95FrameMs - left.p95FrameMs)
}

export function buildBenchmarkPerformanceHints(
  phases: BenchmarkPhaseTiming[],
  themeGpuTier: 'light' | 'heavy',
  themeName: string,
): string[] {
  const diagnosis = diagnoseBenchmarkPhases(phases)
  const hints: string[] = []

  if (themeGpuTier === 'heavy') {
    hints.push(
      `Tema "${themeName}" usa múltiplos gradientes radiais e glows — custo alto de pintura no mobile.`,
    )
  }

  const worstPhase = diagnosis[0]
  if (worstPhase && worstPhase.severity !== 'ok') {
    hints.push(
      `Fase mais pesada: ${worstPhase.label} (p95 ${worstPhase.p95FrameMs} ms, engasgos ${worstPhase.stutterRate}%).`,
    )
  }

  const worstGameChanger = diagnosis.find(
    (entry) => entry.phaseId.startsWith('gc-') && entry.severity !== 'ok',
  )
  if (worstGameChanger) {
    hints.push('Game changers adicionam animações, sombras e repintura extra na pilha de jogo.')
  }

  const keypadHeavy = diagnosis.find(
    (entry) =>
      (entry.phaseId === 'ritmo-l5' || entry.phaseId === 'auto-check-uso') && entry.severity !== 'ok',
  )
  if (keypadHeavy) {
    hints.push('Teclado virtual com motion pode estar contribuindo para frames lentos.')
  }

  if (hints.length === 0) {
    hints.push('Nenhum gargalo claro por fase — compare com tema leve (Padrão/Água) para isolar o tema.')
  }

  return hints
}

export function computeBenchmarkGrades(
  frames: BenchmarkFrameStats,
  avgAnswerIntervalMs: number,
): BenchmarkMetricGrade[] {
  const stutterRate = frames.samples > 0 ? (frames.jankFrames / frames.samples) * 100 : 100

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
      id: 'p99FrameMs',
      label: 'Frame p99',
      value: `${frames.p99FrameMs} ms`,
      target: '<= 33 ms',
      grade: gradeAtMost(frames.p99FrameMs, [33, 40, 50, 66, 90, 120]),
    },
    {
      id: 'rawMaxFrameMs',
      label: 'Frame máximo',
      value: `${frames.rawMaxFrameMs} ms`,
      target: '<= 50 ms',
      grade: gradeAtMost(frames.rawMaxFrameMs, [50, 66, 80, 100, 120, 150]),
    },
    {
      id: 'stutterRate',
      label: 'Taxa de engasgos',
      value: `${stutterRate.toFixed(1)}%`,
      target: '<= 0.5%',
      grade: gradeAtMost(stutterRate, [0.5, 1, 2, 4, 7, 12]),
    },
    {
      id: 'answerIntervalMs',
      label: 'Intervalo de acerto',
      value: `${avgAnswerIntervalMs} ms`,
      target: '<= 700 ms',
      grade: gradeAtMost(avgAnswerIntervalMs, [700, 760, 830, 910, 1000, 1150]),
    },
  ]
}
