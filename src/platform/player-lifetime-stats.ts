import type { GameSession, Operation } from '../engine/types'
import type { PlayerData } from './storage'
export type GameChangerStatKey = 'plus99' | 'minus1' | 'fourSeconds' | 'timesDiv'

export interface GameChangerCompletionCounts {
  plus99: number
  minus1: number
  fourSeconds: number
  timesDiv: number
}

export interface PlayerLifetimeStats {
  lifetimeScoreNormal: number
  bestScoreNormal: number
  normalGamesCompleted: number
  autoChecksEarnedNormal: number
  challengesCompleted: number
  hasZeroScoreNormalGameOver: boolean
  hasPurchasedShopAutoCheck: boolean
  hasSavedAvatarPhoto: boolean
  dailyGoalsCompleted: number
  hasSolvedPlusOneCalculation: boolean
  gameChangerCompletions: GameChangerCompletionCounts
}

export interface PendingNormalSessionStats {
  autoChecksEarned: number
  solvedPlusOneCalculation: boolean
  gameChangerCompletions: GameChangerCompletionCounts
}

export function createEmptyGameChangerCompletionCounts(): GameChangerCompletionCounts {
  return {
    plus99: 0,
    minus1: 0,
    fourSeconds: 0,
    timesDiv: 0,
  }
}

export function createDefaultLifetimeStats(): PlayerLifetimeStats {
  return {
    lifetimeScoreNormal: 0,
    bestScoreNormal: 0,
    normalGamesCompleted: 0,
    autoChecksEarnedNormal: 0,
    challengesCompleted: 0,
    hasZeroScoreNormalGameOver: false,
    hasPurchasedShopAutoCheck: false,
    hasSavedAvatarPhoto: false,
    dailyGoalsCompleted: 0,
    hasSolvedPlusOneCalculation: false,
    gameChangerCompletions: createEmptyGameChangerCompletionCounts(),
  }
}

export function createEmptyPendingNormalSessionStats(): PendingNormalSessionStats {
  return {
    autoChecksEarned: 0,
    solvedPlusOneCalculation: false,
    gameChangerCompletions: createEmptyGameChangerCompletionCounts(),
  }
}

function clampCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function parseGameChangerCompletionCounts(value: unknown): GameChangerCompletionCounts {
  if (!value || typeof value !== 'object') {
    return createEmptyGameChangerCompletionCounts()
  }

  const raw = value as Partial<GameChangerCompletionCounts>
  return {
    plus99: clampCount(raw.plus99),
    minus1: clampCount(raw.minus1),
    fourSeconds: clampCount(raw.fourSeconds),
    timesDiv: clampCount(raw.timesDiv),
  }
}

export function parsePlayerLifetimeStats(value: unknown): PlayerLifetimeStats {
  if (!value || typeof value !== 'object') {
    return createDefaultLifetimeStats()
  }

  const raw = value as Partial<PlayerLifetimeStats>
  return {
    lifetimeScoreNormal: clampCount(raw.lifetimeScoreNormal),
    bestScoreNormal: clampCount(raw.bestScoreNormal),
    normalGamesCompleted: clampCount(raw.normalGamesCompleted),
    autoChecksEarnedNormal: clampCount(raw.autoChecksEarnedNormal),
    challengesCompleted: clampCount(raw.challengesCompleted),
    hasZeroScoreNormalGameOver: Boolean(raw.hasZeroScoreNormalGameOver),
    hasPurchasedShopAutoCheck: Boolean(raw.hasPurchasedShopAutoCheck),
    hasSavedAvatarPhoto: Boolean(raw.hasSavedAvatarPhoto),
    dailyGoalsCompleted: clampCount(raw.dailyGoalsCompleted),
    hasSolvedPlusOneCalculation: Boolean(raw.hasSolvedPlusOneCalculation),
    gameChangerCompletions: parseGameChangerCompletionCounts(raw.gameChangerCompletions),
  }
}

function addGameChangerCounts(
  target: GameChangerCompletionCounts,
  delta: GameChangerCompletionCounts,
): GameChangerCompletionCounts {
  return {
    plus99: target.plus99 + delta.plus99,
    minus1: target.minus1 + delta.minus1,
    fourSeconds: target.fourSeconds + delta.fourSeconds,
    timesDiv: target.timesDiv + delta.timesDiv,
  }
}

export function isPlusOneAddition(operation: Operation | null): boolean {
  return operation?.operator === '+' && operation.operand === 1
}

