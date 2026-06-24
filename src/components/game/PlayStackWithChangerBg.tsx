import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '../../lib/motion'
import { GAME_CHANGER_BURST_MS } from '../../lib/motion-presets'

export type PlayStackChangerTheme = 'four-seconds' | 'times-div' | 'plus-cycle' | 'minus-cycle'

const CHANGER_STACK_CLASS: Record<PlayStackChangerTheme, string> = {
  'four-seconds': 'game-play-stack--four-seconds',
  'times-div': 'game-play-stack--times-div',
  'plus-cycle': 'game-play-stack--plus-cycle',
  'minus-cycle': 'game-play-stack--minus-cycle',
}

interface PlayStackWithChangerBgProps {
  baseClassName: string
  activeChangerTheme: PlayStackChangerTheme | null
  timerDanger?: boolean
  children: ReactNode
}

export function PlayStackWithChangerBg({
  baseClassName,
  activeChangerTheme,
  timerDanger = false,
  children,
}: PlayStackWithChangerBgProps) {
  const reduceMotion = useReducedMotion()
  const [overlayTheme, setOverlayTheme] = useState<PlayStackChangerTheme | null>(null)
  const [overlayPhase, setOverlayPhase] = useState<'enter' | 'exit' | 'steady' | null>(null)
  const prevThemeRef = useRef(activeChangerTheme)

  useEffect(() => {
    const prev = prevThemeRef.current
    prevThemeRef.current = activeChangerTheme

    if (prev === activeChangerTheme) return

    let enterTimeout = 0
    let exitTimeout = 0
    let cancelled = false

    const frame = requestAnimationFrame(() => {
      if (cancelled) return

      if (reduceMotion) {
        setOverlayTheme(activeChangerTheme)
        setOverlayPhase(activeChangerTheme ? 'steady' : null)
        return
      }

      if (!prev && activeChangerTheme) {
        setOverlayTheme(activeChangerTheme)
        setOverlayPhase('enter')
        enterTimeout = window.setTimeout(() => {
          if (!cancelled) setOverlayPhase('steady')
        }, GAME_CHANGER_BURST_MS)
        return
      }

      if (prev && !activeChangerTheme) {
        setOverlayPhase('exit')
        exitTimeout = window.setTimeout(() => {
          if (!cancelled) {
            setOverlayTheme(null)
            setOverlayPhase(null)
          }
        }, GAME_CHANGER_BURST_MS)
        return
      }

      if (prev && activeChangerTheme) {
        setOverlayPhase('exit')
        exitTimeout = window.setTimeout(() => {
          if (!cancelled) {
            setOverlayTheme(activeChangerTheme)
            setOverlayPhase('enter')
            enterTimeout = window.setTimeout(() => {
              if (!cancelled) setOverlayPhase('steady')
            }, GAME_CHANGER_BURST_MS)
          }
        }, GAME_CHANGER_BURST_MS)
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(enterTimeout)
      window.clearTimeout(exitTimeout)
    }
  }, [activeChangerTheme, reduceMotion])

  const stackChangerClass = activeChangerTheme ? CHANGER_STACK_CLASS[activeChangerTheme] : ''
  const overlayChangerClass = overlayTheme ? CHANGER_STACK_CLASS[overlayTheme] : ''

  return (
    <div
      className={`game-play-stack game-play-stack--uses-changer-overlay w-full rounded-3xl ${baseClassName}${
        stackChangerClass ? ` ${stackChangerClass}` : ''
      }${timerDanger ? ' game-play-stack--timer-danger' : ''}`}
    >
      {overlayTheme && overlayPhase === 'exit' ? (
        <>
          <div
            className={`game-play-stack__changer-overlay ${overlayChangerClass} game-play-stack__changer-overlay--steady`}
            aria-hidden
          />
          <div
            className={`game-play-stack__base-reveal-overlay ${baseClassName} game-play-stack__base-reveal-overlay--reveal`}
            aria-hidden
          />
        </>
      ) : overlayTheme && overlayPhase ? (
        <div
          className={`game-play-stack__changer-overlay ${overlayChangerClass} game-play-stack__changer-overlay--${overlayPhase}`}
          aria-hidden
        />
      ) : null}
      <div className="game-play-stack__content">{children}</div>
    </div>
  )
}
