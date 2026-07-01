import { describe, expect, it } from 'vitest'
import { xpToLevel } from '../engine/player-level'
import { createDefaultPlayerData } from '../platform/storage'
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_TOTAL_COUNT } from './achievement-catalog'
import {
  countUnlockedAchievements,
  evaluateAchievement,
  HIDDEN_ACHIEVEMENT_DESCRIPTION,
  HIDDEN_ACHIEVEMENT_TITLE,
  summarizeAchievements,
} from './achievement-evaluation'
import { PAID_SHOP_ITEM_COUNT } from './shop-stats'

const level10Definition = ACHIEVEMENT_CATALOG.find((entry) => entry.id === 'level-10')
if (!level10Definition) {
  throw new Error('Conquista level-10 não encontrada no catálogo')
}

describe('achievement-evaluation', () => {
  it('expõe 26 conquistas no catálogo', () => {
    expect(ACHIEVEMENT_TOTAL_COUNT).toBe(26)
  })

  it('desbloqueia conquista de nível a partir do XP', () => {
    const player = {
      ...createDefaultPlayerData(),
      xp: 4_500,
    }

    const progress = evaluateAchievement(player, level10Definition)

    expect(xpToLevel(player.xp)).toBe(10)
    expect(progress.unlocked).toBe(true)
    expect(progress.current).toBe(10)
    expect(progress.target).toBe(10)
  })

  it('usa bestScoreNormal para score em partida', () => {
    const player = createDefaultPlayerData()
    player.lifetimeStats.bestScoreNormal = 350

    const summary = summarizeAchievements(player)
    const single200 = summary.achievements.find((entry) => entry.id === 'single-score-200')
    const single500 = summary.achievements.find((entry) => entry.id === 'single-score-500')

    expect(single200?.unlocked).toBe(true)
    expect(single200?.current).toBe(200)
    expect(single500?.unlocked).toBe(false)
    expect(single500?.current).toBe(350)
  })

  it('conta categorias da loja e itens pagos', () => {
    const player = createDefaultPlayerData()
    player.ownedThemeIds = ['default', 'water', 'sunset']
    player.ownedBadgeIds = ['default-ring', 'double-ring']
    player.ownedTagEffectIds = ['none', 'color-flow']
    player.ownedKeypadStyleIds = ['default', 'chamfer']

    const summary = summarizeAchievements(player)
    const onePerCategory = summary.achievements.find((entry) => entry.id === 'shop-one-per-category')
    const allPaid = summary.achievements.find((entry) => entry.id === 'shop-all-paid-items')

    expect(onePerCategory?.unlocked).toBe(true)
    expect(onePerCategory?.current).toBe(4)
    expect(allPaid?.current).toBe(4)
    expect(allPaid?.target).toBe(PAID_SHOP_ITEM_COUNT)
    expect(allPaid?.unlocked).toBe(false)
  })

  it('desbloqueia curiosidade e auto-check via lifetimeStats', () => {
    const player = createDefaultPlayerData()
    player.lifetimeStats.hasZeroScoreNormalGameOver = true
    player.lifetimeStats.autoChecksEarnedNormal = 1

    expect(countUnlockedAchievements(player)).toBeGreaterThanOrEqual(2)
  })

  it('desbloqueia novas conquistas de perfil, meta diária, +1 e tutorial', () => {
    const player = createDefaultPlayerData()
    player.lifetimeStats.hasSavedAvatarPhoto = true
    player.lifetimeStats.dailyGoalsCompleted = 10
    player.lifetimeStats.hasSolvedPlusOneCalculation = true
    player.tutorial.completed = true

    const summary = summarizeAchievements(player)
    const ids = summary.achievements.filter((entry) => entry.unlocked).map((entry) => entry.id)

    expect(ids).toContain('avatar-photo-saved')
    expect(ids).toContain('daily-goal-once')
    expect(ids).toContain('daily-goal-10')
    expect(ids).toContain('plus-one-genius')
    expect(ids).toContain('tutorial-completed')
  })

  it('oculta nome e descrição de conquistas não obtidas', () => {
    const player = createDefaultPlayerData()
    const summary = summarizeAchievements(player)
    const locked = summary.achievements.find((entry) => !entry.unlocked)

    expect(locked).toBeDefined()
    expect(locked?.title).toBe(HIDDEN_ACHIEVEMENT_TITLE)
    expect(locked?.description).toBe(HIDDEN_ACHIEVEMENT_DESCRIPTION)

    const unlocked = evaluateAchievement({ ...player, xp: 4_500 }, level10Definition)
    expect(unlocked.title).toBe('Nv. 10')
    expect(unlocked.description).toContain('nível 10')
  })
})
