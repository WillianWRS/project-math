import { describe, expect, it } from 'vitest'
import { countUnlockedAchievements } from './achievement-evaluation'
import { resetAchievementProgress } from './reset-achievement-progress'
import { createDefaultPlayerData } from '../platform/storage'

describe('resetAchievementProgress', () => {
  it('zera progresso de conquistas mantendo moedas e perfil', () => {
    const player = createDefaultPlayerData()
    player.displayName = 'Tester'
    player.coins = 9_999
    player.diamonds = 50
    player.xp = 50_000
    player.ownedThemeIds = ['default', 'water', 'sunset', 'neon']
    player.ownedBadgeIds = ['default-ring', 'double-ring', 'shield']
    player.lifetimeStats.lifetimeScoreNormal = 500_000
    player.lifetimeStats.bestScoreNormal = 800
    player.lifetimeStats.challengesCompleted = 30
    player.lifetimeStats.hasPurchasedShopAutoCheck = true

    const reset = resetAchievementProgress(player)

    expect(reset.displayName).toBe('Tester')
    expect(reset.coins).toBe(9_999)
    expect(reset.diamonds).toBe(50)
    expect(reset.xp).toBe(0)
    expect(reset.ownedThemeIds).toEqual(['default', 'water'])
    expect(reset.ownedBadgeIds).toEqual(['default-ring'])
    expect(reset.lifetimeStats.lifetimeScoreNormal).toBe(0)
    expect(reset.lifetimeStats.challengesCompleted).toBe(0)
    expect(reset.lifetimeStats.hasPurchasedShopAutoCheck).toBe(false)
    expect(countUnlockedAchievements(reset)).toBe(0)
  })
})
