import { xpToLevel } from '../engine/player-level'
import type { ChallengeModeId } from '../engine/types'
import type { PlayerData } from '../platform/storage'
import { ensureDailyFresh } from '../platform/daily-reset'
import { getChallengeDefinition } from './challenge-catalog'
import { isChallengeInActiveKit } from './challenge-rotation'

export const DAILY_CHALLENGE_MAX_ATTEMPTS = 3

export function getChallengeAttemptsUsed(player: PlayerData, challengeId: ChallengeModeId): number {
  const fresh = ensureDailyFresh(player)
  return fresh.daily.challengeAttemptsUsed[challengeId] ?? 0
}

export function getChallengeAttemptsRemaining(player: PlayerData, challengeId: ChallengeModeId): number {
  return Math.max(0, DAILY_CHALLENGE_MAX_ATTEMPTS - getChallengeAttemptsUsed(player, challengeId))
}

export function formatChallengeAttemptsRemaining(remaining: number): string {
  if (remaining === 1) return '1 tentativa restante'
  return `${remaining} tentativas restantes`
}

export function consumeChallengeAttempt(player: PlayerData, challengeId: ChallengeModeId): PlayerData {
  const fresh = ensureDailyFresh(player)
  const used = getChallengeAttemptsUsed(fresh, challengeId)

  return {
    ...fresh,
    daily: {
      ...fresh.daily,
      challengeAttemptsUsed: {
        ...fresh.daily.challengeAttemptsUsed,
        [challengeId]: used + 1,
      },
    },
  }
}

export function isChallengeCompletedToday(player: PlayerData, challengeId: ChallengeModeId): boolean {
  const fresh = ensureDailyFresh(player)
  return fresh.daily.challengesPlayed.includes(challengeId)
}

/** @deprecated Use isChallengeCompletedToday */
export const isChallengePlayedToday = isChallengeCompletedToday

export function markChallengeCompletedToday(
  player: PlayerData,
  challengeId: ChallengeModeId,
): PlayerData {
  const fresh = ensureDailyFresh(player)
  if (fresh.daily.challengesPlayed.includes(challengeId)) return fresh

  return {
    ...fresh,
    daily: {
      ...fresh.daily,
      challengesPlayed: [...fresh.daily.challengesPlayed, challengeId],
    },
  }
}

export function canStartChallenge(
  player: PlayerData,
  challengeId: ChallengeModeId,
): { ok: true } | { ok: false; reason: 'rotation' | 'level' | 'coins' | 'played' | 'attempts' } {
  const fresh = ensureDailyFresh(player)
  const definition = getChallengeDefinition(challengeId)
  const playerLevel = xpToLevel(fresh.xp)

  if (!isChallengeInActiveKit(challengeId)) return { ok: false, reason: 'rotation' }
  if (playerLevel < definition.requiredLevel) return { ok: false, reason: 'level' }
  if (isChallengeCompletedToday(fresh, challengeId)) return { ok: false, reason: 'played' }
  if (getChallengeAttemptsRemaining(fresh, challengeId) <= 0) return { ok: false, reason: 'attempts' }
  if (fresh.coins < definition.entryCostCoins) return { ok: false, reason: 'coins' }

  return { ok: true }
}
