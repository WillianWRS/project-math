import { useMemo } from 'react'
import type { PlayerData } from '../../platform/storage'
import {
  formatAchievementProgressValue,
  summarizeAchievements,
} from '../../achievements/achievement-evaluation'
import type { AchievementProgress } from '../../achievements/achievement-types'
import { Modal } from '../ui/Modal'

interface AchievementsModalProps {
  open: boolean
  player: PlayerData
  onClose: () => void
}

function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function IconCheckSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function AchievementProgressBar({
  current,
  target,
  unlocked,
}: {
  current: number
  target: number
  unlocked: boolean
}) {
  const ratio = target > 0 ? Math.min(1, current / target) : 0

  return (
    <div className="achievement-item__progress" aria-hidden={unlocked}>
      <div className="achievement-item__progress-track">
        <div
          className={`achievement-item__progress-fill${unlocked ? ' achievement-item__progress-fill--complete' : ''}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="achievement-item__progress-label">
        {formatAchievementProgressValue(current)}/{formatAchievementProgressValue(target)}
      </p>
    </div>
  )
}

function AchievementRow({ achievement }: { achievement: AchievementProgress }) {
  return (
    <article
      className={`achievement-item game-modal-card px-3 py-2.5${
        achievement.unlocked ? ' achievement-item--unlocked' : ' achievement-item--hidden'
      }`}
      aria-label={
        achievement.unlocked
          ? `${achievement.title}, concluída`
          : 'Conquista oculta, não obtida'
      }
    >
      <div className="achievement-item__header">
        <div className="min-w-0 flex-1">
          <p className="achievement-item__title">{achievement.title}</p>
          <p className="achievement-item__description">{achievement.description}</p>
        </div>
        {achievement.unlocked ? (
          <span className="achievement-item__badge" aria-label="Concluída">
            <IconCheckSmall />
          </span>
        ) : null}
      </div>
      {achievement.unlocked ? (
        <AchievementProgressBar
          current={achievement.current}
          target={achievement.target}
          unlocked={achievement.unlocked}
        />
      ) : null}
    </article>
  )
}

export function AchievementsModal({ open, player, onClose }: AchievementsModalProps) {
  const summary = useMemo(() => summarizeAchievements(player), [player])

  return (
    <Modal open={open} title="Conquistas" titleIcon={<IconTarget />} onClose={onClose} stackLevel={1}>
      <div className="space-y-4">
        <p className="text-center font-mono text-sm font-bold text-amber-200">
          {summary.unlocked}/{summary.total} concluídas
        </p>

        <div className="space-y-2">
          {summary.achievements.map((achievement) => (
            <AchievementRow key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </Modal>
  )
}
