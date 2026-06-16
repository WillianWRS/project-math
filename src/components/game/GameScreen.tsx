import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ForwardLinesBackground } from './ForwardLinesBackground'
import { formatOperation } from '../../engine/operation-generator'
import type { GameSession } from '../../engine/types'
import { HistoryModal } from '../modals/HistoryModal'
import { SettingsModal } from '../modals/SettingsModal'
import type { HighScoreRecord } from '../../platform/storage'

interface GameScreenProps {
  session: GameSession
  highScore: HighScoreRecord | null
  soundEnabled: boolean
  onStart: () => void
  onReturnToMenu: () => void
  onConfirm: () => void
  onInputChange: (value: string) => void
  onSoundChange: (enabled: boolean) => void
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
  value,
  className,
  slotClassName,
}: {
  value: string
  className?: string
  slotClassName?: string
}) {
  return (
    <div className={`relative overflow-hidden ${slotClassName ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={value}
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
          {value}
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
  const leftClosed = '0%'
  const leftOpen = '-100%'
  const rightClosed = '0%'
  const rightOpen = '100%'

  return (
    <>
      <motion.div
        className="curtain-panel curtain-panel-left"
        initial={{ x: initialOpen ? leftOpen : leftClosed }}
        animate={{ x: open ? leftOpen : leftClosed }}
        transition={curtainTransition}
        aria-hidden
      />
      <motion.div
        className="curtain-panel curtain-panel-right"
        initial={{ x: initialOpen ? rightOpen : rightClosed }}
        animate={{ x: open ? rightOpen : rightClosed }}
        transition={curtainTransition}
        aria-hidden
      />
    </>
  )
}

function MenuActionButton({
  label,
  onClick,
  variant = 'secondary',
  children,
}: {
  label: string
  onClick: () => void
  variant?: 'secondary' | 'play'
  children: ReactNode
}) {
  const isPlay = variant === 'play'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        isPlay
          ? 'game-btn-push game-btn-push-amber flex items-center gap-2.5 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3.5 text-lg font-bold tracking-wide text-amber-950'
          : 'game-btn-push flex items-center gap-2 rounded-xl bg-gradient-to-b from-charcoal-elevated to-charcoal-field px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-200 ring-1 ring-stone-600/45'
      }
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function ConfirmButton({
  disabled,
  onClick,
  pulseKey,
}: {
  disabled: boolean
  onClick: () => void
  pulseKey: number
}) {
  const lastPulseRef = useRef(0)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (pulseKey === 0 || pulseKey === lastPulseRef.current) return
    lastPulseRef.current = pulseKey
    setShaking(true)
    const timeout = window.setTimeout(() => setShaking(false), 320)
    return () => window.clearTimeout(timeout)
  }, [pulseKey])

  return (
    <div className="relative h-[4.25rem] w-[4.25rem] shrink-0">
      <AnimatePresence>
        {pulseKey > 0 && (
          <motion.span
            key={pulseKey}
            className="pointer-events-none absolute inset-0 rounded-full bg-emerald-400"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="game-btn-push game-btn-push-emerald relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-2xl font-bold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Confirmar"
        animate={
          shaking
            ? { x: [0, -2, 2, -2, 2, 0], scale: [1, 1.07, 1] }
            : { x: 0, scale: 1 }
        }
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        ✓
      </motion.button>
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
}: GameScreenProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [correctPulseKey, setCorrectPulseKey] = useState(0)
  const [presentation, setPresentation] = useState<PresentationPhase>('menu')
  const prevScoreRef = useRef(0)
  const answerInputRef = useRef<HTMLInputElement>(null)
  const prevSubmitLockedRef = useRef(false)

  const isPlaying = session.phase === 'playing'
  const isGameOver = session.phase === 'game_over'
  const showGameContent = presentation === 'opening' || presentation === 'in-game'
  const showMenuChrome = presentation === 'menu'
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

  useEffect(() => {
    if (presentation !== 'opening') return

    const timeout = window.setTimeout(() => {
      setPresentation((current) => {
        if (current !== 'opening') return current
        onStart()
        return 'in-game'
      })
    }, contentEnterDurationMs)

    return () => window.clearTimeout(timeout)
  }, [presentation, onStart])

  useEffect(() => {
    if (presentation !== 'closing') return

    const timeout = window.setTimeout(() => {
      setPresentation((current) => (current === 'closing' ? 'menu' : current))
    }, curtainDurationMs)

    return () => window.clearTimeout(timeout)
  }, [presentation])

  useEffect(() => {
    if (session.isSubmitLocked && session.phase === 'playing') {
      setShakeKey((key) => key + 1)
    }
  }, [session.isSubmitLocked, session.phase])

  useEffect(() => {
    if (session.phase === 'playing' && session.score > prevScoreRef.current) {
      setCorrectPulseKey((key) => key + 1)
    }
    prevScoreRef.current = session.score
  }, [session.score, session.phase])

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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-charcoal text-white">
      <ForwardLinesBackground active level={session.level} speedMultiplier={isGameOver ? 0.1 : 1} />

      {showGameContent && (
        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={contentEnterTransition}
        >
          <header>
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
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    onClick={handleReturnToMenu}
                    className="game-btn-push absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-stone-300 ring-1 ring-stone-700/40"
                    aria-label="Voltar ao menu"
                  >
                    <IconBack />
                    Menu
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </header>

          <main className="mt-5 flex flex-1 flex-col items-center gap-4">
            <div className="game-play-stack w-full max-w-xs overflow-hidden rounded-3xl bg-charcoal-field">
              <div className="border-b border-stone-800/90 px-5 py-4 text-center">
                {isPlaying || isGameOver ? (
                  <SlideValue
                    value={session.baseNumber}
                    slotClassName="h-14"
                    className="text-5xl font-bold text-white"
                  />
                ) : (
                  <p className="font-mono text-5xl font-bold tabular-nums text-charcoal-muted">—</p>
                )}
              </div>

              <div className="border-b border-stone-800/90 px-5 py-3 text-center">
                {session.operation && (isPlaying || isGameOver) ? (
                  <OperationValue
                    value={formatOperation(session.operation)}
                    slotClassName="h-10"
                    className="text-3xl font-medium tracking-wide text-stone-500"
                  />
                ) : (
                  <p className="font-mono text-3xl font-medium tabular-nums tracking-wide text-charcoal-muted">
                    —
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 px-3 py-3">
                <motion.div
                  key={shakeKey}
                  className="flex-1"
                  animate={
                    session.isSubmitLocked
                      ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.4 }}
                >
                  <input
                    ref={answerInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={session.inputValue}
                    onChange={(event) => onInputChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        onConfirm()
                      }
                    }}
                    maxLength={2}
                    disabled={!isPlaying || session.isSubmitLocked}
                    placeholder="·"
                    className={`game-answer-slot h-16 w-full bg-transparent text-center font-mono text-4xl font-bold tabular-nums text-amber-50 outline-none disabled:opacity-50 ${
                      session.isSubmitLocked ? 'text-rose-400' : ''
                    }`}
                    aria-label="Resposta"
                  />
                </motion.div>
                <ConfirmButton
                  onClick={onConfirm}
                  disabled={!isPlaying || session.isSubmitLocked}
                  pulseKey={correctPulseKey}
                />
              </div>
            </div>

            <div className="w-full max-w-xs">
              <TimerBar session={session} />
            </div>

            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full max-w-xs rounded-2xl bg-charcoal-field p-4 text-center"
              >
                <p className="text-sm uppercase tracking-wide text-charcoal-muted">Game over</p>
                <p className="font-mono text-2xl font-bold text-white">{session.score} pts</p>
                {session.beatRecord ? (
                  <p className="mt-1 text-sm text-emerald-400">Novo recorde pessoal!</p>
                ) : highScore ? (
                  <p className="mt-1 text-sm text-charcoal-muted">Recorde: {highScore.score} pts</p>
                ) : null}
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
              <MenuActionButton label="Play" variant="play" onClick={handlePlay}>
                <IconPlay />
              </MenuActionButton>
            </div>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-[60] flex items-end justify-between px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <MenuActionButton label="Histórico" onClick={() => setHistoryOpen(true)}>
              <IconTrophy />
            </MenuActionButton>

            <MenuActionButton label="Config" onClick={() => setSettingsOpen(true)}>
              <IconGear />
            </MenuActionButton>
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
      />
    </div>
  )
}
