const TIMER_BY_LEVEL_MS = [12_000, 11_000, 10_000, 9_000, 7_000] as const

export function scoreToLevel(score: number): number {
  return Math.min(5, Math.floor(score / 50) + 1)
}

export function levelTimerMs(level: number): number {
  const index = Math.min(Math.max(level, 1), 5) - 1
  return TIMER_BY_LEVEL_MS[index]
}

export function levelTimerSeconds(level: number): number {
  return levelTimerMs(level) / 1000
}

export function backgroundScrollDuration(level: number): number {
  const durations = [48, 36, 28, 20, 14]
  const index = Math.min(Math.max(level, 1), 5) - 1
  return durations[index]
}
