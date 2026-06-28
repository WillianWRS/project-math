import type { BenchmarkMetricGradeId, BenchmarkMetrics } from '../../../engine/benchmark-types'

export function benchmarkGradeTone(grade: string): string {
  switch (grade) {
    case 'S':
      return 'text-emerald-300'
    case 'A':
      return 'text-lime-300'
    case 'B':
      return 'text-amber-300'
    case 'C':
      return 'text-orange-300'
    case 'D':
      return 'text-orange-400'
    case 'E':
      return 'text-rose-300'
    default:
      return 'text-rose-400'
  }
}

export const BENCHMARK_METRIC_ORDER = [
  'fps',
  'avgFrameMs',
  'p95FrameMs',
  'p99FrameMs',
  'rawMaxFrameMs',
  'stutterRate',
  'answerIntervalMs',
] as const satisfies BenchmarkMetricGradeId[]

export function gradeForMetric(metrics: BenchmarkMetrics, id: BenchmarkMetricGradeId) {
  return metrics.grades.find((grade) => grade.id === id)
}

export function benchmarkPhaseSeverityTone(severity: 'ok' | 'warn' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return 'text-rose-300'
    case 'warn':
      return 'text-amber-300'
    default:
      return 'text-stone-300'
  }
}
