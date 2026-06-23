import { memo } from 'react'
import { motion, useReducedMotion } from '../../lib/motion'
import { pulseRepeat } from '../../lib/motion-presets'
import { useGameTimer } from '../../hooks/useGameTimer'
import { formatDuration } from '../../engine/rewards'

const HEARTBEAT_CYCLE_SECONDS = 0.82
const HEARTBEAT_TIMES = [0, 0.14, 0.26, 0.56, 1]
export const TIMER_URGENT_RATIO = 0.25
export const TIMER_NEAR_DEATH_RATIO = 0.2

export const ElapsedTimeLabel = memo(function ElapsedTimeLabel({
  fallbackMs = 0,
}: {
  fallbackMs?: number
}) {
  const { elapsedMs } = useGameTimer()
  return <>{formatDuration(elapsedMs || fallbackMs)}</>
})

function TimerSpark({ urgent, nearDeath }: { urgent: boolean; nearDeath: boolean }) {
  const reduceMotion = useReducedMotion()
  const nearDeathTransition = { duration: HEARTBEAT_CYCLE_SECONDS, repeat: Infinity, times: HEARTBEAT_TIMES }

  return (
    <>
      <motion.span
        className={`timer-spark-trail pointer-events-none absolute right-1 top-0 h-full w-5 bg-gradient-to-l to-transparent ${
          urgent ? 'from-rose-200/70' : 'from-white/45'
        }`}
        animate={
          reduceMotion
            ? undefined
            : nearDeath
              ? { opacity: [0.52, 1, 0.68, 0.9, 0.52] }
              : { opacity: [0.5, 1, 0.5] }
        }
        transition={nearDeath ? nearDeathTransition : pulseRepeat(urgent ? 0.3 : 0.45)}
        aria-hidden
      />
      <motion.span
        className={`pointer-events-none absolute right-0 top-1/2 z-10 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full ${
          urgent ? 'bg-rose-50' : 'bg-white'
        }`}
        style={{
          boxShadow: urgent
            ? '0 0 4px 1px rgba(255,240,240,1), 0 0 10px 3px rgba(255,120,120,0.55)'
            : '0 0 4px 1px rgba(255,255,255,0.95), 0 0 10px 3px rgba(255,255,255,0.45)',
        }}
        animate={
          reduceMotion
            ? undefined
            : nearDeath
              ? { scale: [0.82, 1.34, 0.96, 1.2, 0.82], opacity: [0.75, 1, 0.84, 0.96, 0.75] }
              : { scale: [0.85, 1.2, 0.85], opacity: [0.75, 1, 0.75] }
        }
        transition={nearDeath ? nearDeathTransition : pulseRepeat(urgent ? 0.3 : 0.45)}
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
  const nearDeathTransition = { duration: HEARTBEAT_CYCLE_SECONDS, repeat: Infinity, times: HEARTBEAT_TIMES }

  return (
    <motion.div
      className="h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated"
      animate={
        reduceMotion || !nearDeath
          ? undefined
          : {
              scale: [1, 1.04, 0.992, 1.022, 1],
              opacity: [0.92, 1, 0.95, 0.99, 0.92],
            }
      }
      transition={nearDeath ? nearDeathTransition : undefined}
      style={
        nearDeath
          ? {
              boxShadow:
                '0 0 0 1px rgba(251,113,133,0.22), 0 0 14px -4px rgba(251,113,133,0.58), 0 0 24px -10px rgba(251,113,133,0.7)',
            }
          : undefined
      }
    >
      <motion.div
        className="timer-bar-fill relative h-full rounded-full"
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.1, ease: 'linear' }}
      >
        <div
          className={`h-full w-full rounded-full ${
            urgent
              ? 'bg-gradient-to-r from-rose-700 via-rose-500 to-rose-300'
              : 'bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200'
          }`}
        />
        {showSpark && <TimerSpark urgent={urgent} nearDeath={nearDeath} />}
      </motion.div>
    </motion.div>
  )
})
