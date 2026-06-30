import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { xpProgressInLevel } from '../../engine/player-level'
import { formatDuration } from '../../engine/rewards'
import type { PlayerData, ScoreRecord } from '../../platform/storage'
import { sanitizeDisplayName, DISPLAY_NAME_MAX_LENGTH } from '../../hooks/usePlayer'
import { IconMenuAvatar } from '../game/icons'
import { Modal } from '../ui/Modal'

interface PlayerModalProps {
  open: boolean
  player: PlayerData
  topScores: ScoreRecord[]
  avatarBorderLevel: 1 | 2 | 3 | 4 | 5
  onClose: () => void
  onSaveName: (name: string) => void
  onOpenAvatarPicker: () => void
  onOpenRewardedModal: () => void
  onOpenAchievements: () => void
}
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}

function rankTextClass(index: number): string {
  if (index === 0) return 'player-rank-text--gold'
  if (index === 1) return 'player-rank-text--silver'
  if (index === 2) return 'player-rank-text--bronze'
  return 'text-stone-100'
}

function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCoinSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v8M9.5 10.5h5M9.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconDiamondSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7.5 7.5L12 21 4.5 10.5 12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 10.5h15M8.5 10.5L12 3l3.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconAutoCheckSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function IconEditSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10-10a2 2 0 10-4-4L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M12.5 7.5l4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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

function IconCloseSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function IconPlusOutline() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function StatBadge({
  children,
  variant = 'coin',
}: {
  children: ReactNode
  variant?: 'coin' | 'diamond' | 'autocheck'
}) {
  const variantClass =
    variant === 'diamond'
      ? 'player-stat-badge--diamond'
      : variant === 'autocheck'
        ? 'player-stat-badge--autocheck'
        : 'player-stat-badge--coin'

  return (
    <span className={`player-stat-badge ${variantClass}`} aria-hidden>
      {children}
    </span>
  )
}

function PlayerModalSectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-lg font-extrabold uppercase tracking-[0.22em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
      {children}
    </p>
  )
}

function PlayerProfileLevelRing({
  level,
  current,
  needed,
}: {
  level: number
  current: number
  needed: number
}) {
  const ratio = needed > 0 ? current / needed : 0
  const size = 92
  const stroke = 4.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, ratio)))

  return (
    <div
      className="player-profile-level-ring"
      aria-label={`Nível ${level}, ${current} de ${needed} XP`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="player-profile-level-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="player-profile-level-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          className="player-profile-level-ring__text"
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {level}
        </text>
      </svg>
    </div>
  )
}

