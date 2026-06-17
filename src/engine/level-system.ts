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
  // Quanto menor, mais rápido. Progressão suave entre níveis (L1→L5 ≈ 4×).
  const durations = [48, 34, 24, 17, 12]
  const index = Math.min(Math.max(level, 1), 5) - 1
  return durations[index]
}

const SCORE_MILESTONE_START = 300
const SCORE_MILESTONE_INTERVAL = 100

/** Dispara o burst da moldura ao cruzar 300 pts e a cada +100 depois disso. */
export function crossedScoreMilestoneBurst(previousScore: number, score: number): boolean {
  if (score < SCORE_MILESTONE_START) return false

  const previousBand =
    previousScore < SCORE_MILESTONE_START
      ? -1
      : Math.floor((previousScore - SCORE_MILESTONE_START) / SCORE_MILESTONE_INTERVAL)

  const nextBand = Math.floor((score - SCORE_MILESTONE_START) / SCORE_MILESTONE_INTERVAL)
  return nextBand > previousBand
}
