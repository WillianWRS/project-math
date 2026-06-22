import { memo } from 'react'
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
      <div
        className="timer-bar-fill relative h-full rounded-full transition-[width] duration-100 ease-linear"
        style={{ width: `${ratio * 100}%` }}
      >
        <div
          className={`h-full w-full rounded-full ${
            urgent
              ? 'bg-gradient-to-r from-rose-700 via-rose-500 to-rose-300'
              : 'bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200'
          }`}
        />
        {showSpark && (
          <>
            <span
              className={`timer-spark-trail pointer-events-none absolute right-1 top-0 h-full w-5 bg-gradient-to-l to-transparent ${
                urgent ? 'from-rose-200/70' : 'from-white/45'
              }`}
              aria-hidden
            />
            <span
              className={`pointer-events-none absolute right-0 top-1/2 z-10 h-2 w-2 rounded-full ${
                urgent ? 'timer-spark-urgent bg-rose-50' : 'timer-spark bg-white'
              }`}
              aria-hidden
            />
          </>
        )}
      </div>
    </div>
  )
})
