import type { ReactNode } from 'react'
import { xpProgressInLevel } from '../../engine/player-level'
import { formatDuration } from '../../engine/rewards'
import type { PlayerData, ScoreRecord } from '../../platform/storage'
import { sanitizeDisplayName } from '../../hooks/usePlayer'
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
  const dailyGoalRatio = Math.min(1, player.daily.scoreAccumulated / 1000)

  return (
    <Modal open={open} title="Jogador" onClose={onClose}>
      <div className="space-y-4">
        <section className="game-modal-card p-3">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-charcoal-muted">
            <span className="text-stone-300">
              <IconPerson />
            </span>
            Nome
          </p>
          <input
            key={player.displayName}
            defaultValue={player.displayName}
            onBlur={(event) => onSaveName(sanitizeDisplayName(event.currentTarget.value))}
            maxLength={16}
            className="mt-2 w-full rounded-lg border border-stone-700/60 bg-charcoal px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-400/55"
          />
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
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Auto-check</p>
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
            <p className="text-xs text-charcoal-muted">{player.daily.scoreAccumulated}/1000</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-charcoal">
            <div
              className={`h-full rounded-full ${player.daily.goalClaimed ? 'bg-emerald-400' : 'bg-sky-400'}`}
              style={{ width: `${dailyGoalRatio * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-charcoal-muted">
            {player.daily.goalClaimed ? 'Recompensa coletada hoje.' : 'Recompensa: +1000 XP e +1 auto-check'}
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-charcoal-muted">Top 5</p>
          {topScores.length > 0 ? (
            topScores.map((record, index) => (
              <div key={record.id} className="game-modal-card flex items-center justify-between px-3 py-2">
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

        <button
          type="button"
          onClick={onOpenRewardedModal}
          className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
        >
          Ganhar auto-check
        </button>
      </div>
    </Modal>
  )
}
