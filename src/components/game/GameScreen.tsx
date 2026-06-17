import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { ForwardLinesBackground } from './ForwardLinesBackground'
import { NumericKeypad } from './NumericKeypad'
import { PlayFieldsSideLayout } from './SideCardRails'
import { isFourSecondsGameChangerActive, isMinusGameChangerActive, isPlusGameChangerActive, isTimesDivGameChangerActive } from '../../engine/game-changer-cycles'
import { useMobileLayout } from '../../hooks/useMobileLayout'
import { OPERATOR_COLOR_CLASS } from '../../engine/operation-generator'
import { SUBMIT_LOCK_MS } from '../../engine/game-state-machine'
import type { Operation } from '../../engine/types'
import type { GameSession } from '../../engine/types'
import { HistoryModal } from '../modals/HistoryModal'
import { SettingsModal } from '../modals/SettingsModal'
import type { BackgroundTheme, HighScoreRecord } from '../../platform/storage'

interface GameScreenProps {
  session: GameSession
  highScore: HighScoreRecord | null
  soundEnabled: boolean
  backgroundTheme: BackgroundTheme
  onStart: () => void
  onReturnToMenu: () => void
  onConfirm: () => void
  onAutoCorrect: () => void
  onInputChange: (value: string) => void
  onSoundChange: (enabled: boolean) => void
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
  onPlayClick: () => void
  onPlayGameStart: () => void
  onPlayWriteKey: () => void
  onPlayEraseKey: () => void
  onPlayGoToMenu: () => void
}

type PresentationPhase = 'menu' | 'opening' | 'in-game' | 'closing'

const slideTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }
const curtainTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
const contentEnterTransition = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }
const curtainDurationMs = curtainTransition.duration * 1000
const contentEnterDurationMs = contentEnterTransition.duration * 1000

