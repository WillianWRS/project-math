import { AnimatePresence, motion } from '../../lib/motion'
import { memo, type ReactNode, useCallback, useRef, useState } from 'react'
import { DEBUG_AUTO_CHECK_ALWAYS_ENABLED } from '../../engine/game-state-machine'
import type { BenchmarkVirtualKey } from '../../engine/benchmark-types'

interface NumericKeypadProps {
  disabled?: boolean
  interactionLocked?: boolean
  autoCheckOnly?: boolean
  backspaceDisabled?: boolean
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
  forceVisible?: boolean
  whileTap?: { scale: number; y: number }
  onClick: () => void
  children: ReactNode
}

function PremiumKey({
  disabled,
  variants,
  className = '',
  ariaLabel,
  virtualPressed = false,
  forceVisible = false,
  whileTap,
  onClick,
  children,
}: PremiumKeyProps) {
  const pointerActivatedRef = useRef(false)

  const activate = useCallback(() => {
    if (disabled) return
    onClick()
  }, [disabled, onClick])

  return (
    <motion.button
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
      }${
        forceVisible ? ' game-numeric-keypad__key--force-visible' : ''
      }`}
      onPointerDown={(event) => {
        if (disabled) return
        if (event.pointerType === 'mouse' && event.button !== 0) return
        pointerActivatedRef.current = true
        event.currentTarget.classList.add('game-numeric-keypad__key--pointer-press')
        activate()
      }}
      onPointerUp={(event) => {
        event.currentTarget.classList.remove('game-numeric-keypad__key--pointer-press')
      }}
      onPointerLeave={(event) => event.currentTarget.classList.remove('game-numeric-keypad__key--pointer-press')}
      onPointerCancel={(event) => {
        pointerActivatedRef.current = false
        event.currentTarget.classList.remove('game-numeric-keypad__key--pointer-press')
      }}
      onClick={(event) => {
        if (pointerActivatedRef.current) {
          pointerActivatedRef.current = false
          event.preventDefault()
          return
        }
        activate()
      }}
      aria-label={ariaLabel}
    >
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
  onAutoCorrect,
}: {
  disabled: boolean
  charges: number
  virtualPressed: boolean
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
      onClick={onAutoCorrect}
      ariaLabel={
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

function BackspaceKey({
  disabled,
  variants,
  forceVisible,
  onBackspace,
}: {
  disabled: boolean
  variants: (typeof keypadReveal)['key']
  forceVisible: boolean
  onBackspace: () => void
}) {
  const [shakeKey, setShakeKey] = useState(0)
  const backspaceShakeTransition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }
  const backspaceShakeX = [0, -7, 0, -5, 0]

  const handleClick = () => {
    if (disabled) return
    setShakeKey((key) => key + 1)
    onBackspace()
  }

  return (
    <PremiumKey
      disabled={disabled}
      variants={variants}
      className="game-numeric-keypad__key--backspace"
      forceVisible={forceVisible}
      onClick={handleClick}
      ariaLabel="Apagar dígito"
    >
      <motion.span
        key={`backspace-icon-shake-${shakeKey}`}
        className="game-numeric-keypad__backspace-icon"
        initial={{ x: 0 }}
        animate={shakeKey > 0 ? { x: backspaceShakeX } : { x: 0 }}
        transition={backspaceShakeTransition}
        aria-hidden
      >
        <IconBackspace />
      </motion.span>
    </PremiumKey>
  )
}

export const NumericKeypad = memo(function NumericKeypad({
  disabled = false,
  interactionLocked = false,
  autoCheckOnly = false,
  backspaceDisabled = false,
  autoCheckCharges = 0,
  virtualPress = null,
  onDigit,
  onBackspace,
  onAutoCorrect,
  onEnter,
}: NumericKeypadProps) {
  const isVirtualPressed = (key: BenchmarkVirtualKey) => virtualPress?.key === key
  const digitVirtualKey = (digit: string) => `digit-${digit}` as BenchmarkVirtualKey
  const effectiveDisabled = disabled && !interactionLocked
  const numericDisabled = effectiveDisabled || autoCheckOnly

  return (
    <motion.div
      className={`game-numeric-keypad w-full max-w-xs${interactionLocked ? ' pointer-events-none select-none' : ''}`}
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
              disabled={numericDisabled}
              variants={keypadReveal.key}
              whileTap={numericDisabled ? undefined : { scale: 0.97, y: 1 }}
              virtualPressed={isVirtualPressed(digitVirtualKey(digit))}
              forceVisible={interactionLocked}
              onClick={() => onDigit(digit)}
              ariaLabel={`Dígito ${digit}`}
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
          onAutoCorrect={onAutoCorrect}
        />
        <PremiumKey
          key="digit-0"
          disabled={numericDisabled}
          variants={keypadReveal.key}
          whileTap={numericDisabled ? undefined : { scale: 0.97, y: 1 }}
          virtualPressed={isVirtualPressed('digit-0')}
          forceVisible={interactionLocked}
          onClick={() => onDigit('0')}
          ariaLabel="Dígito 0"
        >
          0
        </PremiumKey>
        <BackspaceKey
          disabled={numericDisabled || backspaceDisabled}
          variants={keypadReveal.key}
          forceVisible={interactionLocked}
          onBackspace={onBackspace}
        />
      </div>

      <PremiumKey
        key="enter"
        disabled={numericDisabled}
        variants={keypadReveal.key}
        whileTap={numericDisabled ? undefined : { scale: 0.98, y: 1 }}
        className="game-numeric-keypad__key--enter game-numeric-keypad__key--enter-wide"
        virtualPressed={isVirtualPressed('enter')}
        forceVisible={interactionLocked}
        onClick={onEnter}
        ariaLabel="Confirmar resposta"
      >
        <IconCheck />
        <span>OK</span>
      </PremiumKey>
    </motion.div>
  )
})
