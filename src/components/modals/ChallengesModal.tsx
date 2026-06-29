import { useEffect, useState } from 'react'
import { xpToLevel } from '../../engine/player-level'
import type { ChallengeModeId } from '../../engine/types'
import type { PlayerData } from '../../platform/storage'
import { formatDailyResetCountdown, getMsUntilDailyReset } from '../../platform/daily-reset'
import { canStartChallenge, formatChallengeAttemptsRemaining, getChallengeAttemptsRemaining, isChallengeCompletedToday } from '../../challenges/challenge-helpers'
import { getActiveChallenges } from '../../challenges/challenge-rotation'
import type { ChallengeDefinition } from '../../challenges/challenge-catalog'
import { Modal } from '../ui/Modal'
import { IconCoin, IconWeeklyChallenges } from '../game/icons'

interface ChallengesModalProps {
  open: boolean
  player: PlayerData
  onClose: () => void
  onStartChallenge: (challengeId: ChallengeModeId) => void
}

function challengeStatusLabel(
  player: PlayerData,
  challengeId: ChallengeModeId,
  playerLevel: number,
  requiredLevel: number,
): string {
  if (playerLevel < requiredLevel) return `Nível ${requiredLevel} necessário`
  if (isChallengeCompletedToday(player, challengeId)) return 'Concluído hoje'
  if (getChallengeAttemptsRemaining(player, challengeId) <= 0) return 'Sem tentativas'
  return 'Disponível'
}

function renderChallengeTitle(challenge: ChallengeDefinition) {
  if (challenge.id === 'times-div-only') {
    return (
      <>
        Só{' '}
        <span className="challenge-modal-card__title-op" aria-hidden>
          ×
        </span>{' '}
        <span className="challenge-modal-card__title-op" aria-hidden>
          ÷
        </span>
      </>
    )
  }

  return challenge.name
}

export function ChallengesModal({
  open,
  player,
  onClose,
  onStartChallenge,
}: ChallengesModalProps) {
  const playerLevel = xpToLevel(player.xp)
  const activeChallenges = getActiveChallenges()
  const [resetCountdownMs, setResetCountdownMs] = useState(() => getMsUntilDailyReset())

  useEffect(() => {
    if (!open) return

    const tick = () => setResetCountdownMs(getMsUntilDailyReset())
    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [open])

  return (    <Modal
      open={open}
      title="Desafios"
      titleIcon={<IconWeeklyChallenges />}
      headerRight={
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-100">
          <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
            <IconCoin />
          </span>
          <span className="font-mono tabular-nums">{player.coins}</span>
        </span>
      }
      onClose={onClose}
    >
      <div className="challenge-modal-intro">
        <p className="challenge-modal-intro__lead">Modos especiais com regras únicas.</p>
        <p className="challenge-modal-intro__sub">
          Cada desafio pode ser concluído uma vez por dia, com até 3 tentativas.
        </p>
      </div>

      <div className="challenge-modal-rotation mt-4">
        <p className="challenge-modal-rotation__label">Novos desafios em</p>
        <p className="challenge-modal-rotation__timer" aria-live="polite">
          {formatDailyResetCountdown(resetCountdownMs)}
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {activeChallenges.map((challenge) => {          const check = canStartChallenge(player, challenge.id)
          const playedToday = isChallengeCompletedToday(player, challenge.id)
          const attemptsRemaining = getChallengeAttemptsRemaining(player, challenge.id)
          const lockedByLevel = playerLevel < challenge.requiredLevel
          const canPlay = check.ok
          const status = challengeStatusLabel(
            player,
            challenge.id,
            playerLevel,
            challenge.requiredLevel,
          )

          const isAvailable = status === 'Disponível'
          const attemptsExhausted = !playedToday && attemptsRemaining <= 0

          return (
            <li
              key={challenge.id}
              className={`rounded-2xl border px-4 py-3 ${
                playedToday
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-stone-700/60 bg-charcoal-elevated/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="challenge-modal-card__title" aria-label={challenge.name}>
                    {renderChallengeTitle(challenge)}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-charcoal-muted">
                    {challenge.description}
                  </p>
                  <div className="challenge-modal-card__reward mt-2.5">
                    <span className="challenge-modal-card__meta-label">Recompensa</span>
                    <p className="challenge-modal-card__reward-value">{challenge.rewardHint}</p>
                  </div>
                  {!playedToday ? (
                    <div className="challenge-modal-card__attempts mt-2">
                      <span className="challenge-modal-card__meta-label">Tentativas</span>
                      <p
                        className={`challenge-modal-card__attempts-value${
                          attemptsRemaining <= 0 ? ' challenge-modal-card__attempts-value--empty' : ''
                        }`}
                      >
                        {attemptsRemaining > 0
                          ? formatChallengeAttemptsRemaining(attemptsRemaining)
                          : 'Sem tentativas restantes'}
                      </p>
                    </div>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-[0.68rem] font-semibold uppercase tracking-wide ${
                    isAvailable
                      ? 'challenge-modal-status--available'
                      : playedToday
                        ? 'text-emerald-400'
                        : attemptsExhausted
                          ? 'text-rose-300'
                          : lockedByLevel
                            ? 'text-rose-300'
                            : 'text-stone-400'
                  }`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="challenge-modal-card__cost">
                  <span className="challenge-modal-card__meta-label">Custo</span>
                  <span className="challenge-modal-card__cost-value">
                    <span className="challenge-modal-card__cost-icon" aria-hidden>
                      <IconCoin />
                    </span>
                    <span className="font-mono tabular-nums">{challenge.entryCostCoins}</span>
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!canPlay}
                  onClick={() => onStartChallenge(challenge.id)}
                  className={`game-btn-push rounded-xl px-4 py-2 text-xs font-bold tracking-wide ${
                    canPlay
                      ? 'game-btn-push-amber bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950'
                      : 'cursor-not-allowed bg-stone-800 text-stone-500 opacity-60'
                  }`}
                >
                  Jogar
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