function SlideValue({
  value,
  className,
  slotClassName,
}: {
  value: string | number
  className?: string
  slotClassName?: string
}) {
  return (
    <div className={`relative overflow-hidden ${slotClassName ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={value}
          className={`absolute inset-x-0 font-mono tabular-nums ${className ?? ''}`}
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={slideTransition}
        >
          {value}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function OperationValue({
  operation,
  className,
  slotClassName,
  waterLight = false,
  fourSecondsLight = false,
  timesDivLight = false,
  plusLight = false,
  minusLight = false,
}: {
  operation: Operation
  className?: string
  slotClassName?: string
  waterLight?: boolean
  fourSecondsLight?: boolean
  timesDivLight?: boolean
  plusLight?: boolean
  minusLight?: boolean
}) {
  const key = `${operation.operator} ${operation.operand}`
  const operandClass = fourSecondsLight
    ? 'text-orange-900'
    : timesDivLight
      ? 'text-blue-900'
      : plusLight
        ? 'text-emerald-900'
        : minusLight
          ? 'text-rose-900'
          : waterLight
            ? 'text-sky-800'
            : 'text-stone-300'

  return (
    <div className={`relative overflow-hidden ${slotClassName ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={key}
          className={`absolute inset-x-0 flex items-center justify-center gap-1.5 font-mono tabular-nums tracking-wide ${className ?? ''}`}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
          }}
          exit={{
            y: '-100%',
            opacity: 0,
            transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          <span
            className={`text-4xl font-bold leading-none ${OPERATOR_COLOR_CLASS[operation.operator]}`}
          >
            {operation.operator}
          </span>
          <span className={`text-3xl font-normal leading-none ${operandClass}`}>
            {operation.operand}
          </span>
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h12v2a4 4 0 01-4 4h-.5A4 4 0 0110 6V4M8 20h8M12 14v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6 6H4a2 2 0 002 3M18 6h2a2 2 0 01-2 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19 12a7.2 7.2 0 00.1-1l2-1.5-2-3.5-2.3 1a7 7 0 00-1.7-1L15 3h-6l-.1 2.5a7 7 0 00-1.7 1l-2.3-1-2 3.5 2 1.5a7.2 7.2 0 00.1 1 7.2 7.2 0 00-.1 1l-2 1.5 2 3.5 2.3-1a7 7 0 001.7 1L9 21h6l.1-2.5a7 7 0 001.7-1l2.3 1 2-3.5-2-1.5a7.2 7.2 0 00-.1-1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5L8 5.5z" />
    </svg>
  )
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CurtainOverlay({
  open,
  initialOpen = false,
}: {
  open: boolean
  initialOpen?: boolean
}) {
  const [instant, setInstant] = useState(initialOpen)
  const panelState = open ? 'open' : 'closed'
  const visualState = initialOpen && instant && !open ? 'open' : panelState

  useEffect(() => {
    if (!initialOpen) return
    const frame = requestAnimationFrame(() => setInstant(false))
    return () => cancelAnimationFrame(frame)
  }, [initialOpen])

  const instantClass = instant ? 'curtain-panel--instant' : ''

  return (
    <>
      <div
        className={`curtain-panel curtain-panel-left curtain-panel--${visualState} ${instantClass}`}
        aria-hidden
      >
        <div className="curtain-panel__surface" />
        <div className="curtain-panel__finisher" />
        <div className="curtain-panel__seam" />
      </div>
      <div
        className={`curtain-panel curtain-panel-right curtain-panel--${visualState} ${instantClass}`}
        aria-hidden
      >
        <div className="curtain-panel__surface" />
        <div className="curtain-panel__finisher" />
        <div className="curtain-panel__seam" />
      </div>
    </>
  )
}

function MenuHudButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className="game-menu-hud-btn" aria-label={label}>
      <span className="game-menu-hud-btn__plate">
        <span className="game-menu-hud-btn__icon">{children}</span>
      </span>
      <span className="game-menu-hud-btn__label">{label}</span>
    </button>
  )
}

function MenuHudInlineButton({
  label,
  onClick,
  variant = 'default',
  waterLight = false,
  fill = false,
  children,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'accent'
  waterLight?: boolean
  fill?: boolean
  children: ReactNode
}) {
  const plateClass =
    variant === 'accent'
      ? 'game-menu-hud-btn__plate game-menu-hud-btn__plate--inline game-menu-hud-btn__plate--accent game-menu-hud-btn__plate--wide'
      : 'game-menu-hud-btn__plate game-menu-hud-btn__plate--inline'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`game-menu-hud-btn game-menu-hud-btn--inline${fill ? ' game-menu-hud-btn--fill' : ''}${waterLight ? ' game-menu-hud-btn--water-light' : ''}`}
      aria-label={label}
    >
      <span className={plateClass}>
        <span className="game-menu-hud-btn__icon">{children}</span>
        <span className="game-menu-hud-btn__inline-text">{label}</span>
      </span>
    </button>
  )
}

const menuButtonScaleTransition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }

function AnimatedGameMenuButton({
  compact,
  waterLight,
  onClick,
}: {
  compact: boolean
  waterLight: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      className="pointer-events-auto"
      initial={false}
      animate={{
        scale: compact ? 0.72 : 1,
        x: compact ? 6 : 0,
      }}
      transition={menuButtonScaleTransition}
      style={{ transformOrigin: '100% 50%' }}
    >
      <button
        type="button"
        onClick={onClick}
        className={`game-menu-hud-btn game-menu-hud-btn--inline${
          waterLight ? ' game-menu-hud-btn--water-light' : ''
        }`}
        aria-label="Menu"
      >
        <span className="game-menu-hud-btn__plate game-menu-hud-btn__plate--inline game-menu-hud-btn__plate--icon-only">
          <span className="game-menu-hud-btn__icon">
            <IconBack />
          </span>
        </span>
      </button>
    </motion.div>
  )
}

function MenuPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Iniciar partida"
      className="game-btn-push game-btn-push-amber flex items-center gap-2.5 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3.5 text-lg font-bold tracking-wide text-amber-950"
    >
      <IconPlay />
      <span>Jogar</span>
    </button>
  )
}

const answerFlashTransition = { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const }

