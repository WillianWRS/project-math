import { memo } from 'react'
import { rhythmBackgroundScrollDuration } from '../../engine/level-system'
import { FORWARD_LINES } from './forward-lines-config'

interface ForwardLinesBackgroundProps {
  active: boolean
  rhythmLevel: number
  speedMultiplier?: number
  theme?: 'default' | 'water'
}

const LINE_SPEED_BOOST = 2.8

export const ForwardLinesBackground = memo(function ForwardLinesBackground({
  active,
  rhythmLevel,
  speedMultiplier = 1,
  theme = 'default',
}: ForwardLinesBackgroundProps) {
  const speedFactor =
    (48 / rhythmBackgroundScrollDuration(rhythmLevel)) * LINE_SPEED_BOOST * speedMultiplier
  const lineClass = theme === 'water' ? 'forward-line forward-line--water' : 'forward-line'

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {FORWARD_LINES.map((line) => (
        <span
          key={line.id}
          className={`absolute top-0 w-px rounded-full ${lineClass}`}
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
})
