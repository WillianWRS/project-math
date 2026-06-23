import { AnimatePresence, motion } from '../../lib/motion'
import { memo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { DEBUG_AUTO_CHECK_ALWAYS_ENABLED } from '../../engine/game-state-machine'
import type { BenchmarkVirtualKey } from '../../engine/benchmark-types'

interface NumericKeypadProps {
  disabled?: boolean
  interactionLocked?: boolean
  backspaceDisabled?: boolean
  waterLight?: boolean
  autoCheckCharges?: number
  virtualPress?: { key: BenchmarkVirtualKey; token: number } | null
  onDigit: (digit: string) => void
  onBackspace: () => void
  onAutoCorrect: () => void
  onEnter: () => void
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

const autoCheckTransition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }

const keypadRevealEase = [0.22, 1, 0.36, 1] as const

const keypadReveal = {
  container: {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.01, delayChildren: 0.02 },
    },
  },
  key: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.14, ease: keypadRevealEase } },
  },
} as const

interface PremiumKeyProps {
  disabled: boolean
  variants: (typeof keypadReveal)['key']
  className?: string
  ariaLabel: string
  virtualPressed?: boolean
  virtualPressToken?: number | null
  forceVisible?: boolean
  whileTap?: { scale: number; y: number }
  onClick: () => void
  children: ReactNode
}

interface KeyRipple {
  id: number
  x: number
  y: number
  scale: number
  ghost: boolean
}

function PremiumKey({
  disabled,
  variants,
  className = '',
  ariaLabel,
  virtualPressed = false,
  virtualPressToken = null,
  forceVisible = false,
  whileTap,
  onClick,
  children,
}: PremiumKeyProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const rippleIdRef = useRef(0)
  const lastVirtualTokenRef = useRef<number | null>(null)
  const [pointerPressed, setPointerPressed] = useState(false)
  const [ripples, setRipples] = useState<KeyRipple[]>([])

  const removeRipple = useCallback((id: number) => {
    setRipples((current) => current.filter((ripple) => ripple.id !== id))
  }, [])

  const spawnRipple = useCallback((x: number, y: number, width: number, height: number, ghost: boolean) => {
    const dx = Math.max(x, Math.max(0, width - x))
    const dy = Math.max(y, Math.max(0, height - y))
    const radius = Math.hypot(dx, dy)
    const scale = Math.max(2.8, (radius * 2.3) / 12)
    rippleIdRef.current += 1
    const nextRipple: KeyRipple = { id: rippleIdRef.current, x, y, scale, ghost }
    setRipples((current) => [...current.slice(-2), nextRipple])
  }, [])

  useEffect(() => {
    if (!virtualPressed || virtualPressToken === null || virtualPressToken === lastVirtualTokenRef.current) return
    lastVirtualTokenRef.current = virtualPressToken
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    spawnRipple(rect.width / 2, rect.height / 2, rect.width, rect.height, true)
  }, [spawnRipple, virtualPressed, virtualPressToken])

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      variants={forceVisible ? undefined : variants}
      initial={forceVisible ? { opacity: 1 } : undefined}
      whileTap={disabled ? undefined : whileTap}
      animate={
        virtualPressed
          ? { scale: [1, 0.972, 1], y: [0, 1, 0], opacity: 1 }
          : forceVisible
            ? { opacity: 1, scale: 1, y: 0 }
            : undefined
      }
      transition={virtualPressed ? { duration: 0.24, ease: [0.22, 1, 0.36, 1] } : undefined}
      className={`game-numeric-keypad__key${className ? ` ${className}` : ''}${
        virtualPressed ? ' game-numeric-keypad__key--virtual-press game-numeric-keypad__key--ghost-press' : ''
      }${pointerPressed ? ' game-numeric-keypad__key--pointer-press' : ''}${
        forceVisible ? ' game-numeric-keypad__key--force-visible' : ''
      }`}
      onPointerDown={(event) => {
        if (disabled) return
        const rect = event.currentTarget.getBoundingClientRect()
        spawnRipple(
          event.clientX - rect.left,
          event.clientY - rect.top,
          rect.width,
          rect.height,
          false,
        )
        setPointerPressed(true)
      }}
      onPointerUp={() => setPointerPressed(false)}
      onPointerLeave={() => setPointerPressed(false)}
      onPointerCancel={() => setPointerPressed(false)}
      onKeyDown={(event) => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
          const rect = event.currentTarget.getBoundingClientRect()
          spawnRipple(rect.width / 2, rect.height / 2, rect.width, rect.height, false)
        }
      }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="game-numeric-keypad__press-surface" aria-hidden>
        <AnimatePresence initial={false}>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className={`game-numeric-keypad__ripple${ripple.ghost ? ' game-numeric-keypad__ripple--ghost' : ''}`}
              style={{ left: ripple.x, top: ripple.y }}
              initial={{ scale: 0, opacity: ripple.ghost ? 0.4 : 0.56 }}
              animate={{ scale: ripple.scale, opacity: 0 }}
              transition={{ duration: ripple.ghost ? 0.7 : 0.54, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => removeRipple(ripple.id)}
            />
          ))}
        </AnimatePresence>
      </span>
      <span className="game-numeric-keypad__key-content">{children}</span>
    </motion.button>
  )
}

function IconCheckSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 12.5l3.5 3.5L18 8"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 12.5l3.5 3.5L18 8"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBackspace() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6H20a1 1 0 011 1v10a1 1 0 01-1 1H9l-4.5-4.5a1 1 0 010-1.414L9 6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 9.5l3 3m0-3l-3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconProhibited() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path d="M7.5 7.5l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function AutoCheckButton({
  disabled,
  charges,
  virtualPressed,
  virtualPressToken,
  onAutoCorrect,
}: {
  disabled: boolean
  charges: number
  virtualPressed: boolean
  virtualPressToken: number | null
  onAutoCorrect: () => void
}) {
  const enabled = DEBUG_AUTO_CHECK_ALWAYS_ENABLED || charges > 0
  const displayCharges = DEBUG_AUTO_CHECK_ALWAYS_ENABLED ? 1 : charges
  const stateKey = enabled ? 'enabled' : 'disabled'

  return (
    <PremiumKey
      disabled={disabled || !enabled}
      variants={keypadReveal.key}
      whileTap={disabled || !enabled ? undefined : { scale: 0.97, y: 1 }}
      className={`game-numeric-keypad__key--auto${
        enabled ? ' game-numeric-keypad__key--debug' : ''
      }`}
      virtualPressed={virtualPressed}
      virtualPressToken={virtualPressToken}
      onClick={onAutoCorrect}
      aria-label={
        enabled
          ? DEBUG_AUTO_CHECK_ALWAYS_ENABLED
            ? 'Auto acerto (debug)'
            : `Auto acerto (${charges} uso${charges === 1 ? '' : 's'})`
          : 'Auto acerto indisponível'
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={stateKey}
          className="game-numeric-keypad__auto-state"
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.82, opacity: 0 }}
          transition={autoCheckTransition}
        >
          {enabled ? (
            <>
              <span className="game-numeric-keypad__reward-badge" aria-hidden>
                {displayCharges}
              </span>
              <span className="game-numeric-keypad__auto-content">
                <span className="game-numeric-keypad__auto-label">AUTO</span>
                <span className="game-numeric-keypad__auto-icon">
                  <IconCheckSmall />
                </span>
              </span>
            </>
          ) : (
            <span className="game-numeric-keypad__auto-icon game-numeric-keypad__auto-icon--prohibited">
              <IconProhibited />
            </span>
          )}
        </motion.span>
      </AnimatePresence>
    </PremiumKey>
  )
}

export const NumericKeypad = memo(function NumericKeypad({
  disabled = false,
  interactionLocked = false,
  backspaceDisabled = false,
  waterLight = false,
  autoCheckCharges = 0,
  virtualPress = null,
  onDigit,
  onBackspace,
  onAutoCorrect,
  onEnter,
}: NumericKeypadProps) {
  const keypadClass = waterLight ? 'game-numeric-keypad game-numeric-keypad--water' : 'game-numeric-keypad'
  const isVirtualPressed = (key: BenchmarkVirtualKey) => virtualPress?.key === key
  const digitVirtualKey = (digit: string) => `digit-${digit}` as BenchmarkVirtualKey
  const virtualToken = virtualPress?.token ?? null
  const effectiveDisabled = disabled && !interactionLocked

  return (
    <motion.div
      className={`${keypadClass} w-full max-w-xs${interactionLocked ? ' pointer-events-none select-none' : ''}`}
      aria-label="Teclado numérico"
      variants={keypadReveal.container}
      initial="hidden"
      animate="show"
      aria-disabled={interactionLocked ? 'true' : undefined}
    >
      {DIGIT_ROWS.map((row) => (
        <div key={row.join('-')} className="game-numeric-keypad__row">
          {row.map((digit) => (
            <PremiumKey
              key={digit}
              disabled={effectiveDisabled}
              variants={keypadReveal.key}
              whileTap={effectiveDisabled ? undefined : { scale: 0.97, y: 1 }}
              virtualPressed={isVirtualPressed(digitVirtualKey(digit))}
              virtualPressToken={virtualToken}
              forceVisible={interactionLocked}
              onClick={() => onDigit(digit)}
              aria-label={`Dígito ${digit}`}
            >
              {digit}
            </PremiumKey>
          ))}
        </div>
      ))}

      <div className="game-numeric-keypad__row">
        <AutoCheckButton
          disabled={effectiveDisabled}
          charges={autoCheckCharges}
          virtualPressed={isVirtualPressed('auto')}
          virtualPressToken={virtualToken}
          onAutoCorrect={onAutoCorrect}
        />
        <PremiumKey
          key="digit-0"
          disabled={effectiveDisabled}
          variants={keypadReveal.key}
          whileTap={effectiveDisabled ? undefined : { scale: 0.97, y: 1 }}
          virtualPressed={isVirtualPressed('digit-0')}
          virtualPressToken={virtualToken}
          forceVisible={interactionLocked}
          onClick={() => onDigit('0')}
          aria-label="Dígito 0"
        >
          0
        </PremiumKey>
        <PremiumKey
          disabled={effectiveDisabled || backspaceDisabled}
          variants={keypadReveal.key}
          whileTap={effectiveDisabled || backspaceDisabled ? undefined : { scale: 0.97, y: 1 }}
          className="game-numeric-keypad__key--backspace"
          forceVisible={interactionLocked}
          onClick={onBackspace}
          aria-label="Apagar dígito"
        >
          <IconBackspace />
        </PremiumKey>
      </div>

      <PremiumKey
        key="enter"
        disabled={effectiveDisabled}
        variants={keypadReveal.key}
        whileTap={effectiveDisabled ? undefined : { scale: 0.98, y: 1 }}
        className="game-numeric-keypad__key--enter game-numeric-keypad__key--enter-wide"
        virtualPressed={isVirtualPressed('enter')}
        virtualPressToken={virtualToken}
        forceVisible={interactionLocked}
        onClick={onEnter}
        aria-label="Confirmar resposta"
      >
        <IconCheck />
        <span>OK</span>
      </PremiumKey>
    </motion.div>
  )
})
