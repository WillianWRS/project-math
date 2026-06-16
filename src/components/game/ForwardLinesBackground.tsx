import { useMemo } from 'react'
import { backgroundScrollDuration } from '../../engine/level-system'
import { FORWARD_LINES } from './forward-lines-config'
import { useMobileLayout } from '../../hooks/useMobileLayout'

interface ForwardLinesBackgroundProps {
  active: boolean
  level: number
  speedMultiplier?: number
  theme?: 'default' | 'water'
}

const LINE_SPEED_BOOST = 2.8
const MOBILE_LINE_COUNT = 16

export function ForwardLinesBackground({
  active,
  level,
  speedMultiplier = 1,
  theme = 'default',
}: ForwardLinesBackgroundProps) {
  const isMobile = useMobileLayout()
  const speedFactor = (48 / backgroundScrollDuration(level)) * LINE_SPEED_BOOST * speedMultiplier
  const lines = useMemo(
    () => (isMobile ? FORWARD_LINES.slice(0, MOBILE_LINE_COUNT) : FORWARD_LINES),
    [isMobile],
  )
  const lineClass = theme === 'water' ? 'forward-line forward-line--water' : 'forward-line'

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {lines.map((line) => (
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
}