function AnswerDigitPulse({ value, autoCheck = false }: { value: string; autoCheck?: boolean }) {
  const toneClass = autoCheck ? ' answer-digit-pulse--amber' : ''

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
      aria-hidden
    >
      <motion.span
        className={`answer-digit-pulse-ring answer-digit-pulse-ring--inner${toneClass} absolute z-[1] font-mono text-4xl font-bold tabular-nums`}
        initial={{ scale: 1, opacity: 0.95 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={answerFlashTransition}
      >
        {value}
      </motion.span>
      <motion.span
        className={`answer-digit-pulse-ring answer-digit-pulse-ring--outer${toneClass} absolute z-[1] font-mono text-4xl font-bold tabular-nums`}
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.15, opacity: 0 }}
        transition={{ ...answerFlashTransition, duration: 0.62, delay: 0.05 }}
      >
        {value}
      </motion.span>
      <motion.span
        className={`absolute z-[2] font-mono text-4xl font-bold tabular-nums ${
          autoCheck ? 'text-amber-400' : 'text-amber-50'
        }`}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0, opacity: 0 }}
        transition={answerFlashTransition}
        style={{ transformOrigin: 'center center' }}
      >
        {value}
      </motion.span>
    </div>
  )
}

function AnswerDisplay({
  value,
  disabled,
  shake,
  shakeKey,
  answerFlash,
  answerFlashAuto,
  flashKey,
  waterLight = false,
  fourSecondsLight = false,
  timesDivLight = false,
  plusLight = false,
  minusLight = false,
  slotRef,
}: {
  value: string
  disabled: boolean
  shake: boolean
  shakeKey: number
  answerFlash: string | null
  answerFlashAuto: boolean
  flashKey: number
  waterLight?: boolean
  fourSecondsLight?: boolean
  timesDivLight?: boolean
  plusLight?: boolean
  minusLight?: boolean
  slotRef?: RefObject<HTMLDivElement | null>
}) {
  const displayValue = answerFlash ? '' : value || '·'

  return (
    <div
      className={`relative overflow-visible px-3 py-3${waterLight ? ' game-answer-row--water' : ''}`}
    >
      <AnimatePresence>
        {answerFlash && (
          <AnswerDigitPulse
            key={`${flashKey}-${answerFlash}`}
            value={answerFlash}
            autoCheck={answerFlashAuto}
          />
        )}
      </AnimatePresence>
      <motion.div
        key={shakeKey}
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: SUBMIT_LOCK_MS / 1000 }}
      >
        <div
          ref={slotRef}
          role="status"
          aria-live="polite"
          aria-label={`Resposta: ${value || 'vazio'}`}
          className={`game-answer-slot flex h-16 w-full items-center justify-center bg-transparent text-center font-mono text-4xl font-bold tabular-nums ${
            waterLight ? 'game-answer-slot--water' : ''
          } ${
            answerFlash
              ? 'text-transparent'
              : shake
                ? 'text-rose-400'
                : value
                  ? fourSecondsLight
                    ? 'text-orange-950'
                    : timesDivLight
                      ? 'text-blue-950'
                      : plusLight
                        ? 'text-emerald-950'
                        : minusLight
                          ? 'text-rose-950'
                          : waterLight
                            ? 'text-sky-900'
                            : 'text-amber-50'
                  : fourSecondsLight
                    ? 'text-orange-800/35'
                    : timesDivLight
                      ? 'text-blue-800/35'
                      : plusLight
                        ? 'text-emerald-800/35'
                        : minusLight
                          ? 'text-rose-800/35'
                          : waterLight
                            ? 'text-sky-700/35'
                            : 'text-charcoal-muted/50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          {displayValue}
        </div>
      </motion.div>
    </div>
  )
}

function playBorderPulseStyle(level: number): CSSProperties {
  const lv = Math.min(Math.max(level, 1), 5)
  const base = 1.6 + lv * 0.65
  const amplitude = 0.45 + lv * 0.28
  const minW = base - amplitude / 2
  const maxW = base + amplitude / 2

  return {
    '--play-border-min': `${minW.toFixed(2)}px`,
    '--play-border-max': `${maxW.toFixed(2)}px`,
    '--play-glow-min': `${8 + lv * 2}px`,
    '--play-glow-max': `${14 + lv * 9}px`,
    '--play-pulse-duration': `${(2.75 - lv * 0.2).toFixed(2)}s`,
    '--play-pulse-scale-max': `${(1.004 + lv * 0.007).toFixed(3)}`,
    '--play-glow-strength-min': `${0.16 + lv * 0.05}`,
    '--play-glow-strength-max': `${0.34 + lv * 0.13}`,
  } as CSSProperties
}

function playBorderBurstStyle(burstLevel: number): CSSProperties {
  const lv = Math.min(Math.max(burstLevel, 1), 5)

  return {
    '--play-burst-scale': `${(1.028 + lv * 0.014).toFixed(3)}`,
    '--play-border-burst': `${(2.2 + lv * 1.1).toFixed(2)}px`,
    '--play-burst-glow': `${24 + lv * 10}px`,
    '--play-ring-scale-end': `${(1.1 + lv * 0.03).toFixed(3)}`,
  } as CSSProperties
}

function PlayFieldsFrame({
  level,
  levelUpFlash,
  burstScore,
  waterLight,
  borderActive,
  children,
}: {
  level: number
  levelUpFlash: number | null
  burstScore: number
  waterLight: boolean
  borderActive: boolean
  children: ReactNode
}) {
  const burstLevel = levelUpFlash ?? level
  const frameStyle = {
    ...playBorderPulseStyle(level),
    ...(levelUpFlash !== null ? playBorderBurstStyle(burstLevel) : {}),
  }

  return (
    <div
      key={levelUpFlash !== null ? `burst-${burstScore}` : 'play-fields'}
      className={`game-play-stack-frame${
        waterLight ? ' game-play-stack-frame--water' : ''
      }${borderActive ? '' : ' game-play-stack-frame--inactive'}${
        levelUpFlash !== null ? ' game-play-stack-frame--level-up' : ''
      }`}
      style={frameStyle}
    >
      {children}
    </div>
  )
}

function TimerBar({
  timerMs,
  timerMaxMs,
}: {
  timerMs: number
  timerMaxMs: number
}) {
  const ratio = timerMaxMs > 0 ? Math.max(0, timerMs / timerMaxMs) : 0
  const urgent = ratio < 0.25
  const showSpark = ratio > 0.015

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated">
      <div
        className="timer-bar-fill relative h-full rounded-full transition-[width] duration-100 ease-linear"
        style={{ width: `${ratio * 100}%` }}
      >
        <div
          className={`h-full w-full rounded-full ${
            urgent
              ? 'bg-gradient-to-r from-rose-700 via-rose-500 to-rose-300'
              : 'bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200'
          }`}
        />
        {showSpark && (
          <>
            <span
              className={`timer-spark-trail pointer-events-none absolute right-1 top-0 h-full w-5 bg-gradient-to-l to-transparent ${
                urgent ? 'from-rose-200/70' : 'from-white/45'
              }`}
              aria-hidden
            />
            <span
              className={`pointer-events-none absolute right-0 top-1/2 z-10 h-2 w-2 rounded-full ${
                urgent ? 'timer-spark-urgent bg-rose-50' : 'timer-spark bg-white'
              }`}
              aria-hidden
            />
          </>
        )}
      </div>
    </div>
  )
}

export function GameScreen({
  session,
  highScore,
  soundEnabled,
  onStart,
  onReturnToMenu,
  onConfirm,
  onAutoCorrect,
  onInputChange,
  onSoundChange,
  backgroundTheme,
  onBackgroundThemeChange,
  onPlayClick,
  onPlayGameStart,
  onPlayWriteKey,
  onPlayEraseKey,
  onPlayGoToMenu,
}: GameScreenProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [presentation, setPresentation] = useState<PresentationPhase>('menu')
  const isMobile = useMobileLayout()
  const enterDurationMs = isMobile ? 340 : contentEnterDurationMs
  const closeDurationMs = isMobile ? 420 : curtainDurationMs
  const prevScoreRef = useRef(0)
  const answerFieldRef = useRef<HTMLDivElement>(null)
  const inputValueRef = useRef(session.inputValue)
  inputValueRef.current = session.inputValue

  const isPlaying = session.phase === 'playing'
  const isGameOver = session.phase === 'game_over'
  const fourSecondsActive = isFourSecondsGameChangerActive(session)
  const timesDivActive = isTimesDivGameChangerActive(session)
  const plusActive = isPlusGameChangerActive(session)
  const minusActive = isMinusGameChangerActive(session)
  const inputDisabled = !isPlaying || session.isSubmitLocked

  const appendDigit = useCallback(
    (digit: string) => {
      if (inputDisabled) return
      onPlayWriteKey()
      onInputChange(`${inputValueRef.current}${digit}`)
    },
    [inputDisabled, onInputChange, onPlayWriteKey],
  )

  const backspaceDigit = useCallback(() => {
    if (inputDisabled || inputValueRef.current.length === 0) return
    onPlayEraseKey()
    onInputChange(inputValueRef.current.slice(0, -1))
  }, [inputDisabled, onInputChange, onPlayEraseKey])
  const showGameContent = presentation === 'opening' || presentation === 'in-game'
  const showMenuChrome = presentation === 'menu'
  const isInGameScene = presentation !== 'menu'
  const useWaterBackground = isInGameScene && backgroundTheme === 'water'
  const baseFieldClass = fourSecondsActive
    ? 'text-orange-950'
    : timesDivActive
      ? 'text-blue-950'
      : plusActive
        ? 'text-emerald-950'
        : minusActive
          ? 'text-rose-950'
          : useWaterBackground
            ? 'text-sky-900'
            : 'text-white'
  const mutedFieldClass = fourSecondsActive
    ? 'text-orange-800/45'
    : timesDivActive
      ? 'text-blue-800/45'
      : plusActive
        ? 'text-emerald-800/45'
        : minusActive
          ? 'text-rose-800/45'
          : useWaterBackground
            ? 'text-sky-700/45'
            : 'text-charcoal-muted'
  const showCurtain = presentation !== 'in-game'
  const curtainOpen = presentation === 'opening'
  const curtainInitialOpen = presentation === 'closing'

  const handlePlay = () => {
    if (presentation !== 'menu') return
    onPlayGameStart()
    setPresentation('opening')
  }

  const handleReturnToMenu = () => {
    if (!isInGameScene) return
    onPlayGoToMenu()
    onReturnToMenu()
    setPresentation('closing')
  }

  const handlePlayAgain = () => {
    if (presentation !== 'in-game' || session.phase !== 'game_over') return
    onPlayGameStart()
    prevScoreRef.current = 0
    onStart()
  }

  useEffect(() => {
    if (presentation !== 'opening') return

    const timeout = window.setTimeout(() => {
      setPresentation((current) => {
        if (current !== 'opening') return current
        onStart()
        return 'in-game'
      })
    }, enterDurationMs)

    return () => window.clearTimeout(timeout)
  }, [presentation, onStart, enterDurationMs])

  useEffect(() => {
    if (presentation !== 'closing') return

    const timeout = window.setTimeout(() => {
      setPresentation((current) => (current === 'closing' ? 'menu' : current))
    }, closeDurationMs)

    return () => window.clearTimeout(timeout)
  }, [presentation, closeDurationMs])

  useEffect(() => {
    if (session.isSubmitLocked && session.phase === 'playing') {
      setShakeKey((key) => key + 1)
    }
  }, [session.isSubmitLocked, session.phase])

  useEffect(() => {
    if (session.phase === 'playing' && session.score === 0) {
      prevScoreRef.current = 0
    }
  }, [session.phase, session.score])

  useEffect(() => {
    if (session.phase !== 'playing' || session.isSubmitLocked) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        appendDigit(event.key)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        onConfirm()
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        backspaceDigit()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [session.phase, session.isSubmitLocked, appendDigit, backspaceDigit, onConfirm])

  return (
    <div
      className={`relative flex min-h-dvh flex-col overflow-hidden text-white transition-colors duration-500 ${
        useWaterBackground ? 'game-scene--water' : 'bg-charcoal'
      }`}
    >
      {useWaterBackground && (
        <div className="game-water-layer pointer-events-none absolute inset-0 z-0" aria-hidden />
      )}
      <ForwardLinesBackground
        active={presentation !== 'menu'}
        level={session.level}
        speedMultiplier={isGameOver ? 0.1 : 1}
        theme={useWaterBackground ? 'water' : 'default'}
      />

      {showGameContent && (
        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={
            isMobile
              ? { duration: 0.34, ease: [0.22, 1, 0.36, 1] }
              : contentEnterTransition
          }
          style={{ willChange: presentation === 'opening' ? 'transform' : 'auto' }}
        >
          <header className={useWaterBackground ? 'game-scene-header--water' : undefined}>
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Pontuação</p>
            <div className="relative left-1/2 h-12 w-screen -translate-x-1/2">
              <div className="relative mx-auto h-full max-w-md px-4">
                <div className="flex h-full items-end">
                  <div className="relative h-12 min-w-0 flex-1 overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.p
                        key={session.score}
                        className="absolute left-0 font-mono text-4xl font-bold tabular-nums text-white"
                        initial={{ y: '100%', opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '-100%', opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {session.score}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                {isInGameScene && (
                  <div className="game-header-menu-dock pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <AnimatedGameMenuButton
                      compact={!isGameOver}
                      waterLight={useWaterBackground}
                      onClick={handleReturnToMenu}
                    />
                  </div>
                )}

                <AnimatePresence>
                  {isGameOver && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="game-over-actions pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      <div className="game-over-actions__row game-over-actions__row--play">
                        <MenuHudInlineButton
                          label="Jogar novamente"
                          variant="accent"
                          onClick={handlePlayAgain}
                          waterLight={useWaterBackground}
                          fill
                        >
                          <span className="scale-75">
                            <IconPlay />
                          </span>
                        </MenuHudInlineButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="mt-5 flex flex-1 flex-col items-center gap-4">
            <PlayFieldsSideLayout
              autoCheckCycleStep={session.autoCheckCycleStep}
              fourSecondsCycleStep={session.fourSecondsCycleStep}
              fourSecondsGameChangerRemaining={session.fourSecondsGameChangerRemaining}
              timesDivCycleStep={session.timesDivCycleStep}
              timesDivGameChangerRemaining={session.timesDivGameChangerRemaining}
              plusCycleStep={session.plusCycleStep}
              plusGameChangerActive={session.plusGameChangerActive}
              minusCycleStep={session.minusCycleStep}
              minusGameChangerActive={session.minusGameChangerActive}
              answerFieldRef={answerFieldRef}
            >
              <PlayFieldsFrame
                level={session.level}
                levelUpFlash={session.levelUpFlash}
                burstScore={session.score}
                waterLight={useWaterBackground}
                borderActive={isPlaying}
              >
                <div
                  className={`game-play-stack w-full rounded-3xl ${
                    fourSecondsActive
                      ? 'game-play-stack--four-seconds'
                      : timesDivActive
                        ? 'game-play-stack--times-div'
                        : plusActive
                          ? 'game-play-stack--plus-cycle'
                          : minusActive
                            ? 'game-play-stack--minus-cycle'
                            : useWaterBackground
                              ? 'game-play-stack--water'
                              : 'bg-charcoal-field'
                  }`}
                >
                  <div className="game-play-stack__divider border-b px-3 py-4 text-center">
                    {isPlaying || isGameOver ? (
                      <SlideValue
                        value={session.baseNumber}
                        slotClassName="h-14"
                        className={`text-5xl font-bold ${baseFieldClass}`}
                      />
                    ) : (
                      <p
                        className={`font-mono text-5xl font-bold tabular-nums ${mutedFieldClass}`}
                      >
                        —
                      </p>
                    )}
                  </div>

                  <div className="game-play-stack__divider border-b px-3 py-3 text-center">
                    {session.operation && (isPlaying || isGameOver) ? (
                      <OperationValue
                        operation={session.operation}
                        slotClassName="h-10"
                        waterLight={useWaterBackground}
                        fourSecondsLight={fourSecondsActive}
                        timesDivLight={timesDivActive}
                        plusLight={plusActive}
                        minusLight={minusActive}
                      />
                    ) : (
                      <p
                        className={`font-mono text-3xl font-medium tabular-nums tracking-wide ${mutedFieldClass}`}
                      >
                        —
                      </p>
                    )}
                  </div>

                  <AnswerDisplay
                    value={session.inputValue}
                    disabled={inputDisabled}
                    shake={session.isSubmitLocked}
                    shakeKey={shakeKey}
                    answerFlash={session.answerFlash}
                    answerFlashAuto={session.answerFlashAuto}
                    flashKey={session.score}
                    waterLight={useWaterBackground}
                    fourSecondsLight={fourSecondsActive}
                    timesDivLight={timesDivActive}
                    plusLight={plusActive}
                    minusLight={minusActive}
                    slotRef={answerFieldRef}
                  />
                </div>
              </PlayFieldsFrame>
            </PlayFieldsSideLayout>

            {isPlaying && (
              <>
                <div className="w-full max-w-xs">
                  <TimerBar timerMs={session.timerMs} timerMaxMs={session.timerMaxMs} />
                </div>
                <NumericKeypad
                  disabled={inputDisabled}
                  backspaceDisabled={session.inputValue.length === 0}
                  waterLight={useWaterBackground}
                  autoCheckCharges={session.autoCheckCharges}
                  onDigit={appendDigit}
                  onBackspace={backspaceDigit}
                  onAutoCorrect={onAutoCorrect}
                  onEnter={onConfirm}
                />
              </>
            )}

            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full max-w-xs"
              >
                <div
                  className={`game-over-card w-full rounded-2xl p-4 text-center ${
                    useWaterBackground ? 'game-over-card--water' : 'game-over-card--default'
                  }`}
                >
                  <p
                    className={`game-over-card__label text-sm uppercase tracking-wide ${
                      useWaterBackground ? '' : 'text-charcoal-muted'
                    }`}
                  >
                    FIM DE JOGO
                  </p>
                  <p
                    className={`game-over-card__score font-mono text-2xl font-bold ${
                      useWaterBackground ? '' : 'text-white'
                    }`}
                  >
                    {session.score} pontos
                  </p>
                  {session.beatRecord ? (
                    <p className="mt-1 text-sm text-emerald-400">Novo recorde pessoal!</p>
                  ) : highScore ? (
                    <p
                      className={`game-over-card__meta mt-1 text-sm ${
                        useWaterBackground ? '' : 'text-charcoal-muted'
                      }`}
                    >
                      Recorde: {highScore.score} pontos
                    </p>
                  ) : null}
                </div>
              </motion.div>
            )}
          </main>
        </motion.div>
      )}

      {showCurtain && (
        <CurtainOverlay
          key={presentation === 'closing' ? 'closing' : 'curtain'}
          open={curtainOpen}
          initialOpen={curtainInitialOpen}
        />
      )}

      {showMenuChrome && (
        <>
          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
            <div className="pointer-events-auto">
              <MenuPlayButton onClick={handlePlay} />
            </div>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-[60] flex items-end justify-between px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <MenuHudButton
              label="Recorde"
              onClick={() => {
                onPlayClick()
                setHistoryOpen(true)
              }}
            >
              <IconTrophy />
            </MenuHudButton>

            <MenuHudButton
              label="Configurações"
              onClick={() => {
                onPlayClick()
                setSettingsOpen(true)
              }}
            >
              <IconGear />
            </MenuHudButton>
          </footer>
        </>
      )}

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        highScore={highScore}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onSoundChange={onSoundChange}
        backgroundTheme={backgroundTheme}
        onBackgroundThemeChange={onBackgroundThemeChange}
      />
    </div>
  )
}
