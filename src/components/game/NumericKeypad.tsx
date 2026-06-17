interface NumericKeypadProps {
  disabled?: boolean
  backspaceDisabled?: boolean
  waterLight?: boolean
  onDigit: (digit: string) => void
  onBackspace: () => void
  onEnter: () => void
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

function IconForbidden() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7.5 16.5l9-9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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

export function NumericKeypad({
  disabled = false,
  backspaceDisabled = false,
  waterLight = false,
  onDigit,
  onBackspace,
  onEnter,
}: NumericKeypadProps) {
  const keypadClass = waterLight ? 'game-numeric-keypad game-numeric-keypad--water' : 'game-numeric-keypad'

  return (
    <div className={`${keypadClass} w-full max-w-xs`} aria-label="Teclado numérico">
      {DIGIT_ROWS.map((row) => (
        <div key={row.join('-')} className="game-numeric-keypad__row">
          {row.map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={disabled}
              className="game-numeric-keypad__key"
              onClick={() => onDigit(digit)}
              aria-label={`Dígito ${digit}`}
            >
              {digit}
            </button>
          ))}
        </div>
      ))}

      <div className="game-numeric-keypad__row">
        <button
          type="button"
          disabled
          className="game-numeric-keypad__key game-numeric-keypad__key--disabled-slot"
          aria-label="Indisponível"
        >
          <IconForbidden />
        </button>
        <button
          type="button"
          disabled={disabled}
          className="game-numeric-keypad__key"
          onClick={() => onDigit('0')}
          aria-label="Dígito 0"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || backspaceDisabled}
          className="game-numeric-keypad__key game-numeric-keypad__key--backspace"
          onClick={onBackspace}
          aria-label="Apagar dígito"
        >
          <IconBackspace />
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        className="game-numeric-keypad__key game-numeric-keypad__key--enter game-numeric-keypad__key--enter-wide"
        onClick={onEnter}
        aria-label="Confirmar resposta"
      >
        <IconCheck />
        <span>OK</span>
      </button>
    </div>
  )
}
