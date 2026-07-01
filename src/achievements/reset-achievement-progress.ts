import { createDefaultLifetimeStats } from '../platform/player-lifetime-stats'
import type { PlayerData } from '../platform/storage'

const DEFAULT_OWNED_THEMES = ['default', 'water'] as const
const DEFAULT_OWNED_BADGES = ['default-ring'] as const

/** Zera apenas o progresso usado pelas conquistas; mantém perfil, moedas e meta diária. */
export function resetAchievementProgress(player: PlayerData): PlayerData {
  return {
    ...player,
    xp: 0,
    ownedThemeIds: [...DEFAULT_OWNED_THEMES],
    equippedThemeId: 'default',
    ownedBadgeIds: [...DEFAULT_OWNED_BADGES],
    equippedBadgeId: 'default-ring',
    lifetimeStats: createDefaultLifetimeStats(),
    tutorial: {
      completed: false,
      rewardsClaimed: false,
    },
  }
}
