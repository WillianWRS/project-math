import { backgroundScrollDuration } from '../../engine/level-system'
import { FORWARD_LINES } from './forward-lines-config'

interface ForwardLinesBackgroundProps {
  active: boolean
  level: number
  speedMultiplier?: number
}

const LINE_SPEED_BOOST = 2.8

export function ForwardLinesBackground({
  active,
  level,
  speedMultiplier = 1,
}: ForwardLinesBackgroundProps) {
  const speedFactor = (48 / backgroundScrollDuration(level)) * LINE_SPEED_BOOST * speedMultiplier

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {FORWARD_LINES.map((line) => (
        <span
          key={line.id}
          className="forward-line absolute top-0 w-px rounded-full bg-[var(--color-charcoal-line)]"
          style={{
            height: line.height,
            left: `${line.left}%`,
            opacity: line.opacity,
            animationDuration: `${line.duration / speedFactor}s`,
            animationDelay: `${line.delay}s`,
            animationPlayState: active ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  )
}
