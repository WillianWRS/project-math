import type { ReactNode } from 'react'
import type { BadgeVariant, TagEffectId } from '../../platform/storage'

interface PlayerLevelBadgeProps {
  badgeId: BadgeVariant
  tagEffectId: TagEffectId
  className?: string
  children: ReactNode
}

export function PlayerLevelBadge({
  badgeId,
  tagEffectId,
  className = '',
  children,
}: PlayerLevelBadgeProps) {
  const wrapClass =
    tagEffectId !== 'none'
      ? `game-player-level-badge-wrap game-player-level-badge-wrap--${tagEffectId}`
      : 'game-player-level-badge-wrap'

  return (
    <span className={wrapClass}>
      <span className={`game-player-level-badge game-player-level-badge--${badgeId}${className ? ` ${className}` : ''}`}>
        {children}
      </span>
    </span>
  )
}
