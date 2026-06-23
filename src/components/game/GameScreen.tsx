import { AnimatePresence, motion } from '../../lib/motion'
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ForwardLinesBackground } from './ForwardLinesBackground'
import { NumericKeypad } from './NumericKeypad'
import { PlayFieldsSideLayout } from './SideCardRails'
import {
  ElapsedTimeLabel,
  PlayingTimerBar,
  TIMER_URGENT_RATIO,
} from './GameTimerDisplay'
import { useGameTimer } from '../../hooks/useGameTimer'
import { CurtainOverlay } from './CurtainOverlay'
import { PlayFieldsFrame } from './PlayFieldsFrame'
import { WaterSceneLayer } from './WaterSceneLayer'
import { SLIDE_TRANSITION } from '../../lib/motion-presets'
import { isFourSecondsGameChangerActive, isMinusGameChangerActive, isPlusGameChangerActive, isTimesDivGameChangerActive } from '../../engine/game-changer-cycles'
import { OPERATOR_COLOR_CLASS } from '../../engine/operation-generator'
import { SUBMIT_LOCK_MS } from '../../engine/game-state-machine'
import { RightSideCardCatalog, type RightCardVariant } from './side-card-types'
import type { Operation } from '../../engine/types'
import type { GameSession } from '../../engine/types'
import { PlayerModal } from '../modals/PlayerModal'
import { ShopModal } from '../modals/ShopModal'
import { SettingsModal } from '../modals/SettingsModal'
import { ShareCardTemplate } from '../share/ShareCardTemplate'
import { shareScoreCardFromElement } from '../../utils/share-score-card'
import { xpToLevel } from '../../engine/player-level'
import { formatDuration } from '../../engine/rewards'
import { preloadGameplayModals } from '../../platform/preload-modals'
import type { BackgroundTheme, PlayerData, ScoreRecord } from '../../platform/storage'
import type { PostGameRewards } from '../../hooks/useGame'
import type { BenchmarkMetricGradeId, BenchmarkMetrics, BenchmarkVirtualKey } from '../../engine/benchmark-types'

const RewardedAutoCheckModal = lazy(() =>
  import('../modals/RewardedAutoCheckModal').then((m) => ({ default: m.RewardedAutoCheckModal })),
)
const AutoCheckTimeoutModal = lazy(() =>
  import('../modals/AutoCheckTimeoutModal').then((m) => ({ default: m.AutoCheckTimeoutModal })),
)

interface GameScreenProps {
  session: GameSession
  inputValue: string
  topScores: ScoreRecord[]
  player: PlayerData
  lastGameRewards: PostGameRewards
  benchmarkMode: boolean
  perfectAnswerToken: number
  benchmarkMetrics: BenchmarkMetrics | null
  benchmarkVirtualKeypadPress: { key: BenchmarkVirtualKey; token: number } | null
  soundEnabled: boolean
  devModeEnabled: boolean
  backgroundTheme: BackgroundTheme
  onStart: () => void
  onStartBenchmarkSession: () => void
  onReturnToMenu: () => void
  onConfirm: () => void
  onAutoCorrect: () => void
  onUseAutoCheckAtTimeout: () => void
  onDeclineAutoCheckAtTimeout: () => void
  onInputChange: (value: string) => void
  onSoundChange: (enabled: boolean) => void
  onDevModeChange: (enabled: boolean) => void
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
  onSaveDisplayName: (name: string) => void
  onWatchRewardedAd: () => Promise<'completed' | 'dismissed' | 'limit'>
  rewardedAdsWatched: number
  onPlayClick: () => void
  onPlayGameStart: () => void
  onPlayWriteKey: () => void
  onPlayEraseKey: () => void
  onPlayGoToMenu: () => void
}

type PresentationPhase = 'menu' | 'opening' | 'in-game' | 'theme-test' | 'closing'

const slideTransition = SLIDE_TRANSITION
const sceneEnterTransition = { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const }
const ENTER_DURATION_MS = 340
const CLOSE_DURATION_MS = 420
const menuStageTransition = { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const }
const layerParallaxTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }

function menuStageItem(
  delay: number,
  offsetX: number,
  offsetY: number,
): {
  initial: { opacity: number; x: number; y: number; scale: number }
  animate: { opacity: number; x: number; y: number; scale: number; transition: typeof menuStageTransition & { delay: number } }
} {
  return {
    initial: { opacity: 0, x: offsetX, y: offsetY, scale: 0.97 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { ...menuStageTransition, delay },
    },
  }
}

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
      <AnimatePresence mode="sync" initial={false}>
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
      <AnimatePresence mode="sync" initial={false}>
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

function IconCheckSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function IconArrowUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5l6 7H6l6-7z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19l6-7H6l6 7z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RightCardIcon({ variant }: { variant: RightCardVariant }) {
  const iconClass = `game-side-card__icon game-side-card__icon--${variant}`

  if (variant === 'cap-up') {
    return (
      <span className={iconClass}>
        <IconArrowUp />
      </span>
    )
  }
  if (variant === 'cap-down') {
    return (
      <span className={iconClass}>
        <IconArrowDown />
      </span>
    )
  }
  if (variant === 'timer') {
    return (
      <span className={iconClass}>
        <IconClock />
      </span>
    )
  }
  return <span className={`${iconClass} game-side-card__icon--glyph`}>×÷</span>
}

