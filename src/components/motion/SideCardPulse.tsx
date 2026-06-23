import type { ReactNode } from 'react'
import { useReducedMotion } from '../../lib/motion'

interface SideCardPulseProps {
  children: ReactNode
  iconPulse?: 'up' | 'down' | 'scale' | 'glyph' | 'none'
}

export function SideCardPulse({ children, iconPulse = 'none' }: SideCardPulseProps) {
  const reduceMotion = useReducedMotion()
  const rootClass = reduceMotion ? 'game-side-card-pulse' : 'game-side-card-pulse game-side-card-pulse--animated'
  const iconClass =
    iconPulse === 'none' || reduceMotion
      ? 'game-side-card__content'
      : `game-side-card__content game-side-card__content--pulse-${iconPulse}`

  return (
    <div className={rootClass}>
      {iconPulse === 'none' ? (
        children
      ) : (
        <div className={iconClass}>
          {children}
        </div>
      )}
    </div>
  )
}
