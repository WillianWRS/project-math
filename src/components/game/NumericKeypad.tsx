import { AnimatePresence, motion } from 'motion/react'
import { DEBUG_AUTO_CHECK_ALWAYS_ENABLED } from '../../engine/game-state-machine'

interface NumericKeypadProps {
  disabled?: boolean
  backspaceDisabled?: boolean
  waterLight?: boolean
  autoCheckCharges?: number
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
      transition: { staggerChildren: 0.018, delayChildren: 0.03 },
    },
  },
  key: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.18, ease: keypadRevealEase } },
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
  charges,
  onAutoCorrect,
}: {
  disabled: boolean
  charges: number
  onAutoCorrect: () => void
}) {
  const enabled = DEBUG_AUTO_CHECK_ALWAYS_ENABLED || charges > 0
  const displayCharges = DEBUG_AUTO_CHECK_ALWAYS_ENABLED ? 1 : charges
  const stateKey = enabled ? 'enabled' : 'disabled'

  return (
    <motion.button
      type="button"
      disabled={disabled || !enabled}
      layout
      variants={keypadReveal.key}
      className={`game-numeric-keypad__key game-numeric-keypad__key--auto${
        enabled ? ' game-numeric-keypad__key--debug' : ''
      }`}
      onClick={onAutoCorrect}
      aria-label={
        enabled
          ? DEBUG_AUTO_CHECK_ALWAYS_ENABLED
            ? 'Auto acerto (debug)'
            : `Auto acerto (${charges} uso${charges === 1 ? '' : 's'})`
          : 'Auto acerto indisponível'
      }
      transition={autoCheckTransition}
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

export function NumericKeypad({
  disabled = false,
  backspaceDisabled = false,
  waterLight = false,
  autoCheckCharges = 0,
  onDigit,
  onBackspace,
  onAutoCorrect,
  onEnter,
}: NumericKeypadProps) {
  const keypadClass = waterLight ? 'game-numeric-keypad game-numeric-keypad--water' : 'game-numeric-keypad'

  return (
    <motion.div
      className={`${keypadClass} w-full max-w-xs`}
      aria-label="Teclado numérico"
      variants={keypadReveal.container}
      initial="hidden"
      animate="show"
    >
      {DIGIT_ROWS.map((row) => (
        <div key={row.join('-')} className="game-numeric-keypad__row">
          {row.map((digit) => (
            <motion.button
              key={digit}
              type="button"
              disabled={disabled}
              variants={keypadReveal.key}
              className="game-numeric-keypad__key"
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
          disabled={disabled}
          charges={autoCheckCharges}
          onAutoCorrect={onAutoCorrect}
        />
        <motion.button
          type="button"
          disabled={disabled}
          variants={keypadReveal.key}
          className="game-numeric-keypad__key"
          onClick={() => onDigit('0')}
          aria-label="Dígito 0"
        >
          0
        </motion.button>
        <motion.button
          type="button"
          disabled={disabled || backspaceDisabled}
          variants={keypadReveal.key}
          className="game-numeric-keypad__key game-numeric-keypad__key--backspace"
          onClick={onBackspace}
          aria-label="Apagar dígito"
        >
          <IconBackspace />
        </motion.button>
      </div>

      <motion.button
        type="button"
        disabled={disabled}
        variants={keypadReveal.key}
        className="game-numeric-keypad__key game-numeric-keypad__key--enter game-numeric-keypad__key--enter-wide"
        onClick={onEnter}
        aria-label="Confirmar resposta"
      >
        <IconCheck />
        <span>OK</span>
      </motion.button>
    </motion.div>
  )
}
