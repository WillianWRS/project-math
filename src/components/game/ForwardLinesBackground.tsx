import { memo } from 'react'
import { motion, useReducedMotion } from '../../lib/motion'
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

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {FORWARD_LINES.map((line) => {
        const duration = line.duration / speedFactor

        return (
          <motion.span
            key={line.id}
            className={`absolute top-0 w-px rounded-full ${lineClass}`}
            style={{
              height: line.height,
              left: `${line.left}%`,
              opacity: line.opacity,
            }}
            initial={{ y: '-12px', opacity: 0 }}
            animate={
              reduceMotion || !active
                ? { y: '-12px', opacity: 0 }
                : {
                    y: ['-12px', 'calc(100dvh + 24px)'],
                    opacity: [0, line.opacity, line.opacity, 0],
                  }
            }
            transition={
              reduceMotion || !active
                ? { duration: 0.2 }
                : {
                    duration,
                    delay: line.delay,
                    repeat: Infinity,
                    ease: 'linear',
                    times: [0, 0.08, 0.92, 1],
                  }
            }
          />
        )
      })}
    </div>
  )
})
