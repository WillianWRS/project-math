import { motion, useReducedMotion } from '../../lib/motion'
import {
  LEVEL_UP_BURST_TRANSITION,
  playBurstScaleMax,
  playRingScaleEnd,
} from '../../lib/motion-presets'
import type { CSSProperties, ReactNode } from 'react'

interface PlayFieldsFrameProps {
  level: number
  levelUpFlash: number | null
  burstScore: number
  waterLight: boolean
  borderActive: boolean
  timerDanger?: boolean
  children: ReactNode
}

export function PlayFieldsFrame({
  level,
  levelUpFlash,
  burstScore,
  waterLight,
  borderActive,
  timerDanger = false,
  children,
}: PlayFieldsFrameProps) {
  const reduceMotion = useReducedMotion()
  const burstLevel = levelUpFlash ?? level
  const normalizedLevel = Math.min(Math.max(level, 1), 12)
  const pulseDurationSeconds = Math.max(0.56, 1.08 - (normalizedLevel - 1) * 0.03)
  const pulseScale = Math.min(1.0155, 1.006 + normalizedLevel * 0.0008)
  const ringClass = timerDanger
    ? 'border-rose-400/90 shadow-[0_0_22px_rgba(251,113,133,0.5)]'
    : waterLight
      ? 'border-amber-500/80 shadow-[0_0_18px_rgba(251,191,36,0.35)]'
      : 'border-amber-400/75 shadow-[0_0_16px_rgba(251,191,36,0.28)]'

  return (
    <div className="game-play-stack-frame relative w-full max-w-[var(--game-main-column-width)]">
      {borderActive && (
        <div
          className={`pointer-events-none absolute inset-0 z-[3] rounded-3xl border-2 ${ringClass}${
            reduceMotion ? ' game-play-frame-ring--reduced' : ' game-play-frame-ring--animated'
          }`}
          style={
            reduceMotion
              ? undefined
              : ({
                  ['--play-frame-pulse-duration' as const]: `${pulseDurationSeconds}s`,
                  ['--play-frame-pulse-scale' as const]: String(pulseScale),
                } as CSSProperties)
          }
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
