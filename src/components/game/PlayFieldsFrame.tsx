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
  timerDangerActive?: boolean
  children: ReactNode
}

export function PlayFieldsFrame({
  level,
  levelUpFlash,
  burstScore,
  waterLight,
  borderActive,
  timerDangerActive = false,
  children,
}: PlayFieldsFrameProps) {
  const reduceMotion = useReducedMotion()
  const burstLevel = levelUpFlash ?? level
  const normalizedLevel = Math.min(Math.max(level, 1), 12)
  const pulseDurationSeconds = Math.max(0.56, 1.08 - (normalizedLevel - 1) * 0.03)
  const pulseScale = Math.min(1.0155, 1.006 + normalizedLevel * 0.0008)
  const ringMixClass = `game-play-frame-ring--danger-mix${
    waterLight ? ' game-play-frame-ring--water' : ''
  }`

  return (
    <div className="game-play-stack-frame relative w-full max-w-[var(--game-main-column-width)]">
      {borderActive && (
        <div
          className={`game-play-frame-ring border-2 ${ringMixClass}${
            reduceMotion ? ' game-play-frame-ring--reduced' : ' game-play-frame-ring--animated'
          }${timerDangerActive && !reduceMotion ? ' game-play-frame-ring--danger-animated' : ''}`}
          style={
            reduceMotion
              ? ({ ['--danger-glow-intensity' as const]: 'var(--timer-danger-strength, 0)' } as CSSProperties)
              : ({
                  ['--danger-glow-intensity' as const]: 'var(--timer-danger-strength, 0)',
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
            className={`game-play-frame-ring game-play-frame-ring--burst border-2 ${ringMixClass}`}
            style={
              { ['--danger-glow-intensity' as const]: 'var(--timer-danger-strength, 0)' } as CSSProperties
            }
            initial={{ scale: 1, opacity: 0.95 }}
            animate={{ scale: playBurstScaleMax(burstLevel), opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : LEVEL_UP_BURST_TRANSITION}
            aria-hidden
          />
          <motion.div
            key={`burst-glow-${burstScore}`}
            className="game-play-frame-ring game-play-frame-ring--burst-glow rounded-[1.65rem] border-2 border-amber-400/60"
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
