import { describe, expect, it } from 'vitest'
import { createDefaultPlayerData } from '../platform/storage'
import {
  countNewPostGameAchievements,
  filterAchievementsForPostGameContext,
  formatPostGameAchievementsText,
  getNewAchievementIdsForOrigin,
  getNewPostGameAchievementIds,
  getNewlyUnlockedAchievementIds,
  resolvePostGameAchievements,
} from './achievement-post-game'

describe('achievement-post-game', () => {
  it('formata texto no singular e plural', () => {
    expect(formatPostGameAchievementsText(1)).toBe('1 conquista realizada')
    expect(formatPostGameAchievementsText(3)).toBe('3 conquistas realizadas')
  })

  it('filtra conquistas de loja fora do pós-jogo', () => {
    const ids = filterAchievementsForPostGameContext(
      ['shop-one-per-category', 'level-10', 'challenges-30'],
      'normal',
    )

    expect(ids).toEqual(['level-10'])
  })

  it('detecta novas conquistas de loja', () => {
    const before = createDefaultPlayerData()
    before.ownedThemeIds = ['default', 'water']
    before.ownedBadgeIds = ['default-ring']

    const after: typeof before = {
      ...before,
      ownedThemeIds: ['default', 'water', 'sunset'],
      ownedBadgeIds: ['default-ring', 'double-ring'],
      ownedTagEffectIds: ['none', 'color-flow'],
      ownedKeypadStyleIds: ['default', 'chamfer'],
    }

    expect(getNewAchievementIdsForOrigin(before, after, 'shop')).toContain('shop-one-per-category')
  })

  it('resolve nomes e descrições das conquistas', () => {
    const details = resolvePostGameAchievements(['level-10', 'unknown-id'])

    expect(details).toHaveLength(1)
    expect(details[0]?.title).toBe('Nv. 10')
    expect(details[0]?.description).toContain('nível 10')
  })

  it('retorna ids filtrados por contexto', () => {
    const before = createDefaultPlayerData()
    const after = {
      ...before,
      xp: 4_500,
      lifetimeStats: {
        ...before.lifetimeStats,
        bestScoreNormal: 250,
      },
    }

    const ids = getNewPostGameAchievementIds(before, after, 'normal')
    const count = countNewPostGameAchievements(before, after, 'normal')

    expect(count).toBe(ids.length)
    expect(getNewlyUnlockedAchievementIds(before, after)).toContain('level-10')
    expect(getNewlyUnlockedAchievementIds(before, after)).toContain('single-score-200')
  })

  it('não inclui conquistas normais no pós-jogo de desafio', () => {
    const before = createDefaultPlayerData()
    const after = {
      ...before,
      xp: 4_500,
      lifetimeStats: {
        ...before.lifetimeStats,
        challengesCompleted: 30,
      },
    }

    expect(countNewPostGameAchievements(before, after, 'challenge')).toBe(1)
    expect(countNewPostGameAchievements(before, after, 'normal')).toBeGreaterThanOrEqual(1)
  })
})
