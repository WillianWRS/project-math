export type BenchmarkPhaseId =
  | 'ritmo-l5'
  | 'auto-check-ciclo'
  | 'auto-check-uso'
  | 'gc-plus'
  | 'gc-minus'
  | 'gc-4s'
  | 'gc-mult-div'

export type BenchmarkCycle = 'autoCheck' | 'plus' | 'minus' | 'fourSeconds' | 'timesDiv'

export interface BenchmarkPhaseTiming {
  id: BenchmarkPhaseId
  label: string
  durationMs: number
  answers: number
}

export interface BenchmarkFrameStats {
  samples: number
  avgFrameMs: number
  maxFrameMs: number
  rawMaxFrameMs: number
  p95FrameMs: number
  p99FrameMs: number
  jankFrames: number
  estimatedFps: number
}

export type BenchmarkGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type BenchmarkMetricGradeId =
  | 'fps'
  | 'avgFrameMs'
  | 'p95FrameMs'
  | 'maxFrameMs'
  | 'jankRate'
  | 'answerIntervalMs'

export interface BenchmarkMetricGrade {
  id: BenchmarkMetricGradeId
  label: string
  value: string
  target: string
  grade: BenchmarkGrade
}

export type BenchmarkVirtualKey = `digit-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | 'auto' | 'enter'

export interface BenchmarkMetrics {
  totalDurationMs: number
  totalAnswers: number
  avgAnswerIntervalMs: number
  rhythmLevelReached: number
  phases: BenchmarkPhaseTiming[]
  frames: BenchmarkFrameStats
  grades: BenchmarkMetricGrade[]
  completed: boolean
  interrupted: boolean
}

export const BENCHMARK_PHASE_LABELS: Record<BenchmarkPhaseId, string> = {
  'ritmo-l5': 'Ritmo → L5',
  'auto-check-ciclo': 'Ciclo auto-check',
  'auto-check-uso': 'Uso auto-check',
  'gc-plus': 'Game changer ↑99',
  'gc-minus': 'Game changer ↓1',
  'gc-4s': 'Game changer 4s',
  'gc-mult-div': 'Game changer ×÷',
}

export const BENCHMARK_PHASE_ORDER: BenchmarkPhaseId[] = [
  'ritmo-l5',
  'auto-check-ciclo',
  'auto-check-uso',
  'gc-plus',
  'gc-minus',
  'gc-4s',
  'gc-mult-div',
]