export function applyAvatarPhotoSaved(player: PlayerData): PlayerData {
  if (player.lifetimeStats.hasSavedAvatarPhoto) return player
  return {
    ...player,
    lifetimeStats: {
      ...player.lifetimeStats,
      hasSavedAvatarPhoto: true,
    },
  }
}

export function applyPlusOneCalculationStats(player: PlayerData): PlayerData {
  if (player.lifetimeStats.hasSolvedPlusOneCalculation) return player
  return {
    ...player,
    lifetimeStats: {
      ...player.lifetimeStats,
      hasSolvedPlusOneCalculation: true,
    },
  }
}

export function applyDailyGoalCompletedStats(player: PlayerData): PlayerData {
  return {
    ...player,
    lifetimeStats: {
      ...player.lifetimeStats,
      dailyGoalsCompleted: player.lifetimeStats.dailyGoalsCompleted + 1,
    },
  }
}

export function detectGameChangerCompletions(
  before: GameSession,
  after: GameSession,
): GameChangerStatKey[] {
  const kinds: GameChangerStatKey[] = []

  if (before.plusGameChangerActive && !after.plusGameChangerActive && after.baseNumber === 99) {
    kinds.push('plus99')
  }

  if (before.minusGameChangerActive && !after.minusGameChangerActive && after.baseNumber === 1) {
    kinds.push('minus1')
  }

  if (
    before.fourSecondsGameChangerRemaining > 0 &&
    after.fourSecondsGameChangerRemaining === 0
  ) {
    kinds.push('fourSeconds')
  }

  if (before.timesDivGameChangerRemaining > 0 && after.timesDivGameChangerRemaining === 0) {
    kinds.push('timesDiv')
  }

  return kinds
}

export function recordGameChangerCompletions(
  pending: PendingNormalSessionStats,
  kinds: GameChangerStatKey[],
): PendingNormalSessionStats {
  if (kinds.length === 0) return pending

  const delta = createEmptyGameChangerCompletionCounts()
  for (const kind of kinds) {
    delta[kind] += 1
  }

  return {
    ...pending,
    gameChangerCompletions: addGameChangerCounts(pending.gameChangerCompletions, delta),
  }
}

export function recordAutoCheckEarnedInNormalSession(
  pending: PendingNormalSessionStats,
): PendingNormalSessionStats {
  return {
    ...pending,
    autoChecksEarned: pending.autoChecksEarned + 1,
  }
}

export function recordPlusOneCalculationInSession(
  pending: PendingNormalSessionStats,
): PendingNormalSessionStats {
  if (pending.solvedPlusOneCalculation) return pending
  return { ...pending, solvedPlusOneCalculation: true }
}

export function applyNormalGameOverStats(
  player: PlayerData,
  sessionScore: number,
  pending: PendingNormalSessionStats,
): PlayerData {
  const stats = player.lifetimeStats
  const safeScore = Math.max(0, Math.floor(sessionScore))

  return {
    ...player,
    lifetimeStats: {
      ...stats,
      lifetimeScoreNormal: stats.lifetimeScoreNormal + safeScore,
      bestScoreNormal: Math.max(stats.bestScoreNormal, safeScore),
      normalGamesCompleted: stats.normalGamesCompleted + 1,
      autoChecksEarnedNormal: stats.autoChecksEarnedNormal + pending.autoChecksEarned,
      hasZeroScoreNormalGameOver: stats.hasZeroScoreNormalGameOver || safeScore === 0,
      hasSolvedPlusOneCalculation:
        stats.hasSolvedPlusOneCalculation || pending.solvedPlusOneCalculation,
      gameChangerCompletions: addGameChangerCounts(
        stats.gameChangerCompletions,
        pending.gameChangerCompletions,
      ),
    },
  }
}

export function applyShopAutoCheckPurchaseStats(player: PlayerData): PlayerData {
  if (player.lifetimeStats.hasPurchasedShopAutoCheck) return player

  return {
    ...player,
    lifetimeStats: {
      ...player.lifetimeStats,
      hasPurchasedShopAutoCheck: true,
    },
  }
}

export function applyChallengeCompletedStats(player: PlayerData): PlayerData {
  return {
    ...player,
    lifetimeStats: {
      ...player.lifetimeStats,
      challengesCompleted: player.lifetimeStats.challengesCompleted + 1,
    },
  }
}
