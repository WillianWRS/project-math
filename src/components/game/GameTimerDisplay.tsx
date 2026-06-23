import { memo } from 'react'
import { useReducedMotion } from '../../lib/motion'
import { useGameTimer } from '../../hooks/useGameTimer'
import { formatDuration } from '../../engine/rewards'

export const TIMER_URGENT_RATIO = 0.25
export const TIMER_NEAR_DEATH_RATIO = 0.2

export const ElapsedTimeLabel = memo(function ElapsedTimeLabel({
  fallbackMs = 0,
}: {
  fallbackMs?: number
}) {
  const { elapsedMs } = useGameTimer()
  return <>{formatDuration(elapsedMs > 0 ? elapsedMs : fallbackMs)}</>
})

function TimerSpark({ urgent, nearDeath }: { urgent: boolean; nearDeath: boolean }) {
  const reduceMotion = useReducedMotion()
  const animationClass = reduceMotion
    ? ''
    : nearDeath
      ? ' timer-spark--near-death'
      : ' timer-spark--urgent'

  return (
    <>
      <span
        className={`timer-spark-trail pointer-events-none absolute right-1 top-0 h-full w-5 bg-gradient-to-l to-transparent ${
          urgent ? 'from-rose-200/70' : 'from-white/45'
        }${animationClass}`}
        aria-hidden
      />
      <span
        className={`timer-spark-dot pointer-events-none absolute right-0 top-1/2 z-10 h-2 w-2 rounded-full ${
          urgent ? 'bg-rose-50' : 'bg-white'
        }${animationClass}`}
        style={{
          boxShadow: urgent
            ? '0 0 4px 1px rgba(255,240,240,1), 0 0 10px 3px rgba(255,120,120,0.55)'
            : '0 0 4px 1px rgba(255,255,255,0.95), 0 0 10px 3px rgba(255,255,255,0.45)',
        }}
        aria-hidden
      />
    </>
  )
}

export const PlayingTimerBar = memo(function PlayingTimerBar({
  timerMaxMs,
}: {
  timerMaxMs: number
}) {
  const { timerMs } = useGameTimer()
  const reduceMotion = useReducedMotion()
  const ratio = timerMaxMs > 0 ? Math.max(0, timerMs / timerMaxMs) : 0
  const urgent = ratio < TIMER_URGENT_RATIO
  const nearDeath = ratio < TIMER_NEAR_DEATH_RATIO
  const showSpark = ratio > 0.015

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated${
        !reduceMotion && nearDeath ? ' timer-bar-shell--near-death' : ''
      }`}
      style={
        nearDeath
          ? {
              boxShadow:
                '0 0 0 1px rgba(251,113,133,0.22), 0 0 14px -4px rgba(251,113,133,0.58), 0 0 24px -10px rgba(251,113,133,0.7)',
            }
          : undefined
      }
    >
      <div
        className="timer-bar-fill"
        style={{ width: `${ratio * 100}%` }}
      >
        <div
          className={`timer-bar-fill__gradient h-full w-full ${
            urgent
              ? 'bg-gradient-to-r from-rose-700 via-rose-500 to-rose-300'
              : 'bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200'
          }`}
        />
        {showSpark && <TimerSpark urgent={urgent} nearDeath={nearDeath} />}
      </div>
    </div>
  )
})
