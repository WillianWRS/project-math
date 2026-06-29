import type { ChallengeModeId } from '../engine/types'
import { getDateKey } from '../platform/daily-reset'
import { CHALLENGE_CATALOG, getChallengeDefinition, type ChallengeDefinition } from './challenge-catalog'

/** Dia em que o Kit 1 (Moedas em dobro + 3 segundos) está ativo. */
export const CHALLENGE_ROTATION_ANCHOR_DATE_KEY = '2026-06-28'

export const CHALLENGE_KITS: readonly (readonly ChallengeModeId[])[] = [
  ['double-coins', 'three-seconds'],
  ['sixty-seconds', 'times-div-only'],
] as const

function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T12:00:00`)
  const to = new Date(`${toKey}T12:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

export function getActiveChallengeKitIndex(date = new Date()): number {
  const dateKey = getDateKey(date)
  const dayOffset = daysBetweenDateKeys(CHALLENGE_ROTATION_ANCHOR_DATE_KEY, dateKey)
  const normalized = ((dayOffset % 2) + 2) % 2
  return normalized
}

export function getActiveChallengeIds(date = new Date()): ChallengeModeId[] {
  const kitIndex = getActiveChallengeKitIndex(date)
  return [...CHALLENGE_KITS[kitIndex]]
}

export function isChallengeInActiveKit(challengeId: ChallengeModeId, date = new Date()): boolean {
  return getActiveChallengeIds(date).includes(challengeId)
}

export function getActiveChallenges(date = new Date()): ChallengeDefinition[] {
  return getActiveChallengeIds(date).map((id) => getChallengeDefinition(id))
}

export function getActiveChallengeKitNumber(date = new Date()): 1 | 2 {
  return (getActiveChallengeKitIndex(date) + 1) as 1 | 2
}
