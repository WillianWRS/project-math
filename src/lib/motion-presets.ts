import { APP_EASE } from './motion-transitions'

export const CURTAIN_TRANSITION = { duration: 0.42, ease: APP_EASE } as const

export const SLIDE_TRANSITION = { duration: 0.28, ease: APP_EASE } as const

export const LEVEL_UP_BURST_TRANSITION = { duration: 0.9, ease: APP_EASE } as const

export function pulseRepeat(duration: number) {
  return { duration, repeat: Infinity, ease: 'easeInOut' as const }
}

export function playPulseDuration(level: number) {
  const lv = Math.min(Math.max(level, 1), 5)
  return 2.75 - lv * 0.2
}

export function playPulseScaleMax(level: number) {
  const lv = Math.min(Math.max(level, 1), 5)
  return 1.004 + lv * 0.007
}

export function playBurstScaleMax(level: number) {
  const lv = Math.min(Math.max(level, 1), 5)
  return 1.028 + lv * 0.014
}

export function playRingScaleEnd(level: number) {
  const lv = Math.min(Math.max(level, 1), 5)
  return 1.1 + lv * 0.03
}
