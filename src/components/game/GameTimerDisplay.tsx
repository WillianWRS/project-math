import { memo } from 'react'
import { motion, useReducedMotion } from '../../lib/motion'
import { pulseRepeat } from '../../lib/motion-presets'
import { useGameTimer } from '../../hooks/useGameTimer'
import { formatDuration } from '../../engine/rewards'

export const ElapsedTimeLabel = memo(function ElapsedTimeLabel({
  fallbackMs = 0,
}: {
  fallbackMs?: number
}) {
  const { elapsedMs } = useGameTimer()
  return <>{formatDuration(elapsedMs || fallbackMs)}</>
})

function TimerSpark({ urgent }: { urgent: boolean }) {
  const reduceMotion = useReducedMotion()

  return (
    <>
      <motion.span
        className={`timer-spark-trail pointer-events-none absolute right-1 top-0 h-full w-5 bg-gradient-to-l to-transparent ${
          urgent ? 'from-rose-200/70' : 'from-white/45'
        }`}
        animate={reduceMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={pulseRepeat(urgent ? 0.3 : 0.45)}
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
        animate={reduceMotion ? undefined : { scale: [0.85, 1.2, 0.85], opacity: [0.75, 1, 0.75] }}
        transition={pulseRepeat(urgent ? 0.3 : 0.45)}
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
  const ratio = timerMaxMs > 0 ? Math.max(0, timerMs / timerMaxMs) : 0
  const urgent = ratio < 0.25
  const showSpark = ratio > 0.015

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated">
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
        {showSpark && <TimerSpark urgent={urgent} />}
      </motion.div>
    </div>
  )
})
