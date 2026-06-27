import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { xpProgressInLevel } from '../../engine/player-level'
import { formatDuration } from '../../engine/rewards'
import type { PlayerData, ScoreRecord } from '../../platform/storage'
import { sanitizeDisplayName, DISPLAY_NAME_MAX_LENGTH } from '../../hooks/usePlayer'
import { Modal } from '../ui/Modal'

interface PlayerModalProps {
  open: boolean
  player: PlayerData
  topScores: ScoreRecord[]
  onClose: () => void
  onSaveName: (name: string) => void
  onOpenRewardedModal: () => void
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

function IconCoin() {
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

function IconAutoCheck() {
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

function StatBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="player-stat-badge flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950"
      aria-hidden
    >
      {children}
    </span>
  )
}

export function PlayerModal({
  open,
  player,
  topScores,
  onClose,
  onSaveName,
  onOpenRewardedModal,
}: PlayerModalProps) {
  const progress = xpProgressInLevel(player.xp)
  const dailyGoalRatio = Math.min(1, player.daily.scoreAccumulated / 500)
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
        <section className="game-modal-card p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-charcoal-muted">
              <span className="text-stone-300">
                <IconPerson />
              </span>
              Nome
            </p>
            <div className="flex items-center gap-2">
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
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-stone-600/70 bg-charcoal-elevated text-stone-200"
                  aria-label="Editar nome"
                >
                  <IconEditSmall />
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-2">
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
                className="w-full rounded-lg border border-stone-700/60 bg-charcoal px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-400/55"
                aria-label="Nome do jogador"
              />
            ) : (
              <p className="w-full px-1 py-1 text-sm font-semibold text-stone-100">
                {player.displayName}
              </p>
            )}
          </div>
        </section>

        <section className="game-modal-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-100">Nível {progress.level}</p>
            <p className="text-xs text-charcoal-muted">
              {progress.current}/{progress.needed} XP
            </p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-charcoal">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300"
              style={{ width: `${(progress.current / progress.needed) * 100}%` }}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="game-modal-card p-3">
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Moedas</p>
            <div className="mt-1 flex items-center gap-2">
              <StatBadge>
                <IconCoin />
              </StatBadge>
              <p className="font-mono text-xl font-bold text-amber-100">{player.coins}</p>
            </div>
          </div>
          <div className="game-modal-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-widest text-charcoal-muted">Auto-check</p>
              <button
                type="button"
                onClick={onOpenRewardedModal}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-stone-600/70 bg-charcoal-elevated text-stone-200"
                aria-label="Ganhar auto-check"
              >
                <IconPlusOutline />
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StatBadge>
                <IconAutoCheck />
              </StatBadge>
              <p className="font-mono text-xl font-bold text-amber-100">{player.walletAutoChecks}</p>
            </div>
          </div>
        </section>

        <section className="game-modal-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-100">Meta diária</p>
            <p className="text-xs text-charcoal-muted">{player.daily.scoreAccumulated}/500</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-charcoal">
            <div
              className={`h-full rounded-full ${player.daily.goalClaimed ? 'bg-emerald-400' : 'bg-sky-400'}`}
              style={{ width: `${dailyGoalRatio * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-charcoal-muted">
            {player.daily.goalClaimed ? 'Recompensa coletada hoje.' : 'Recompensa: +200 XP e +10 moedas'}
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-charcoal-muted">Top 5</p>
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

      </div>
    </Modal>
  )
}
