import type { PlayerData } from '../platform/storage'
import { ACHIEVEMENT_CATALOG } from './achievement-catalog'
import { evaluateAllAchievements } from './achievement-evaluation'
import type { AchievementPostGameOrigin } from './achievement-types'

export type PostGameAchievementContext = 'normal' | 'challenge'

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENT_CATALOG.map((entry) => [entry.id, entry]))

export function getUnlockedAchievementIds(player: PlayerData): string[] {
  return evaluateAllAchievements(player)
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.id)
}

export function getNewlyUnlockedAchievementIds(before: PlayerData, after: PlayerData): string[] {
  const beforeIds = new Set(getUnlockedAchievementIds(before))
  return getUnlockedAchievementIds(after).filter((id) => !beforeIds.has(id))
}

export function filterAchievementsForPostGameContext(
  achievementIds: string[],
  context: PostGameAchievementContext,
): string[] {
  return filterAchievementsByOrigin(achievementIds, context)
}

export function filterAchievementsByOrigin(
  achievementIds: string[],
  origin: AchievementPostGameOrigin,
): string[] {
  return achievementIds.filter((id) => ACHIEVEMENT_BY_ID.get(id)?.postGameOrigin === origin)
}

export function getNewAchievementIdsForOrigin(
  before: PlayerData,
  after: PlayerData,
  origin: AchievementPostGameOrigin,
): string[] {
  return filterAchievementsByOrigin(getNewlyUnlockedAchievementIds(before, after), origin)
}

export function getNewPostGameAchievementIds(
  before: PlayerData,
  after: PlayerData,
  context: PostGameAchievementContext,
): string[] {
  return getNewAchievementIdsForOrigin(before, after, context)
}

export function countNewPostGameAchievements(
  before: PlayerData,
  after: PlayerData,
  context: PostGameAchievementContext,
): number {
  return getNewPostGameAchievementIds(before, after, context).length
}

export interface PostGameAchievementDetail {
  id: string
  title: string
  description: string
}

export function resolvePostGameAchievements(ids: string[]): PostGameAchievementDetail[] {
  return ids.flatMap((id) => {
    const definition = ACHIEVEMENT_BY_ID.get(id)
    if (!definition) return []
    return [{ id: definition.id, title: definition.title, description: definition.description }]
  })
}

export function formatPostGameAchievementsText(count: number): string {
  if (count === 1) return '1 conquista realizada'
  return `${count} conquistas realizadas`
}

export function isPostGameAchievementOrigin(value: string): value is AchievementPostGameOrigin {
  return value === 'normal' || value === 'challenge' || value === 'shop'
}
