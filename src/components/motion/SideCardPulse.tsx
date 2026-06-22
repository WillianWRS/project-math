import type { ReactNode } from 'react'
import { motion, useReducedMotion } from '../../lib/motion'
import { pulseRepeat } from '../../lib/motion-presets'

interface SideCardPulseProps {
  children: ReactNode
  iconPulse?: 'up' | 'down' | 'scale' | 'glyph' | 'none'
}

const ICON_PULSE: Record<
  Exclude<SideCardPulseProps['iconPulse'], 'none' | undefined>,
  { y?: number[]; scale?: number[]; opacity?: number[] }
> = {
  up: { y: [2, -3, 2] },
  down: { y: [-2, 3, -2] },
  scale: { scale: [1, 1.12, 1] },
  glyph: { opacity: [0.85, 1, 0.85], scale: [1, 1.05, 1] },
}

export function SideCardPulse({ children, iconPulse = 'none' }: SideCardPulseProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="flex h-full w-full items-center justify-center"
      animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
      transition={pulseRepeat(2.1)}
    >
      {iconPulse === 'none' ? (
        children
      ) : (
        <motion.div
          className="game-side-card__content"
          animate={reduceMotion ? undefined : ICON_PULSE[iconPulse]}
          transition={pulseRepeat(iconPulse === 'scale' ? 1.5 : 1.7)}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}
