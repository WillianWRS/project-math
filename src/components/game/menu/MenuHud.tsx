import type { ReactNode } from 'react'
import { xpProgressInLevel } from '../../../engine/player-level'
import {
  IconBack,
  IconBenchmark,
  IconMenuAvatar,
  IconPlay,
  IconThemeTest,
} from '../icons'

export function MenuHudButton({
  label,
  onClick,
  onPointerDown,
  disabled = false,
  labelClassName,
  children,
}: {
  label: string
  onClick?: () => void
  onPointerDown?: () => void
  disabled?: boolean
  labelClassName?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      aria-disabled={disabled}
      className={`game-menu-hud-btn${disabled ? ' opacity-50' : ''}`}
      aria-label={label}
    >
      <span className="game-menu-hud-btn__plate">
        <span className="game-menu-hud-btn__icon">{children}</span>
      </span>
      <span className={`game-menu-hud-btn__label${labelClassName ? ` ${labelClassName}` : ''}`}>{label}</span>
    </button>
  )
}

export function MenuHudInlineButton({
  label,
  onClick,
  variant = 'default',
  fill = false,
  children,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'accent'
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
      className={`game-menu-hud-btn game-menu-hud-btn--inline${fill ? ' game-menu-hud-btn--fill' : ''}`}
      aria-label={label}
    >
      <span className={plateClass}>
        <span className="game-menu-hud-btn__icon">{children}</span>
        <span className="game-menu-hud-btn__inline-text">{label}</span>
      </span>
    </button>
  )
}

export function AnimatedGameMenuButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        onClick={onClick}
        className="game-menu-hud-btn game-menu-hud-btn--inline"
        aria-label="Voltar ao menu"
      >
        <span className="game-menu-hud-btn__plate game-menu-hud-btn__plate--inline game-menu-hud-btn__plate--icon-only game-menu-hud-btn__plate--back-menu">
          <span className="game-menu-hud-btn__icon">
            <IconBack />
          </span>
        </span>
      </button>
    </div>
  )
}

export function MenuLevelBadge({
  xp,
  avatarDataUrl,
  onAvatarClick,
  borderLevel,
}: {
  xp: number
  avatarDataUrl: string | null
  onAvatarClick: () => void
  borderLevel: 1 | 2 | 3 | 4 | 5
}) {
  const progress = xpProgressInLevel(xp)
  const ratio = progress.needed > 0 ? progress.current / progress.needed : 0
  const size = 36
  const stroke = 2.8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, ratio)))

  return (
    <button
      type="button"
      className="game-menu-level-badge"
      aria-label={`Nível ${progress.level}, ${progress.current} de ${progress.needed} XP`}
      onClick={onAvatarClick}
    >
      <div className={`game-menu-level-badge__avatar game-menu-level-badge__avatar--lvl-${borderLevel}`} aria-hidden>
        {avatarDataUrl ? (
          <img src={avatarDataUrl} alt="" className="game-menu-level-badge__avatar-photo" draggable={false} />
        ) : (
          <span className="game-menu-level-badge__avatar-icon">
            <IconMenuAvatar />
          </span>
        )}
      </div>
      <div className="game-menu-level-badge__level-chip" aria-hidden>
        <svg
          className="game-menu-level-badge__ring"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="game-menu-level-badge__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
          />
          <circle
            className="game-menu-level-badge__progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <text
            className="game-menu-level-badge__ring-text"
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {progress.level}
          </text>
        </svg>
      </div>
    </button>
  )
}

export function MenuPlayButton({
  onClick,
  onPointerDown,
}: {
  onClick: () => void
  onPointerDown?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label="Iniciar partida"
      className="game-btn-push game-btn-push-amber flex items-center gap-2.5 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3.5 text-lg font-bold tracking-wide text-amber-950"
    >
      <IconPlay />
      <span>Jogar</span>
    </button>
  )
}

export function MenuBenchmarkButton({
  onClick,
  onPointerDown,
}: {
  onClick: () => void
  onPointerDown?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label="Iniciar benchmark"
      className="game-btn-push game-btn-push-secondary flex items-center gap-2 rounded-xl bg-charcoal-elevated px-5 py-2.5 text-sm font-semibold tracking-wide text-stone-200 ring-1 ring-stone-700/50"
    >
      <IconBenchmark />
      <span>Benchmark</span>
    </button>
  )
}

export function MenuThemeTestButton({
  onClick,
  onPointerDown,
}: {
  onClick: () => void
  onPointerDown?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label="Abrir teste de tema"
      className="game-btn-push game-btn-push-secondary flex items-center gap-2 rounded-xl bg-charcoal-elevated px-5 py-2.5 text-sm font-semibold tracking-wide text-stone-200 ring-1 ring-stone-700/50"
    >
      <IconThemeTest />
      <span>Theme Test</span>
    </button>
  )
}
