export const TIMER_DANGER_GLOW_START_RATIO = 0.25
export const TIMER_DANGER_GLOW_MAX_RATIO = 0.1

/** 0 em ≥25% restante; sobe linearmente até 1 em ≤10% restante. */
export function timerDangerGlowIntensity(ratio: number): number {
  if (ratio >= TIMER_DANGER_GLOW_START_RATIO) return 0
  if (ratio <= TIMER_DANGER_GLOW_MAX_RATIO) return 1
  return (
    (TIMER_DANGER_GLOW_START_RATIO - ratio) /
    (TIMER_DANGER_GLOW_START_RATIO - TIMER_DANGER_GLOW_MAX_RATIO)
  )
}