export function PlayerModal({
  open,
  player,
  topScores,
  avatarBorderLevel,
  onClose,
  onSaveName,
  onOpenAvatarPicker,
  onOpenRewardedModal,
  onOpenAchievements,
}: PlayerModalProps) {
  const progress = xpProgressInLevel(player.xp)
  const [nameEditing, setNameEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(player.displayName)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) return
    const frame = window.requestAnimationFrame(() => {
      setNameEditing(false)
      setNameDraft(player.displayName)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, player.displayName])

  const startEditName = useCallback(() => {
    setNameDraft(player.displayName)
    setNameEditing(true)
    window.requestAnimationFrame(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    })
  }, [player.displayName])

  const cancelEditName = useCallback(() => {
    setNameEditing(false)
    setNameDraft(player.displayName)
  }, [player.displayName])

  const submitEditName = useCallback(() => {
    const sanitized = sanitizeDisplayName(nameDraft)
    const nextName = sanitized.length > 0 ? sanitized : player.displayName
    if (nextName !== player.displayName) {
      onSaveName(nextName)
    }
    setNameDraft(nextName)
    setNameEditing(false)
  }, [nameDraft, onSaveName, player.displayName])

  return (
    <Modal open={open} title="Jogador" titleIcon={<IconPerson />} onClose={onClose}>
      <div className="space-y-4">
        <PlayerModalSectionTitle>Perfil</PlayerModalSectionTitle>

        <div className="player-profile-top-row">
          <div className="player-profile-top-row__col">
            <p className="player-profile-top-row__label">Avatar</p>
            <div className="player-profile-avatar">
              <div
                className={`player-profile-avatar__frame game-menu-level-badge__avatar game-menu-level-badge__avatar--lvl-${avatarBorderLevel}`}
              >
                {player.avatarDataUrl ? (
                  <img
                    src={player.avatarDataUrl}
                    alt=""
                    className="game-menu-level-badge__avatar-photo"
                    draggable={false}
                  />
                ) : (
                  <span className="game-menu-level-badge__avatar-icon">
                    <IconMenuAvatar />
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenAvatarPicker}
                className="player-profile-avatar__edit player-profile-edit-btn inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-600/70 bg-charcoal-elevated"
                aria-label="Editar avatar"
              >
                <IconEditSmall />
              </button>
            </div>
          </div>

          <div className="player-profile-top-row__col">
            <p className="player-profile-top-row__label">Nível</p>
            <PlayerProfileLevelRing
              level={progress.level}
              current={progress.current}
              needed={progress.needed}
            />
            <p className="player-profile-level-xp">
              {progress.current}/{progress.needed}
            </p>
          </div>
        </div>

        <section className="game-modal-card flex items-center justify-between gap-3 px-3 py-3">
          {nameEditing ? (
            <input
              ref={nameInputRef}
              value={nameDraft}
              onChange={(event) => setNameDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submitEditName()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelEditName()
                }
              }}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              className="min-w-0 flex-1 rounded-lg border border-stone-700/60 bg-charcoal px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-400/55"
              aria-label="Nome do jogador"
            />
          ) : (
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-100">
              {player.displayName}
            </p>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {nameEditing ? (
              <>
                <button
                  type="button"
                  onClick={submitEditName}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/65 bg-emerald-500/10 text-emerald-300"
                  aria-label="Salvar nome"
                >
                  <IconCheckSmall />
                </button>
                <button
                  type="button"
                  onClick={cancelEditName}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-500/60 bg-rose-500/10 text-rose-300"
                  aria-label="Cancelar edição do nome"
                >
                  <IconCloseSmall />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditName}
                className="player-profile-edit-btn inline-flex h-6 w-6 items-center justify-center rounded-full border border-stone-600/70 bg-charcoal-elevated"
                aria-label="Editar nome"
              >
                <IconEditSmall />
              </button>
            )}
          </div>
        </section>

        <PlayerModalSectionTitle>Itens</PlayerModalSectionTitle>

        <div className="space-y-2">
          <div className="game-modal-card flex w-full items-center justify-between gap-3 px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Moedas</p>
            <div className="flex items-center gap-2">
              <StatBadge variant="coin">
                <IconCoinSmall />
              </StatBadge>
              <p className="font-mono text-sm font-bold text-amber-100">{player.coins}</p>
            </div>
          </div>
          <div className="game-modal-card flex w-full items-center justify-between gap-3 px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Diamantes</p>
            <div className="flex items-center gap-2">
              <StatBadge variant="diamond">
                <IconDiamondSmall />
              </StatBadge>
              <p className="font-mono text-sm font-bold text-sky-100">{player.diamonds}</p>
            </div>
          </div>
          <div className="game-modal-card flex w-full items-center justify-between gap-3 px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Auto-check</p>
            <div className="flex items-center gap-2">
              <StatBadge variant="autocheck">
                <IconAutoCheckSmall />
              </StatBadge>
              <p className="font-mono text-sm font-bold text-amber-100">{player.walletAutoChecks}</p>
            </div>
          </div>
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onOpenRewardedModal}
              className="game-btn-push inline-flex items-center gap-2 rounded-lg border border-amber-400/70 bg-transparent px-3 py-1.5 text-xs font-semibold text-amber-300"
            >
              <IconPlusOutline />
              Adicionar Auto Check
            </button>
          </div>
        </div>

        <PlayerModalSectionTitle>Top 5</PlayerModalSectionTitle>

        <section className="space-y-2">
          {topScores.length > 0 ? (
            topScores.map((record, index) => (
              <div
                key={record.id}
                className="game-modal-card flex items-center justify-between px-3 py-2"
              >
                <div>
                  <p className={`font-mono text-sm font-semibold ${rankTextClass(index)}`}>
                    #{index + 1} {record.score} pts
                  </p>
                  <p className="text-xs text-charcoal-muted">{formatDate(record.date)}</p>
                </div>
                <p className="text-xs text-charcoal-muted">
                  {record.durationMs > 0 ? formatDuration(record.durationMs) : '—'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-charcoal-muted">Ainda sem partidas salvas.</p>
          )}
        </section>

        <PlayerModalSectionTitle>Conquistas</PlayerModalSectionTitle>

        <div className="game-modal-card flex w-full items-center justify-between gap-3 px-3 py-2.5">
          <p className="player-conquistas-progress font-mono text-sm font-bold">5/67</p>
          <button
            type="button"
            onClick={onOpenAchievements}
            className="player-conquistas-btn game-btn-push game-btn-push-amber inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
          >
            <IconTarget />
            Ver Conquistas
          </button>
        </div>

      </div>
    </Modal>
  )
}
