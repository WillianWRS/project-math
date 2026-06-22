import { AnimatePresence, motion } from '../../lib/motion'
import { memo } from 'react'
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
  interactionLocked,
  charges,
  virtualPressed,
  virtualPressToken,
  onAutoCorrect,
}: {
  disabled: boolean
  interactionLocked: boolean
  charges: number
  virtualPressed: boolean
  virtualPressToken: number | null
  onAutoCorrect: () => void
}) {
  const enabled = DEBUG_AUTO_CHECK_ALWAYS_ENABLED || charges > 0
  const displayCharges = DEBUG_AUTO_CHECK_ALWAYS_ENABLED ? 1 : charges
  const stateKey = enabled ? 'enabled' : 'disabled'

  return (
    <motion.button
      key={virtualPressed && virtualPressToken !== null ? `auto-${virtualPressToken}` : 'auto'}
      type="button"
      disabled={disabled || !enabled}
      variants={keypadReveal.key}
      whileTap={disabled || !enabled ? undefined : { scale: 0.97, y: 1 }}
      animate={virtualPressed ? { scale: [1, 0.97, 1], y: [0, 1, 0] } : undefined}
      transition={virtualPressed ? { duration: 0.2, ease: 'easeOut' } : autoCheckTransition}
      className={`game-numeric-keypad__key game-numeric-keypad__key--auto${
        enabled ? ' game-numeric-keypad__key--debug' : ''
      }${virtualPressed ? ' game-numeric-keypad__key--virtual-press' : ''}`}
      onClick={onAutoCorrect}
      aria-disabled={interactionLocked ? 'true' : undefined}
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
    </motion.button>
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
  const effectiveDisabled = disabled || interactionLocked

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
            <motion.button
              key={isVirtualPressed(digitVirtualKey(digit)) && virtualToken !== null ? `${digit}-${virtualToken}` : digit}
              type="button"
              disabled={effectiveDisabled}
              variants={keypadReveal.key}
              whileTap={effectiveDisabled ? undefined : { scale: 0.97, y: 1 }}
              animate={
                isVirtualPressed(digitVirtualKey(digit))
                  ? { scale: [1, 0.97, 1], y: [0, 1, 0] }
                  : undefined
              }
              transition={
                isVirtualPressed(digitVirtualKey(digit))
                  ? { duration: 0.2, ease: 'easeOut' }
                  : undefined
              }
              className={`game-numeric-keypad__key${
                isVirtualPressed(digitVirtualKey(digit))
                  ? ' game-numeric-keypad__key--virtual-press'
                  : ''
              }`}
              onClick={() => onDigit(digit)}
              aria-label={`Dígito ${digit}`}
            >
              {digit}
            </motion.button>
          ))}
        </div>
      ))}

      <div className="game-numeric-keypad__row">
        <AutoCheckButton
          disabled={effectiveDisabled}
          interactionLocked={interactionLocked}
          charges={autoCheckCharges}
          virtualPressed={isVirtualPressed('auto')}
          virtualPressToken={virtualToken}
          onAutoCorrect={onAutoCorrect}
        />
        <motion.button
          key={isVirtualPressed('digit-0') && virtualToken !== null ? `0-${virtualToken}` : 'digit-0'}
          type="button"
          disabled={effectiveDisabled}
          variants={keypadReveal.key}
          whileTap={effectiveDisabled ? undefined : { scale: 0.97, y: 1 }}
          animate={isVirtualPressed('digit-0') ? { scale: [1, 0.97, 1], y: [0, 1, 0] } : undefined}
          transition={isVirtualPressed('digit-0') ? { duration: 0.2, ease: 'easeOut' } : undefined}
          className={`game-numeric-keypad__key${
            isVirtualPressed('digit-0') ? ' game-numeric-keypad__key--virtual-press' : ''
          }`}
          onClick={() => onDigit('0')}
          aria-label="Dígito 0"
        >
          0
        </motion.button>
        <motion.button
          type="button"
          disabled={effectiveDisabled || backspaceDisabled}
          variants={keypadReveal.key}
          whileTap={effectiveDisabled || backspaceDisabled ? undefined : { scale: 0.97, y: 1 }}
          className="game-numeric-keypad__key game-numeric-keypad__key--backspace"
          onClick={onBackspace}
          aria-label="Apagar dígito"
        >
          <IconBackspace />
        </motion.button>
      </div>

      <motion.button
        type="button"
        key={isVirtualPressed('enter') && virtualToken !== null ? `enter-${virtualToken}` : 'enter'}
        disabled={effectiveDisabled}
        variants={keypadReveal.key}
        whileTap={effectiveDisabled ? undefined : { scale: 0.98, y: 1 }}
        animate={isVirtualPressed('enter') ? { scale: [1, 0.98, 1], y: [0, 1, 0] } : undefined}
        transition={isVirtualPressed('enter') ? { duration: 0.2, ease: 'easeOut' } : undefined}
        className={`game-numeric-keypad__key game-numeric-keypad__key--enter game-numeric-keypad__key--enter-wide${
          isVirtualPressed('enter') ? ' game-numeric-keypad__key--virtual-press' : ''
        }`}
        onClick={onEnter}
        aria-label="Confirmar resposta"
      >
        <IconCheck />
        <span>OK</span>
      </motion.button>
    </motion.div>
  )
})
