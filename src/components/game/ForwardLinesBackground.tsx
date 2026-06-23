import { memo, type CSSProperties } from 'react'
import { useReducedMotion } from '../../lib/motion'
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
  const reduceMotion = useReducedMotion()
  const speedFactor =
    (48 / rhythmBackgroundScrollDuration(rhythmLevel)) * LINE_SPEED_BOOST * speedMultiplier
  const lineClass = theme === 'water' ? 'forward-line forward-line--water' : 'forward-line'
  const animated = active && !reduceMotion

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {FORWARD_LINES.map((line) => {
        const duration = line.duration / speedFactor
        const style = {
          height: line.height,
          left: `${line.left}%`,
          '--forward-opacity': String(line.opacity),
          '--forward-duration': `${duration}s`,
          '--forward-delay': `${line.delay}s`,
        } as CSSProperties & Record<'--forward-opacity' | '--forward-duration' | '--forward-delay', string>

        return (
          <span
            key={line.id}
            className={`absolute top-0 w-px rounded-full ${lineClass} ${
              animated ? 'forward-line--animated' : 'forward-line--idle'
            }`}
            style={style}
          />
        )
      })}
    </div>
  )
})
