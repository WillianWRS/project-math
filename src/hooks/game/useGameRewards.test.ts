import { describe, expect, it } from 'vitest'
import { getNewPostGameAchievementIds } from '../../achievements/achievement-post-game'
import { xpToLevel } from '../../engine/player-level'
import {
  applyChallengeCompletedStats,
  applyNormalGameOverStats,
  createEmptyPendingNormalSessionStats,
} from '../../platform/player-lifetime-stats'
import { createDefaultPlayerData } from '../../platform/storage'

describe('useGameRewards achievement detection', () => {
  it('detecta conquista de nível após commit simulado de pós-jogo normal', () => {
    const before = createDefaultPlayerData()
    before.xp = 4_400

    let next = {
      ...before,
      xp: before.xp + 250,
      coins: before.coins + 25,
    }
    next = applyNormalGameOverStats(next, 250, createEmptyPendingNormalSessionStats())

    expect(xpToLevel(before.xp)).toBeLessThan(10)
    expect(xpToLevel(next.xp)).toBeGreaterThanOrEqual(10)
    expect(getNewPostGameAchievementIds(before, next, 'normal')).toContain('level-10')
  })

  it('detecta conquista de score em partida após stats de pós-jogo', () => {
    const before = createDefaultPlayerData()
    const next = applyNormalGameOverStats(before, 250, createEmptyPendingNormalSessionStats())

    expect(getNewPostGameAchievementIds(before, next, 'normal')).toContain('single-score-200')
  })

  it('detecta conquista de desafio após incremento de challengesCompleted', () => {
    const before = createDefaultPlayerData()
    before.lifetimeStats.challengesCompleted = 29

    const after = applyChallengeCompletedStats(before)

    expect(getNewPostGameAchievementIds(before, after, 'challenge')).toContain('challenges-30')
    expect(getNewPostGameAchievementIds(before, after, 'normal')).not.toContain('challenges-30')
  })
})