function ThemeTestSideLayout({
  activeChanger,
  autoCheckEnabled,
  onToggleAutoCheck,
  onToggleChanger,
  onPlayClick,
  parallaxActive,
  children,
}: {
  activeChanger: RightCardVariant | null
  autoCheckEnabled: boolean
  onToggleAutoCheck: () => void
  onToggleChanger: (variant: RightCardVariant) => void
  onPlayClick: () => void
  parallaxActive: boolean
  children: ReactNode
}) {
  return (
    <div className="game-play-row">
      <motion.div
        className="relative z-[1]"
        initial={{ x: -16, y: 10, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: -16, y: 10, opacity: 0.95 }}
        transition={layerParallaxTransition}
      >
        <div className="game-side-cards game-side-cards--left !pointer-events-auto">
          {Array.from({ length: RightSideCardCatalog.cardCount }, (_, index) => (
            <div key={`left-slot-${index}`} className="game-side-card-slot">
              {index === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    onPlayClick()
                    onToggleAutoCheck()
                  }}
                  className={`game-side-card game-side-card--legendary game-side-card--auto-cycle transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
                    autoCheckEnabled ? '' : 'opacity-55 saturate-50'
                  }`}
                  aria-pressed={autoCheckEnabled}
                  aria-label={`Auto-check ${autoCheckEnabled ? 'ativado' : 'desativado'}`}
                >
                  <span className="game-side-card__content">
                    <span className="game-side-card__label game-side-card__label--legendary">AUTO</span>
                    <span className="game-side-card__icon game-side-card__icon--legendary">
                      <IconCheckSmall />
                    </span>
                  </span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="game-play-row__center"
        initial={{ x: 0, y: 14, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: 0, y: 14, opacity: 0.96 }}
        transition={layerParallaxTransition}
      >
        {children}
      </motion.div>

      <motion.div
        className="relative z-[1]"
        initial={{ x: 16, y: 10, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: 16, y: 10, opacity: 0.95 }}
        transition={layerParallaxTransition}
      >
        <div className="game-side-cards game-side-cards--right !pointer-events-auto">
          {RightSideCardCatalog.cards.map((card) => {
            const active = activeChanger === card.variant

            return (
              <div key={card.id} className="game-side-card-slot">
                <button
                  type="button"
                  onClick={() => {
                    onPlayClick()
                    onToggleChanger(card.variant)
                  }}
                  className={`game-side-card ${card.styleClass} transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] ${
                    active ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-charcoal' : ''
                  }`}
                  aria-pressed={active}
                  aria-label={`Alternar preview do game changer ${card.id}`}
                >
                  <span className="game-side-card__content">
                    <RightCardIcon variant={card.variant} />
                    {card.label ? (
                      <span className={`game-side-card__label ${card.labelClass ?? ''}`}>{card.label}</span>
                    ) : null}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8.7 10.7l6.6-3.4M8.7 13.3l6.6 3.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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

function MenuBenchmarkButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Iniciar benchmark"
      className="game-btn-push game-btn-push-secondary flex items-center gap-2 rounded-xl bg-charcoal-elevated px-5 py-2.5 text-sm font-semibold tracking-wide text-stone-200 ring-1 ring-stone-700/50"
    >
      <span>Benchmark</span>
    </button>
  )
}

function MenuThemeTestButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir teste de tema"
      className="game-btn-push game-btn-push-secondary flex items-center gap-2 rounded-xl bg-charcoal-elevated px-5 py-2.5 text-sm font-semibold tracking-wide text-stone-200 ring-1 ring-stone-700/50"
    >
      <span>Theme Test</span>
    </button>
  )
}

function formatBenchmarkMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function benchmarkGradeTone(grade: string): string {
  switch (grade) {
    case 'S':
      return 'text-emerald-300'
    case 'A':
      return 'text-lime-300'
    case 'B':
      return 'text-amber-300'
    case 'C':
      return 'text-orange-300'
    case 'D':
      return 'text-orange-400'
    case 'E':
      return 'text-rose-300'
    default:
      return 'text-rose-400'
  }
}

function gradeForMetric(metrics: BenchmarkMetrics, id: BenchmarkMetricGradeId) {
  return metrics.grades.find((grade) => grade.id === id)
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

function PerfectAnswerBadge({ token }: { token: number }) {
  return (
    <motion.div
      key={`perfect-${token}`}
      className="pointer-events-none absolute left-1/2 top-1 z-[5] -translate-x-1/2"
      initial={{ opacity: 0, y: 16, scale: 0.84 }}
      animate={{
        opacity: [0, 1, 0],
        y: [16, -4, -30],
        scale: [0.84, 1, 0.95],
      }}
      transition={{ duration: 1, times: [0, 0.28, 1], ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <motion.span
        className="game-perfect-badge__trail game-perfect-badge__trail--inner"
        initial={{ opacity: 0.82, scaleX: 0.72 }}
        animate={{ opacity: [0.82, 0], scaleX: [0.72, 1.34] }}
        transition={{ duration: 1, times: [0, 1], ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="game-perfect-badge__trail game-perfect-badge__trail--outer"
        initial={{ opacity: 0.58, scaleX: 0.66 }}
        animate={{ opacity: [0.58, 0], scaleX: [0.66, 1.52] }}
        transition={{ duration: 1, times: [0, 1], ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="game-perfect-badge">PERFEITO</span>
    </motion.div>
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
  perfectAnswerToken,
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
  perfectAnswerToken: number
  waterLight?: boolean
  fourSecondsLight?: boolean
  timesDivLight?: boolean
  plusLight?: boolean
  minusLight?: boolean
  slotRef?: RefObject<HTMLDivElement | null>
}) {
  const displayValue = answerFlash ? '' : value || '·'
  const gameChangerActive = fourSecondsLight || timesDivLight || plusLight || minusLight
  const useWaterAnswerRow = waterLight && !gameChangerActive

  return (
    <div
      className={`relative overflow-visible px-3 py-3${useWaterAnswerRow ? ' game-answer-row--water' : ''}`}
    >
      {perfectAnswerToken > 0 && <PerfectAnswerBadge token={perfectAnswerToken} />}
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


export function GameScreen({
  session,
  inputValue,
  topScores,
  player,
  lastGameRewards,
  benchmarkMode,
  perfectAnswerToken,
  benchmarkMetrics,
  benchmarkVirtualKeypadPress,
  soundEnabled,
  devModeEnabled,
  onStart,
  onStartBenchmarkSession,
  onReturnToMenu,
  onConfirm,
  onAutoCorrect,
  onUseAutoCheckAtTimeout,
  onDeclineAutoCheckAtTimeout,
  onInputChange,
  onSoundChange,
  onDevModeChange,
  backgroundTheme,
  onBackgroundThemeChange,
  onSaveDisplayName,
  onWatchRewardedAd,
  rewardedAdsWatched,
  onPlayClick,
  onPlayGameStart,
  onPlayWriteKey,
  onPlayEraseKey,
  onPlayGoToMenu,
}: GameScreenProps) {
  const [playerOpen, setPlayerOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [rewardedOpen, setRewardedOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [presentation, setPresentation] = useState<PresentationPhase>('menu')
  const prevScoreRef = useRef(0)
  const answerFieldRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [victoryBorderPulseToken, setVictoryBorderPulseToken] = useState(0)
  const [pendingStartMode, setPendingStartMode] = useState<'play' | 'benchmark' | 'theme-test' | null>(null)
  const [themeTestScore, setThemeTestScore] = useState(0)
  const [themeTestBurstFlash, setThemeTestBurstFlash] = useState<number | null>(null)
  const [themeTestBurstToken, setThemeTestBurstToken] = useState(0)
  const [themeTestChanger, setThemeTestChanger] = useState<RightCardVariant | null>(null)
  const [themeTestAutoCheckEnabled, setThemeTestAutoCheckEnabled] = useState(true)
  const onStartRef = useRef(onStart)
  const onStartBenchmarkSessionRef = useRef(onStartBenchmarkSession)
  const onInputChangeRef = useRef(onInputChange)
  const onConfirmRef = useRef(onConfirm)
  const onPlayWriteKeyRef = useRef(onPlayWriteKey)
  const onPlayEraseKeyRef = useRef(onPlayEraseKey)
  const inputValueRef = useRef(inputValue)
  const inputDisabledRef = useRef(false)
  const benchmarkModeRef = useRef(benchmarkMode)
  const phaseRef = useRef(session.phase)
  const submitLockedRef = useRef(session.isSubmitLocked)

  useEffect(() => {
    onStartRef.current = onStart
  }, [onStart])

  useEffect(() => {
    onStartBenchmarkSessionRef.current = onStartBenchmarkSession
  }, [onStartBenchmarkSession])

  useEffect(() => {
    onInputChangeRef.current = onInputChange
  }, [onInputChange])

  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

  useEffect(() => {
    onPlayWriteKeyRef.current = onPlayWriteKey
  }, [onPlayWriteKey])

  useEffect(() => {
    onPlayEraseKeyRef.current = onPlayEraseKey
  }, [onPlayEraseKey])

  const isPlaying = session.phase === 'playing'
  const isGameOver = session.phase === 'game_over'
  const isThemeTestScene = presentation === 'theme-test'
  const anyModalOpen =
    playerOpen ||
    shopOpen ||
    settingsOpen ||
    rewardedOpen ||
    (session.awaitingAutoCheckChoice && isPlaying && !benchmarkMode)
  const playerLevel = xpToLevel(player.xp)
  const gameOverElapsedText = formatDuration(session.elapsedMs)
  const liveFourSecondsActive = isFourSecondsGameChangerActive(session)
  const topScore = topScores[0] ?? null
  const liveTimesDivActive = isTimesDivGameChangerActive(session)
  const livePlusActive = isPlusGameChangerActive(session)
  const liveMinusActive = isMinusGameChangerActive(session)
  const fourSecondsActive = isThemeTestScene ? themeTestChanger === 'timer' : liveFourSecondsActive
  const timesDivActive = isThemeTestScene ? themeTestChanger === 'mult-div' : liveTimesDivActive
  const plusActive = isThemeTestScene ? themeTestChanger === 'cap-up' : livePlusActive
  const minusActive = isThemeTestScene ? themeTestChanger === 'cap-down' : liveMinusActive
  const currentScore = isThemeTestScene ? themeTestScore : session.score
  const inputDisabled = !isPlaying || session.isSubmitLocked || benchmarkMode

  useEffect(() => {
    inputValueRef.current = inputValue
  }, [inputValue])

  useEffect(() => {
    inputDisabledRef.current = inputDisabled
  }, [inputDisabled])

  useEffect(() => {
    benchmarkModeRef.current = benchmarkMode
  }, [benchmarkMode])

  useEffect(() => {
    phaseRef.current = session.phase
    submitLockedRef.current = session.isSubmitLocked
  }, [session.phase, session.isSubmitLocked])

  const appendDigit = useCallback(
    (digit: string) => {
      if (inputDisabled) return
      onPlayWriteKey()
      const nextValue = `${inputValueRef.current}${digit}`
      inputValueRef.current = nextValue
      onInputChange(nextValue)
    },
    [inputDisabled, onInputChange, onPlayWriteKey],
  )

  const backspaceDigit = useCallback(() => {
    if (inputDisabled || inputValueRef.current.length === 0) return
    onPlayEraseKey()
    const nextValue = inputValueRef.current.slice(0, -1)
    inputValueRef.current = nextValue
    onInputChange(nextValue)
  }, [inputDisabled, onInputChange, onPlayEraseKey])
  const showGameContent = presentation === 'opening' || presentation === 'in-game' || presentation === 'theme-test'
  const showMenuChrome = presentation === 'menu'
  const isInGameScene = presentation !== 'menu'
  const parallaxLayerActive =
    presentation === 'opening' || presentation === 'in-game' || presentation === 'theme-test'
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
  const showCurtain = presentation !== 'in-game' && presentation !== 'theme-test'
  const curtainOpen = presentation === 'opening'
  const curtainInitialOpen = presentation === 'closing'

  const handleShare = async () => {
    const card = document.getElementById('share-card-template')
    if (!card || sharing) return
    setSharing(true)
    try {
      await shareScoreCardFromElement(card)
    } finally {
      setSharing(false)
    }
  }

  const handlePlay = () => {
    if (presentation !== 'menu') return
    setPendingStartMode('play')
    onPlayGameStart()
    setSharing(false)
    setPresentation('opening')
  }

  const handleBenchmark = () => {
    if (presentation !== 'menu') return
    setPendingStartMode('benchmark')
    onPlayGameStart()
    setSharing(false)
    setPresentation('opening')
  }

  const handleThemeTest = () => {
    if (presentation !== 'menu') return
    setPendingStartMode('theme-test')
    setThemeTestScore(0)
    setThemeTestBurstFlash(null)
    setThemeTestBurstToken(0)
    setThemeTestChanger(null)
    setThemeTestAutoCheckEnabled(true)
    onPlayGameStart()
    setSharing(false)
    setPresentation('opening')
  }

  const handleReturnToMenu = () => {
    if (!isInGameScene) return
    onPlayGoToMenu()
    onReturnToMenu()
    setSharing(false)
    setPresentation('closing')
  }

  const handlePlayAgain = () => {
    if (presentation !== 'in-game' || session.phase !== 'game_over') return
    onPlayGameStart()
    prevScoreRef.current = 0
    setSharing(false)
    onStart()
  }

  const handleThemeTestFieldClick = () => {
    if (!isThemeTestScene) return
    onPlayClick()
    setThemeTestScore((previous) => {
      const next = previous + 100
      if (next >= 200) {
        setThemeTestBurstFlash(5)
        setThemeTestBurstToken((token) => token + 1)
      }
      return next
    })
  }

  const handleThemeTestChangerToggle = (variant: RightCardVariant) => {
    setThemeTestChanger((current) => (current === variant ? null : variant))
  }

  const handleThemeTestAutoCheckToggle = () => {
    setThemeTestAutoCheckEnabled((current) => !current)
  }

  const handleThemeTestKeypadDigit = () => {
    if (!isThemeTestScene) return
    onPlayWriteKey()
    // Theme Test não altera o input principal; apenas feedback visual/sonoro.
  }

  const handleThemeTestKeypadBackspace = () => {
    if (!isThemeTestScene) return
    onPlayEraseKey()
  }

  const handleThemeTestKeypadEnter = () => {
    if (!isThemeTestScene) return
    onPlayClick()
  }

  const handleThemeTestKeypadAuto = () => {
    if (!isThemeTestScene) return
    onPlayClick()
    handleThemeTestAutoCheckToggle()
  }

  useEffect(() => {
    if (!showMenuChrome) return

    let cancelled = false
    const preload = () => {
      if (!cancelled) preloadGameplayModals()
    }

    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(preload)
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }

    const timeoutId = window.setTimeout(preload, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [showMenuChrome])

  useEffect(() => {
    if (presentation !== 'opening' || pendingStartMode === null) return

    const mode = pendingStartMode
    const timeout = window.setTimeout(() => {
      if (mode === 'benchmark') {
        onStartBenchmarkSessionRef.current()
        setPresentation('in-game')
      } else if (mode === 'theme-test') {
        setPresentation('theme-test')
      } else {
        onStartRef.current()
        setPresentation('in-game')
      }
      setPendingStartMode(null)
    }, ENTER_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [presentation, pendingStartMode])

  useEffect(() => {
    if (presentation !== 'closing') return

    const timeout = window.setTimeout(() => {
      setPresentation((current) => (current === 'closing' ? 'menu' : current))
    }, CLOSE_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [presentation])

  useEffect(() => {
    if (themeTestBurstFlash === null) return
    const timeout = window.setTimeout(() => {
      setThemeTestBurstFlash(null)
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [themeTestBurstFlash])

  useEffect(() => {
    if (!session.isSubmitLocked || session.phase !== 'playing') return

    const frame = requestAnimationFrame(() => {
      setShakeKey((key) => key + 1)
    })

    return () => cancelAnimationFrame(frame)
  }, [session.isSubmitLocked, session.phase])

  useEffect(() => {
    if (session.phase === 'playing' && session.score === 0) {
      prevScoreRef.current = 0
    }
  }, [session.phase, session.score])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (benchmarkModeRef.current || phaseRef.current !== 'playing' || submitLockedRef.current) return

      if (event.key >= '0' && event.key <= '9') {
        if (inputDisabledRef.current) return
        event.preventDefault()
        const nextValue = `${inputValueRef.current}${event.key}`
        inputValueRef.current = nextValue
        onPlayWriteKeyRef.current()
        onInputChangeRef.current(nextValue)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        onConfirmRef.current()
      }
      if (event.key === 'Backspace') {
        if (inputDisabledRef.current || inputValueRef.current.length === 0) return
        event.preventDefault()
        const nextValue = inputValueRef.current.slice(0, -1)
        inputValueRef.current = nextValue
        onPlayEraseKeyRef.current()
        onInputChangeRef.current(nextValue)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const themeTestOperation: Operation = { operator: '+', operand: 7, result: 31 }
  const { timerMs: liveTimerMs } = useGameTimer()
  const timerNowMs = isPlaying ? liveTimerMs : session.timerMs
  const timerRatio = session.timerMaxMs > 0 ? Math.max(0, timerNowMs / session.timerMaxMs) : 0
  const timerDanger = isPlaying && timerRatio < TIMER_URGENT_RATIO
  const currentPlayStackClass = fourSecondsActive
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
  const showGoodSceneBorder = isInGameScene && !timerDanger && currentScore >= 500

  useEffect(() => {
    if (!isInGameScene || timerDanger) {
      prevScoreRef.current = currentScore
      return
    }

    const previousScore = prevScoreRef.current
    const previousMilestone = previousScore >= 500 ? Math.floor(previousScore / 100) : 4
    const currentMilestone = currentScore >= 500 ? Math.floor(currentScore / 100) : 4
    if (currentScore >= 500 && currentMilestone > previousMilestone) {
      setVictoryBorderPulseToken((token) => token + 1)
    }

    prevScoreRef.current = currentScore
  }, [currentScore, isInGameScene, timerDanger])

  return (
    <div
      className={`relative flex min-h-dvh flex-col overflow-hidden text-white transition-colors duration-500 ${
        useWaterBackground ? 'game-scene--water' : 'bg-charcoal'
      }`}
    >
      <AnimatePresence>
        {timerDanger && (
          <motion.div
            key="danger-vignette"
            className="game-scene-danger-vignette pointer-events-none absolute inset-0 z-[40]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      {timerDanger && (
        <div
          className="game-scene-border-pulse game-scene-border-pulse--danger game-scene-border-pulse--danger-animated pointer-events-none absolute inset-0 z-[45]"
          aria-hidden
        />
      )}
      {showGoodSceneBorder && (
        <div
          className="game-scene-border-static pointer-events-none absolute inset-0 z-[44]"
          aria-hidden
        />
      )}
      <AnimatePresence>
        {showGoodSceneBorder && victoryBorderPulseToken > 0 && (
          <motion.div
            key={`victory-border-${victoryBorderPulseToken}`}
            className="game-scene-border-burst pointer-events-none absolute inset-0 z-[45]"
            initial={{ opacity: 0.25, scale: 1 }}
            animate={{ opacity: [0.25, 0.9, 0], scale: [1, 1.01, 1.02] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        initial={false}
        animate={
          isInGameScene
            ? { x: 0, y: 0, scale: 1, opacity: 1 }
            : { x: 22, y: -12, scale: 1.04, opacity: 0.9 }
        }
        transition={layerParallaxTransition}
      >
        {useWaterBackground && <WaterSceneLayer />}
        <ForwardLinesBackground
          active={presentation !== 'menu' && !anyModalOpen}
          rhythmLevel={session.rhythmLevel}
          speedMultiplier={isGameOver ? 0.1 : 1}
          theme={useWaterBackground ? 'water' : 'default'}
        />
      </motion.div>

      {showGameContent && (
        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={sceneEnterTransition}
          style={{ willChange: presentation === 'opening' ? 'transform' : 'auto' }}
        >
          <motion.header
            className={useWaterBackground ? 'game-scene-header--water' : undefined}
            initial={{ opacity: 0, x: 10, y: -12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ ...layerParallaxTransition, delay: 0.04 }}
          >
            <motion.div
              key={`hud-shake-${shakeKey}`}
              animate={
                shakeKey > 0
                  ? { x: [0, -7, 6, -4, 3, 0], y: [0, -1, 1, -1, 0], rotate: [0, -0.3, 0.25, -0.12, 0] }
                  : { x: 0, y: 0, rotate: 0 }
              }
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-charcoal-muted">Pontuação</p>
                <span className="game-player-level-badge rounded-md bg-charcoal-elevated px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-200">
                  Nível {playerLevel}
                </span>
              </div>
              <div className="relative left-1/2 h-12 w-screen -translate-x-1/2">
                <div className="relative mx-auto h-full max-w-md px-4">
                  <p className="pointer-events-none absolute inset-x-0 top-0 text-center text-xs text-charcoal-muted">
                    {isThemeTestScene
                      ? '00:00'
                      : isPlaying
                        ? <ElapsedTimeLabel fallbackMs={session.elapsedMs} />
                        : gameOverElapsedText}
                  </p>
                  <div className="flex h-full items-end">
                    <div className="relative h-12 min-w-0 flex-1 overflow-hidden">
                      <AnimatePresence mode="sync" initial={false}>
                        <motion.p
                          key={currentScore}
                          className="absolute left-0 font-mono text-4xl font-bold tabular-nums text-white"
                          initial={{ y: '100%', opacity: 0.5 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: '-100%', opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {currentScore}
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
                    {isGameOver && !benchmarkMode && (
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
            </motion.div>
          </motion.header>

          <motion.main
            className="mt-5 flex flex-1 flex-col items-center gap-4"
            initial={{ opacity: 0, x: -8, y: 14 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ ...layerParallaxTransition, delay: 0.08 }}
          >
            {isThemeTestScene ? (
              <ThemeTestSideLayout
                activeChanger={themeTestChanger}
                autoCheckEnabled={themeTestAutoCheckEnabled}
                onToggleAutoCheck={handleThemeTestAutoCheckToggle}
                onToggleChanger={handleThemeTestChangerToggle}
                onPlayClick={onPlayClick}
                parallaxActive={parallaxLayerActive}
              >
                <PlayFieldsFrame
                  level={5}
                  levelUpFlash={themeTestBurstFlash}
                  burstScore={themeTestBurstToken}
                  waterLight={useWaterBackground}
                  borderActive
                  timerDanger={timerDanger}
                >
                  <div
                    className={`game-play-stack w-full rounded-3xl ${currentPlayStackClass}${
                      timerDanger ? ' game-play-stack--timer-danger' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleThemeTestFieldClick}
                      className="game-play-stack__divider block w-full border-b px-3 py-4 text-center"
                    >
                      <SlideValue
                        value={24}
                        slotClassName="h-14"
                        className={`text-5xl font-bold ${baseFieldClass}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleThemeTestFieldClick}
                      className="game-play-stack__divider block w-full border-b px-3 py-3 text-center"
                    >
                      <OperationValue
                        operation={themeTestOperation}
                        slotClassName="h-10"
                        waterLight={useWaterBackground}
                        fourSecondsLight={fourSecondsActive}
                        timesDivLight={timesDivActive}
                        plusLight={plusActive}
                        minusLight={minusActive}
                      />
                    </button>

                    <button type="button" onClick={handleThemeTestFieldClick} className="block w-full text-left">
                      <AnswerDisplay
                        value="31"
                        disabled={false}
                        shake={false}
                        shakeKey={0}
                        answerFlash={null}
                        answerFlashAuto={false}
                        flashKey={themeTestScore}
                        perfectAnswerToken={0}
                        waterLight={useWaterBackground}
                        fourSecondsLight={fourSecondsActive}
                        timesDivLight={timesDivActive}
                        plusLight={plusActive}
                        minusLight={minusActive}
                      />
                    </button>
                  </div>
                </PlayFieldsFrame>
              </ThemeTestSideLayout>
            ) : (
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
                parallaxActive={parallaxLayerActive}
              >
                <PlayFieldsFrame
                  level={session.rhythmLevel}
                  levelUpFlash={session.rhythmLevelUpFlash}
                  burstScore={session.score}
                  waterLight={useWaterBackground}
                  borderActive={isPlaying}
                  timerDanger={timerDanger}
                >
                  <div
                    className={`game-play-stack w-full rounded-3xl ${currentPlayStackClass}${
                      timerDanger ? ' game-play-stack--timer-danger' : ''
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
                      value={inputValue}
                      disabled={inputDisabled}
                      shake={session.isSubmitLocked}
                      shakeKey={shakeKey}
                      answerFlash={session.answerFlash}
                      answerFlashAuto={session.answerFlashAuto}
                      flashKey={session.score}
                      perfectAnswerToken={perfectAnswerToken}
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
            )}

            {isThemeTestScene && (
              <div className="w-full max-w-xs space-y-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated">
                  <div className="timer-bar-fill relative h-full w-full rounded-full">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200" />
                  </div>
                </div>
                <NumericKeypad
                  disabled={false}
                  interactionLocked={false}
                  backspaceDisabled={false}
                  waterLight={useWaterBackground}
                  autoCheckCharges={themeTestAutoCheckEnabled ? 1 : 0}
                  virtualPress={null}
                  onDigit={() => handleThemeTestKeypadDigit()}
                  onBackspace={handleThemeTestKeypadBackspace}
                  onAutoCorrect={handleThemeTestKeypadAuto}
                  onEnter={handleThemeTestKeypadEnter}
                />
                <p className="text-center text-xs uppercase tracking-[0.18em] text-amber-300/80">
                  Theme test: teclado clica sem alterar input principal
                </p>
              </div>
            )}

            {isPlaying && (
              <>
                <div className="w-full max-w-xs">
                  <PlayingTimerBar timerMaxMs={session.timerMaxMs} />
                </div>
                <NumericKeypad
                  disabled={inputDisabled}
                  interactionLocked={benchmarkMode}
                  backspaceDisabled={inputValue.length === 0}
                  waterLight={useWaterBackground}
                  autoCheckCharges={player.walletAutoChecks}
                  virtualPress={benchmarkMode ? benchmarkVirtualKeypadPress : null}
                  onDigit={appendDigit}
                  onBackspace={backspaceDigit}
                  onAutoCorrect={onAutoCorrect}
                  onEnter={onConfirm}
                />
              </>
            )}

            {benchmarkMode && isPlaying && (
              <p className="text-center text-xs uppercase tracking-[0.18em] text-amber-300/80">
                Benchmark em andamento
              </p>
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
                    {benchmarkMode && benchmarkMetrics ? 'Benchmark' : 'FIM DE JOGO'}
                  </p>
                  <p
                    className={`game-over-card__score font-mono text-2xl font-bold ${
                      useWaterBackground ? '' : 'text-white'
                    }`}
                  >
                    {session.score} pontos
                  </p>
                  <p className={`mt-1 text-xs ${useWaterBackground ? '' : 'text-charcoal-muted'}`}>
                    Tempo: {gameOverElapsedText}
                  </p>

                  {benchmarkMode && benchmarkMetrics ? (
                    <div className="mt-3 space-y-2 text-left text-xs">
                      <div className="game-modal-card px-3 py-2">
                        <p className="font-semibold text-stone-200">Performance</p>
                        <ul className="mt-1 space-y-1 text-charcoal-muted">
                          {(['fps', 'avgFrameMs', 'p95FrameMs', 'maxFrameMs', 'jankRate', 'answerIntervalMs'] as const)
                            .map((gradeId) => gradeForMetric(benchmarkMetrics, gradeId))
                            .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade))
                            .map((grade) => (
                              <li key={grade.id} className="flex items-center justify-between gap-3">
                                <span>{grade.label}</span>
                                <span className="flex items-center gap-2 font-mono tabular-nums text-stone-300">
                                  <span>{grade.value}</span>
                                  <span className={`${benchmarkGradeTone(grade.grade)} font-bold`}>
                                    {grade.grade}
                                  </span>
                                </span>
                              </li>
                            ))}
                        </ul>
                        <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-charcoal-muted">
                          Referência: 60 FPS / 10 ms de ping
                        </p>
                        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-charcoal-muted">
                          {benchmarkMetrics.totalAnswers} respostas • intervalo alvo de 0.5s
                        </p>
                      </div>

                      <div className="game-modal-card px-3 py-2">
                        <p className="font-semibold text-stone-200">Fases</p>
                        <ul className="mt-1 space-y-1 text-charcoal-muted">
                          {benchmarkMetrics.phases.map((phase) => (
                            <li key={phase.id} className="flex items-center justify-between gap-3">
                              <span>{phase.label}</span>
                              <span className="font-mono tabular-nums text-stone-300">
                                {formatBenchmarkMs(phase.durationMs)} · {phase.answers} acertos
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-center text-[0.68rem] uppercase tracking-[0.16em] text-emerald-400">
                        {benchmarkMetrics.completed ? 'Benchmark concluído' : 'Benchmark interrompido'}
                      </p>
                    </div>
                  ) : (
                    <>
                  <p className="mt-1 text-xs">
                    <span className="game-over-reward-xp">+{lastGameRewards.xpGained} XP</span>
                    <span className="game-over-reward-sep"> • </span>
                    <span className="game-over-reward-coins">+{lastGameRewards.coinsGained} moedas</span>
                  </p>
                  {lastGameRewards.goalCompleted && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Meta diária completa!{' '}
                      <span className="game-over-reward-xp">+1000 XP</span> e +1 auto-check
                    </p>
                  )}
                  {session.beatRecord ? (
                    <p className="mt-1 text-sm text-emerald-400">Novo recorde pessoal!</p>
                  ) : topScore ? (
                    <p
                      className={`game-over-card__meta mt-1 text-sm ${
                        useWaterBackground ? '' : 'text-charcoal-muted'
                      }`}
                    >
                      Recorde: {topScore.score} pontos
                    </p>
                  ) : null}
                  {!benchmarkMode && (
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharing}
                    className="game-btn-push game-btn-push-secondary mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal-elevated px-3 py-2 text-xs font-semibold tracking-wide text-stone-100"
                  >
                    {!sharing && <IconShare />}
                    {sharing ? 'Gerando imagem...' : 'Compartilhar'}
                  </button>
                  )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </motion.main>
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
          <p
            className="pointer-events-none fixed inset-x-0 bottom-[max(0.35rem,calc(env(safe-area-inset-bottom)*0.45))] z-[60] text-center text-[0.58rem] font-semibold tracking-wide text-white"
            style={{
              textShadow:
                '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000',
            }}
            aria-hidden
          >
            v0.0.2
          </p>
          <div className="fixed inset-x-0 top-0 z-[60] flex items-start justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))]">
            <motion.div {...menuStageItem(0.06, -14, -8)}>
              <MenuHudInlineButton
                label="Loja"
                onClick={() => {
                  onPlayClick()
                  setShopOpen(true)
                }}
              >
                <IconTrophy />
              </MenuHudInlineButton>
            </motion.div>
            <motion.div {...menuStageItem(0.12, 14, -10)}>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="game-menu-hud-btn game-menu-hud-btn--inline opacity-50"
              >
                <span className="game-menu-hud-btn__plate game-menu-hud-btn__plate--inline">
                  <span className="game-menu-hud-btn__inline-text">Como jogar</span>
                </span>
              </button>
            </motion.div>
          </div>

          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
            <div className="pointer-events-auto flex flex-col items-center gap-3">
              <motion.div {...menuStageItem(0.18, 0, 20)}>
                <MenuPlayButton onClick={handlePlay} />
              </motion.div>
              {devModeEnabled && (
                <>
                  <motion.div {...menuStageItem(0.26, -8, 16)}>
                    <MenuBenchmarkButton onClick={handleBenchmark} />
                  </motion.div>
                  <motion.div {...menuStageItem(0.32, 9, 18)}>
                    <MenuThemeTestButton onClick={handleThemeTest} />
                  </motion.div>
                </>
              )}
            </div>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-[60] flex items-end justify-between px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <motion.div {...menuStageItem(0.22, -16, 12)}>
              <MenuHudButton
                label="Jogador"
                onClick={() => {
                  onPlayClick()
                  setPlayerOpen(true)
                }}
              >
                <IconTrophy />
              </MenuHudButton>
            </motion.div>

            <motion.div {...menuStageItem(0.28, 16, 12)}>
              <MenuHudButton
                label="Config"
                onClick={() => {
                  onPlayClick()
                  setSettingsOpen(true)
                }}
              >
                <IconGear />
              </MenuHudButton>
            </motion.div>
          </footer>
        </>
      )}

      <PlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        player={player}
        topScores={topScores}
        onSaveName={onSaveDisplayName}
        onOpenRewardedModal={() => {
          setPlayerOpen(false)
          setRewardedOpen(true)
        }}
      />
      <ShopModal open={shopOpen} onClose={() => setShopOpen(false)} player={player} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onSoundChange={onSoundChange}
        devModeEnabled={devModeEnabled}
        onDevModeChange={onDevModeChange}
        backgroundTheme={backgroundTheme}
        ownedThemeIds={player.ownedThemeIds}
        onBackgroundThemeChange={onBackgroundThemeChange}
      />
      <Suspense fallback={null}>
        <RewardedAutoCheckModal
          open={rewardedOpen}
          onClose={() => setRewardedOpen(false)}
          watchedToday={rewardedAdsWatched}
          onWatchAd={onWatchRewardedAd}
        />
        <AutoCheckTimeoutModal
          open={session.awaitingAutoCheckChoice && session.phase === 'playing' && !benchmarkMode}
          walletAutoChecks={player.walletAutoChecks}
          onUse={onUseAutoCheckAtTimeout}
          onDecline={onDeclineAutoCheckAtTimeout}
        />
      </Suspense>
      {isGameOver && (
        <ShareCardTemplate
          playerName={player.displayName}
          level={playerLevel}
          score={session.score}
          durationText={gameOverElapsedText}
        />
      )}
    </div>
  )
}
