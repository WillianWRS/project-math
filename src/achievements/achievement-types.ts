import type { GameChangerStatKey } from '../platform/player-lifetime-stats'

export type AchievementCategory =
  | 'level'
  | 'single-score'
  | 'lifetime-score'
  | 'challenges'
  | 'game-changer'
  | 'auto-check'
  | 'curiosity'
  | 'shop'
  | 'profile'
  | 'daily'
  | 'tutorial'

export type AchievementMetric =
  | { kind: 'level'; targetLevel: number }
  | { kind: 'best-score-normal'; target: number }
  | { kind: 'lifetime-score-normal'; target: number }
  | { kind: 'challenges-completed'; target: number }
  | { kind: 'game-changer'; key: GameChangerStatKey; target: number }
  | { kind: 'auto-checks-earned-normal' }
  | { kind: 'zero-score-game-over' }
  | { kind: 'shop-one-per-category' }
  | { kind: 'shop-all-paid-items' }
  | { kind: 'avatar-photo-saved' }
  | { kind: 'daily-goals-completed'; target: number }
  | { kind: 'plus-one-calculation-solved' }
  | { kind: 'tutorial-completed' }

export type AchievementPostGameOrigin = 'normal' | 'challenge' | 'shop'

export interface AchievementDefinition {
  id: string
  category: AchievementCategory
  postGameOrigin: AchievementPostGameOrigin
  title: string
  description: string
  metric: AchievementMetric
}

export interface AchievementGroup {
  category: AchievementCategory
  label: string
}

export interface AchievementProgress {
  id: string
  category: AchievementCategory
  categoryLabel: string
  title: string
  description: string
  unlocked: boolean
  current: number
  target: number
}

export interface AchievementSummary {
  total: number
  unlocked: number
  achievements: AchievementProgress[]
}
