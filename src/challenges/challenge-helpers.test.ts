import { describe, expect, it } from 'vitest'
import {
  canStartChallenge,
  consumeChallengeAttempt,
  DAILY_CHALLENGE_MAX_ATTEMPTS,
  formatChallengeAttemptsRemaining,
  getChallengeAttemptsRemaining,
  isChallengeCompletedToday,
  markChallengeCompletedToday,
} from './challenge-helpers'
import { createDefaultPlayerData } from '../platform/storage'

function playerReadyForChallenges() {
  return {
    ...createDefaultPlayerData(),
    coins: 500,
    xp: 10_000,
  }
}

describe('challenge-helpers', () => {
  it('não marca desafio como concluído antes da conclusão', () => {
    const player = createDefaultPlayerData()
    expect(isChallengeCompletedToday(player, 'double-coins')).toBe(false)
  })

  it('marca desafio como concluído apenas após conclusão', () => {
    const player = markChallengeCompletedToday(createDefaultPlayerData(), 'double-coins')
    expect(isChallengeCompletedToday(player, 'double-coins')).toBe(true)
  })

  it('não duplica desafio concluído na lista diária', () => {
    const once = markChallengeCompletedToday(createDefaultPlayerData(), 'double-coins')
    const twice = markChallengeCompletedToday(once, 'double-coins')
    expect(twice.daily.challengesPlayed).toEqual(['double-coins'])
  })

  it('inicia com 3 tentativas restantes', () => {
    const player = createDefaultPlayerData()
    expect(getChallengeAttemptsRemaining(player, 'double-coins')).toBe(DAILY_CHALLENGE_MAX_ATTEMPTS)
    expect(formatChallengeAttemptsRemaining(3)).toBe('3 tentativas restantes')
    expect(formatChallengeAttemptsRemaining(1)).toBe('1 tentativa restante')
  })

  it('consome tentativas ao iniciar e bloqueia após esgotar', () => {
    let player = playerReadyForChallenges()

    for (let attempt = DAILY_CHALLENGE_MAX_ATTEMPTS; attempt > 0; attempt -= 1) {
      expect(getChallengeAttemptsRemaining(player, 'double-coins')).toBe(attempt)
      expect(canStartChallenge(player, 'double-coins').ok).toBe(true)
      player = consumeChallengeAttempt(player, 'double-coins')
    }

    expect(getChallengeAttemptsRemaining(player, 'double-coins')).toBe(0)
    expect(canStartChallenge(player, 'double-coins')).toEqual({ ok: false, reason: 'attempts' })
  })

  it('bloqueia por conclusão mesmo com tentativas restantes', () => {
    const player = markChallengeCompletedToday(playerReadyForChallenges(), 'double-coins')
    expect(getChallengeAttemptsRemaining(player, 'double-coins')).toBe(DAILY_CHALLENGE_MAX_ATTEMPTS)
    expect(canStartChallenge(player, 'double-coins')).toEqual({ ok: false, reason: 'played' })
  })
})
