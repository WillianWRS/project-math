import { motion, useReducedMotion } from '../../lib/motion'
import {
  LEVEL_UP_BURST_TRANSITION,
  playBurstScaleMax,
  playRingScaleEnd,
} from '../../lib/motion-presets'

export type SideCardBurstVariant = 'legendary' | 'timer' | 'mult-div' | 'cap-up' | 'cap-down'

const BURST_VARIANT_CLASS: Record<SideCardBurstVariant, string> = {
  legendary: 'game-side-card-burst-ring--legendary',
  timer: 'game-side-card-burst-ring--timer',
  'mult-div': 'game-side-card-burst-ring--mult-div',
  'cap-up': 'game-side-card-burst-ring--cap-up',
  'cap-down': 'game-side-card-burst-ring--cap-down',
}

const BURST_ANCHOR_CLASS: Record<SideCardBurstVariant, string> = {
  legendary: 'game-side-activate-burst-anchor--legendary',
  timer: 'game-side-activate-burst-anchor--timer',
  'mult-div': 'game-side-activate-burst-anchor--mult-div',
  'cap-up': 'game-side-activate-burst-anchor--cap-up',
  'cap-down': 'game-side-activate-burst-anchor--cap-down',
}

interface SideCardActivateBurstProps {
  variant: SideCardBurstVariant
  onComplete: () => void
}

export function SideCardActivateBurst({
  variant,
  onComplete,
}: SideCardActivateBurstProps) {
  const reduceMotion = useReducedMotion()
  const toneClass = BURST_VARIANT_CLASS[variant]
  const burstScale = playBurstScaleMax(5)
  const glowScale = playRingScaleEnd(5)

  if (reduceMotion) {
    return null
  }

  return (
    <div
      className={`game-side-activate-burst-anchor ${BURST_ANCHOR_CLASS[variant]}`}
      aria-hidden
    >
      <motion.div
        className={`game-side-card-burst-ring game-side-card-burst-ring--inner border-2 ${toneClass}`}
        initial={{ scale: 1, opacity: 0.95 }}
        animate={{ scale: burstScale, opacity: 0 }}
        transition={LEVEL_UP_BURST_TRANSITION}
        onAnimationComplete={onComplete}
      />
      <motion.div
        className={`game-side-card-burst-ring game-side-card-burst-ring--glow border-2 ${toneClass}`}
        initial={{ scale: 0.96, opacity: 0.9 }}
        animate={{ scale: glowScale, opacity: 0 }}
        transition={LEVEL_UP_BURST_TRANSITION}
      />
    </div>
  )
}
