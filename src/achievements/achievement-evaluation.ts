import { xpToLevel } from '../engine/player-level'
import type { PlayerData } from '../platform/storage'
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_GROUPS, ACHIEVEMENT_TOTAL_COUNT } from './achievement-catalog'
import type {
  AchievementDefinition,
  AchievementProgress,
  AchievementSummary,
} from './achievement-types'
import {
  countOwnedPaidShopItems,
  countShopCategoriesCompleted,
  PAID_SHOP_ITEM_COUNT,
  SHOP_CATEGORY_COUNT,
} from './shop-stats'

const CATEGORY_LABELS = new Map(ACHIEVEMENT_GROUPS.map((group) => [group.category, group.label]))

export const HIDDEN_ACHIEVEMENT_TITLE = '???'
export const HIDDEN_ACHIEVEMENT_DESCRIPTION = 'Conquista oculta.'

function maskLockedAchievementForDisplay(progress: AchievementProgress): AchievementProgress {
  if (progress.unlocked) return progress

  return {
    ...progress,
    title: HIDDEN_ACHIEVEMENT_TITLE,
    description: HIDDEN_ACHIEVEMENT_DESCRIPTION,
  }
}

function clampProgress(current: number, target: number): { current: number; target: number; unlocked: boolean } {
  const safeTarget = Math.max(1, target)
  const safeCurrent = Math.max(0, Math.floor(current))
  return {
    current: Math.min(safeCurrent, safeTarget),
    target: safeTarget,
    unlocked: safeCurrent >= safeTarget,
  }
}

function evaluateMetric(
  player: PlayerData,
  metric: AchievementDefinition['metric'],
): { current: number; target: number; unlocked: boolean } {
  const stats = player.lifetimeStats

  switch (metric.kind) {
    case 'level': {
      const currentLevel = xpToLevel(player.xp)
      return clampProgress(currentLevel, metric.targetLevel)
    }
    case 'best-score-normal':
      return clampProgress(stats.bestScoreNormal, metric.target)
    case 'lifetime-score-normal':
      return clampProgress(stats.lifetimeScoreNormal, metric.target)
    case 'challenges-completed':
      return clampProgress(stats.challengesCompleted, metric.target)
    case 'game-changer':
      return clampProgress(stats.gameChangerCompletions[metric.key], metric.target)
    case 'auto-checks-earned-normal':
      return clampProgress(stats.autoChecksEarnedNormal, 1)
    case 'zero-score-game-over':
      return {
        current: stats.hasZeroScoreNormalGameOver ? 1 : 0,
        target: 1,
        unlocked: stats.hasZeroScoreNormalGameOver,
      }
    case 'shop-one-per-category':
      return clampProgress(countShopCategoriesCompleted(player), SHOP_CATEGORY_COUNT)
    case 'shop-all-paid-items':
      return clampProgress(countOwnedPaidShopItems(player), PAID_SHOP_ITEM_COUNT)
    case 'avatar-photo-saved':
      return {
        current: stats.hasSavedAvatarPhoto ? 1 : 0,
        target: 1,
        unlocked: stats.hasSavedAvatarPhoto,
      }
    case 'daily-goals-completed':
      return clampProgress(stats.dailyGoalsCompleted, metric.target)
    case 'plus-one-calculation-solved':
      return {
        current: stats.hasSolvedPlusOneCalculation ? 1 : 0,
        target: 1,
        unlocked: stats.hasSolvedPlusOneCalculation,
      }
    case 'tutorial-completed':
      return {
        current: player.tutorial.completed ? 1 : 0,
        target: 1,
        unlocked: player.tutorial.completed,
      }
    default:
      return { current: 0, target: 1, unlocked: false }
  }
}

export function evaluateAchievement(
  player: PlayerData,
  definition: AchievementDefinition,
): AchievementProgress {
  const { current, target, unlocked } = evaluateMetric(player, definition.metric)

  return maskLockedAchievementForDisplay({
    id: definition.id,
    category: definition.category,
    categoryLabel: CATEGORY_LABELS.get(definition.category) ?? definition.category,
    title: definition.title,
    description: definition.description,
    unlocked,
    current,
    target,
  })
}

export function evaluateAllAchievements(player: PlayerData): AchievementProgress[] {
  return ACHIEVEMENT_CATALOG.map((definition) => evaluateAchievement(player, definition))
}

export function summarizeAchievements(player: PlayerData): AchievementSummary {
  const achievements = evaluateAllAchievements(player)
  const unlocked = achievements.filter((entry) => entry.unlocked).length

  return {
    total: ACHIEVEMENT_TOTAL_COUNT,
    unlocked,
    achievements,
  }
}

export function countUnlockedAchievements(player: PlayerData): number {
  return summarizeAchievements(player).unlocked
}

export function formatAchievementProgressValue(value: number): string {
  return Math.floor(value).toLocaleString('pt-BR')
}
