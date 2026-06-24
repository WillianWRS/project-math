import { memo, useEffect, type RefObject } from 'react'
import { useGameTimer } from '../../hooks/useGameTimer'
import { timerDangerGlowIntensity } from '../../lib/timer-danger-glow'

interface TimerDangerOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>
  isPlaying: boolean
  timerMaxMs: number
  fallbackTimerMs: number
  onDangerActiveChange?: (active: boolean) => void
}

const DANGER_EPSILON = 0.001

export const TimerDangerOverlay = memo(function TimerDangerOverlay({
  containerRef,
  isPlaying,
  timerMaxMs,
  fallbackTimerMs,
  onDangerActiveChange,
}: TimerDangerOverlayProps) {
  const { timerMs } = useGameTimer()
  const timerNowMs = isPlaying ? timerMs : fallbackTimerMs
  const timerRatio = timerMaxMs > 0 ? Math.max(0, timerNowMs / timerMaxMs) : 0
  const timerDangerGlow = isPlaying ? timerDangerGlowIntensity(timerRatio) : 0
  const dangerActive = timerDangerGlow > DANGER_EPSILON

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const strength = String(timerDangerGlow)
    container.style.setProperty('--timer-danger-strength', strength)
    container.style.setProperty('--danger-glow-intensity', strength)
  }, [containerRef, timerDangerGlow])

  useEffect(() => {
    onDangerActiveChange?.(dangerActive)
  }, [dangerActive, onDangerActiveChange])

  if (!dangerActive) return null

  return (
    <>
      <div
        className="game-scene-danger-vignette pointer-events-none fixed inset-0 z-[40]"
        style={{ opacity: timerDangerGlow * 0.9 }}
        aria-hidden
      />
    </>
  )
})
