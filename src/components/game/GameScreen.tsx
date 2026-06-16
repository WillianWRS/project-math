import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ForwardLinesBackground } from './ForwardLinesBackground'
import { useMobileLayout } from '../../hooks/useMobileLayout'
import { OPERATOR_COLOR_CLASS } from '../../engine/operation-generator'
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
  onInputChange: (value: string) => void
  onSoundChange: (enabled: boolean) => void
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
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
}: {
  operation: Operation
  className?: string
  slotClassName?: string
}) {
  const key = `${operation.operator} ${operation.operand}`

  return (
    <div className={`relative overflow-hidden ${slotClassName ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={key}
          className={`absolute inset-x-0 font-mono tabular-nums ${className ?? ''}`}
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
          <span className={OPERATOR_COLOR_CLASS[operation.operator]}>{operation.operator}</span>
          <span className="text-stone-400"> {operation.operand}</span>
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
  children,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'accent'
  waterLight?: boolean
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
      className={`game-menu-hud-btn game-menu-hud-btn--inline${waterLight ? ' game-menu-hud-btn--water-light' : ''}`}
      aria-label={label}
    >
      <span className={plateClass}>
        <span className="game-menu-hud-btn__icon">{children}</span>
        <span className="game-menu-hud-btn__inline-text">{label}</span>
      </span>
    </button>
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
      <span>Play</span>
    </button>
  )
}

const answerFlashTransition = { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const }

function AnswerDigitPulse({ value }: { value: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
      aria-hidden
    >
      <motion.span
        className="answer-digit-pulse-ring answer-digit-pulse-ring--inner absolute z-[1] font-mono text-4xl font-bold tabular-nums"
        initial={{ scale: 1, opacity: 0.95 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={answerFlashTransition}
      >
        {value}
      </motion.span>
      <motion.span
        className="answer-digit-pulse-ring answer-digit-pulse-ring--outer absolute z-[1] font-mono text-4xl font-bold tabular-nums"
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.15, opacity: 0 }}
        transition={{ ...answerFlashTransition, duration: 0.62, delay: 0.05 }}
      >
        {value}
      </motion.span>
      <motion.span
        className="absolute z-[2] font-mono text-4xl font-bold tabular-nums text-amber-50"
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

function AnswerInput({
  value,
  inputDisabled,
  shake,
  shakeKey,
  answerFlash,
  flashKey,
  inputRef,
  onChange,
  onEnter,
  waterLight = false,
}: {
  value: string
  inputDisabled: boolean
  shake: boolean
  shakeKey: number
  answerFlash: string | null
  flashKey: number
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onEnter: () => void
  waterLight?: boolean
}) {
  return (
    <div
      className={`relative overflow-visible px-3 py-3${waterLight ? ' game-answer-row--water' : ''}`}
    >
      <AnimatePresence>
        {answerFlash && (
          <AnswerDigitPulse key={`${flashKey}-${answerFlash}`} value={answerFlash} />
        )}
      </AnimatePresence>
      <motion.div
        key={shakeKey}
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="go"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onEnter()
            }
          }}
          maxLength={2}
          disabled={inputDisabled}
          placeholder={answerFlash ? '' : '·'}
          className={`game-answer-slot h-16 w-full bg-transparent text-center font-mono text-4xl font-bold tabular-nums outline-none disabled:opacity-50 ${
            waterLight ? 'game-answer-slot--water' : ''
          } ${
            answerFlash
              ? 'text-transparent'
              : shake
                ? 'text-rose-400'
                : waterLight
                  ? 'text-sky-900'
                  : 'text-amber-50'
          }`}
          aria-label="Resposta"
        />
      </motion.div>
    </div>
  )
}

function TimerBar({ session }: { session: GameSession }) {
  const ratio =
    session.timerMaxMs > 0 ? Math.max(0, session.timerMs / session.timerMaxMs) : 0
  const urgent = ratio < 0.25
  const showSpark = ratio > 0.015

  if (session.phase !== 'playing') return null

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated">
      <motion.div
        className="relative h-full rounded-full"
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.08, ease: 'linear' }}
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
      </motion.div>
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
  onInputChange,
  onSoundChange,
  backgroundTheme,
  onBackgroundThemeChange,
}: GameScreenProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [presentation, setPresentation] = useState<PresentationPhase>('menu')
  const isMobile = useMobileLayout()
  const enterDurationMs = isMobile ? 340 : contentEnterDurationMs
  const closeDurationMs = isMobile ? 420 : curtainDurationMs
  const prevScoreRef = useRef(0)
  const answerInputRef = useRef<HTMLInputElement>(null)
  const prevSubmitLockedRef = useRef(false)

  const isPlaying = session.phase === 'playing'
  const isGameOver = session.phase === 'game_over'
  const showGameContent = presentation === 'opening' || presentation === 'in-game'
  const showMenuChrome = presentation === 'menu'
  const isInGameScene = presentation !== 'menu'
  const useWaterBackground = isInGameScene && backgroundTheme === 'water'
  const showCurtain = presentation !== 'in-game'
  const curtainOpen = presentation === 'opening'
  const curtainInitialOpen = presentation === 'closing'

  const handlePlay = () => {
    if (presentation !== 'menu') return
    setPresentation('opening')
  }

  const handleReturnToMenu = () => {
    if (presentation !== 'in-game') return
    onReturnToMenu()
    setPresentation('closing')
  }

  const handlePlayAgain = () => {
    if (presentation !== 'in-game' || session.phase !== 'game_over') return
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
    if (!showGameContent || session.phase !== 'playing') return

    const timeout = window.setTimeout(() => {
      answerInputRef.current?.focus()
    }, 50)

    return () => window.clearTimeout(timeout)
  }, [showGameContent, session.phase, presentation])

  useEffect(() => {
    const wasLocked = prevSubmitLockedRef.current
    prevSubmitLockedRef.current = session.isSubmitLocked

    if (wasLocked && !session.isSubmitLocked && session.phase === 'playing') {
      const timeout = window.setTimeout(() => {
        answerInputRef.current?.focus()
      }, 0)
      return () => window.clearTimeout(timeout)
    }
  }, [session.isSubmitLocked, session.phase])

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
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Score</p>
            <div className="relative left-1/2 h-12 w-screen -translate-x-1/2">
              <div className="mx-auto flex h-full max-w-md items-end px-4">
                <div className="relative h-12 flex-1 overflow-hidden">
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

              <AnimatePresence>
                {isGameOver && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <MenuHudInlineButton
                      label="Menu"
                      onClick={handleReturnToMenu}
                      waterLight={useWaterBackground}
                    >
                      <IconBack />
                    </MenuHudInlineButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          <main className="mt-5 flex flex-1 flex-col items-center gap-4">
            <div
              className={`game-play-stack w-full max-w-xs rounded-3xl ${
                useWaterBackground ? 'game-play-stack--water' : 'bg-charcoal-field'
              }`}
            >
              <div className="overflow-hidden">
                <div className="game-play-stack__divider border-b px-5 py-4 text-center">
                {isPlaying || isGameOver ? (
                  <SlideValue
                    value={session.baseNumber}
                    slotClassName="h-14"
                    className={`text-5xl font-bold ${useWaterBackground ? 'text-sky-900' : 'text-white'}`}
                  />
                ) : (
                  <p
                    className={`font-mono text-5xl font-bold tabular-nums ${
                      useWaterBackground ? 'text-sky-700/45' : 'text-charcoal-muted'
                    }`}
                  >
                    —
                  </p>
                )}
              </div>

              <div className="game-play-stack__divider border-b px-5 py-3 text-center">
                {session.operation && (isPlaying || isGameOver) ? (
                  <OperationValue
                    operation={session.operation}
                    slotClassName="h-10"
                    className="text-3xl font-medium tracking-wide"
                  />
                ) : (
                  <p
                    className={`font-mono text-3xl font-medium tabular-nums tracking-wide ${
                      useWaterBackground ? 'text-sky-700/45' : 'text-charcoal-muted'
                    }`}
                  >
                    —
                  </p>
                )}
              </div>
              </div>

              <AnswerInput
                value={session.inputValue}
                inputDisabled={!isPlaying || session.isSubmitLocked}
                shake={session.isSubmitLocked}
                shakeKey={shakeKey}
                answerFlash={session.answerFlash}
                flashKey={session.score}
                inputRef={answerInputRef}
                onChange={onInputChange}
                onEnter={onConfirm}
                waterLight={useWaterBackground}
              />
            </div>

            <div className="w-full max-w-xs">
              <TimerBar session={session} />
            </div>

            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex w-full max-w-xs flex-col items-center gap-4"
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
                    Game over
                  </p>
                  <p
                    className={`game-over-card__score font-mono text-2xl font-bold ${
                      useWaterBackground ? '' : 'text-white'
                    }`}
                  >
                    {session.score} pts
                  </p>
                  {session.beatRecord ? (
                    <p className="mt-1 text-sm text-emerald-400">Novo recorde pessoal!</p>
                  ) : highScore ? (
                    <p
                      className={`game-over-card__meta mt-1 text-sm ${
                        useWaterBackground ? '' : 'text-charcoal-muted'
                      }`}
                    >
                      Recorde: {highScore.score} pts
                    </p>
                  ) : null}
                </div>
                <MenuHudInlineButton
                  label="Jogar novamente"
                  variant="accent"
                  onClick={handlePlayAgain}
                  waterLight={useWaterBackground}
                >
                  <span className="scale-75">
                    <IconPlay />
                  </span>
                </MenuHudInlineButton>
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
            <MenuHudButton label="Histórico" onClick={() => setHistoryOpen(true)}>
              <IconTrophy />
            </MenuHudButton>

            <MenuHudButton label="Config" onClick={() => setSettingsOpen(true)}>
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
