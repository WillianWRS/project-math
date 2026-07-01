import { useMemo } from 'react'
import { resolvePostGameAchievements } from '../../achievements/achievement-post-game'
import { IconTrophy } from '../game/icons'
import { Modal } from '../ui/Modal'

interface PostGameAchievementsModalProps {
  open: boolean
  achievementIds: string[]
  onClose: () => void
}

export function PostGameAchievementsModal({
  open,
  achievementIds,
  onClose,
}: PostGameAchievementsModalProps) {
  const achievements = useMemo(
    () => resolvePostGameAchievements(achievementIds),
    [achievementIds],
  )

  return (
    <Modal
      open={open}
      title="Conquistas desta partida"
      titleIcon={<IconTrophy size={16} />}
      onClose={onClose}
      stackLevel={2}
    >
      <div className="space-y-2">
        {achievements.map((achievement) => (
          <article
            key={achievement.id}
            className="achievement-item achievement-item--unlocked game-modal-card px-3 py-2.5"
          >
            <p className="achievement-item__title">{achievement.title}</p>
            <p className="achievement-item__description">{achievement.description}</p>
          </article>
        ))}
      </div>
    </Modal>
  )
}
