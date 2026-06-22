import { motion, useReducedMotion } from '../../lib/motion'
import {
  LEVEL_UP_BURST_TRANSITION,
  playBurstScaleMax,
  playPulseDuration,
  playPulseScaleMax,
  playRingScaleEnd,
  pulseRepeat,
} from '../../lib/motion-presets'
import type { ReactNode } from 'react'

interface PlayFieldsFrameProps {
  level: number
  levelUpFlash: number | null
  burstScore: number
  waterLight: boolean
  borderActive: boolean
  children: ReactNode
}

export function PlayFieldsFrame({
  level,
  levelUpFlash,
  burstScore,
  waterLight,
  borderActive,
  children,
}: PlayFieldsFrameProps) {
  const reduceMotion = useReducedMotion()
  const burstLevel = levelUpFlash ?? level
  const pulseDuration = playPulseDuration(level)
  const pulseScale = playPulseScaleMax(level)
  const ringClass = waterLight
    ? 'border-amber-500/80 shadow-[0_0_18px_rgba(251,191,36,0.35)]'
    : 'border-amber-400/75 shadow-[0_0_16px_rgba(251,191,36,0.28)]'

  return (
    <div className="game-play-stack-frame relative w-full max-w-[var(--game-main-column-width)]">
      {borderActive && (
        <motion.div
          className={`pointer-events-none absolute inset-0 z-[3] rounded-3xl border-2 ${ringClass}`}
          animate={
            reduceMotion
              ? { opacity: 0.75, scale: 1 }
              : { opacity: [0.45, 0.95, 0.45], scale: [1, pulseScale, 1] }
          }
          transition={reduceMotion ? undefined : pulseRepeat(pulseDuration)}
          aria-hidden
        />
      )}

      {levelUpFlash !== null && (
        <>
          <motion.div
            key={`burst-ring-${burstScore}`}
            className={`pointer-events-none absolute inset-0 z-[2] rounded-3xl border-2 ${ringClass}`}
            initial={{ scale: 1, opacity: 0.95 }}
            animate={{ scale: playBurstScaleMax(burstLevel), opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : LEVEL_UP_BURST_TRANSITION}
            aria-hidden
          />
          <motion.div
            key={`burst-glow-${burstScore}`}
            className="pointer-events-none absolute -inset-1 z-[1] rounded-[1.65rem] border-2 border-amber-400/60"
            initial={{ scale: 0.96, opacity: 0.9 }}
            animate={{ scale: playRingScaleEnd(burstLevel), opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : LEVEL_UP_BURST_TRANSITION}
            aria-hidden
          />
        </>
      )}

      {children}
    </div>
  )
}
