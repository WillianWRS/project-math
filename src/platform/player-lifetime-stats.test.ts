import { describe, expect, it } from 'vitest'
import { SIXTY_SECONDS_LIMIT_MS } from '../engine/challenge-session'
import type { GameSession } from '../engine/types'
import { createDefaultPlayerData } from './storage'
import {
  applyAvatarPhotoSaved,
  applyChallengeCompletedStats,
  applyDailyGoalCompletedStats,
  applyNormalGameOverStats,
  applyPlusOneCalculationStats,
  applyShopAutoCheckPurchaseStats,
  createEmptyPendingNormalSessionStats,
  detectGameChangerCompletions,
  isPlusOneAddition,
  parsePlayerLifetimeStats,
  recordAutoCheckEarnedInNormalSession,
  recordGameChangerCompletions,
  recordPlusOneCalculationInSession,
} from './player-lifetime-stats'

function baseSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    phase: 'playing',
    score: 250,
    rhythmLevel: 5,
    timerMs: 7_000,
    timerMaxMs: 7_000,
    elapsedMs: 0,
    baseNumber: 10,
    operation: { operator: '+', operand: 2, result: 12 },
    inputValue: '',
    isSubmitLocked: false,
    rhythmLevelUpFlash: null,
    answerFlash: null,
    answerFlashAuto: false,
    beatRecord: false,
    awaitingAutoCheckChoice: false,
    easyOperationsRemaining: 0,
    clutchHelpCooldownRemaining: 0,
    autoCheckCycleStep: null,
    fourSecondsCycleStep: null,
    fourSecondsGameChangerRemaining: 0,
    timesDivCycleStep: null,
    timesDivGameChangerRemaining: 0,
    plusCycleStep: null,
    plusGameChangerActive: false,
    minusCycleStep: null,
    minusGameChangerActive: false,
    challengeMode: null,
    challengeProgress: null,
    challengeInstantChangerSwitch: false,
    ...overrides,
  }
}

describe('player-lifetime-stats', () => {
  it('detecta conclusões de game changer', () => {
    expect(
      detectGameChangerCompletions(
        baseSession({ plusGameChangerActive: true, baseNumber: 97 }),
        baseSession({ plusGameChangerActive: false, baseNumber: 99 }),
      ),
    ).toEqual(['plus99'])

    expect(
      detectGameChangerCompletions(
        baseSession({ minusGameChangerActive: true, baseNumber: 3 }),
        baseSession({ minusGameChangerActive: false, baseNumber: 1 }),
      ),
    ).toEqual(['minus1'])

    expect(
      detectGameChangerCompletions(
        baseSession({ fourSecondsGameChangerRemaining: 1 }),
        baseSession({ fourSecondsGameChangerRemaining: 0 }),
      ),
    ).toEqual(['fourSeconds'])

    expect(
      detectGameChangerCompletions(
        baseSession({ timesDivGameChangerRemaining: 1 }),
        baseSession({ timesDivGameChangerRemaining: 0 }),
      ),
    ).toEqual(['timesDiv'])
  })

  it('persiste stats de partida normal apenas no game over', () => {
    let pending = createEmptyPendingNormalSessionStats()
    pending = recordAutoCheckEarnedInNormalSession(pending)
    pending = recordGameChangerCompletions(pending, ['plus99', 'fourSeconds'])

    const player = applyNormalGameOverStats(createDefaultPlayerData(), 120, pending)

    expect(player.lifetimeStats.lifetimeScoreNormal).toBe(120)
    expect(player.lifetimeStats.bestScoreNormal).toBe(120)
    expect(player.lifetimeStats.normalGamesCompleted).toBe(1)
    expect(player.lifetimeStats.autoChecksEarnedNormal).toBe(1)
    expect(player.lifetimeStats.hasZeroScoreNormalGameOver).toBe(false)
    expect(player.lifetimeStats.gameChangerCompletions.plus99).toBe(1)
    expect(player.lifetimeStats.gameChangerCompletions.fourSeconds).toBe(1)
  })

  it('persiste cálculo +1 apenas no game over', () => {
    let pending = createEmptyPendingNormalSessionStats()
    pending = recordPlusOneCalculationInSession(pending)
    expect(pending.solvedPlusOneCalculation).toBe(true)
    expect(recordPlusOneCalculationInSession(pending)).toBe(pending)

    const player = applyNormalGameOverStats(createDefaultPlayerData(), 50, pending)
    expect(player.lifetimeStats.hasSolvedPlusOneCalculation).toBe(true)
  })

  it('atualiza bestScoreNormal e marca zero score no game over', () => {
    let player = createDefaultPlayerData()
    player = applyNormalGameOverStats(player, 250, createEmptyPendingNormalSessionStats())
    expect(player.lifetimeStats.bestScoreNormal).toBe(250)

    player = applyNormalGameOverStats(player, 180, createEmptyPendingNormalSessionStats())
    expect(player.lifetimeStats.bestScoreNormal).toBe(250)

    player = applyNormalGameOverStats(player, 0, createEmptyPendingNormalSessionStats())
    expect(player.lifetimeStats.hasZeroScoreNormalGameOver).toBe(true)
  })

  it('marca compra de auto-check na loja', () => {
    const player = applyShopAutoCheckPurchaseStats(createDefaultPlayerData())
    expect(player.lifetimeStats.hasPurchasedShopAutoCheck).toBe(true)

    const again = applyShopAutoCheckPurchaseStats(player)
    expect(again).toBe(player)
  })

  it('incrementa desafios concluídos apenas quando aplicado', () => {
    const player = applyChallengeCompletedStats(createDefaultPlayerData())
    expect(player.lifetimeStats.challengesCompleted).toBe(1)
  })

  it('marca avatar, meta diária e cálculo +1', () => {
    let player = applyAvatarPhotoSaved(createDefaultPlayerData())
    expect(player.lifetimeStats.hasSavedAvatarPhoto).toBe(true)
    expect(applyAvatarPhotoSaved(player)).toBe(player)

    player = applyDailyGoalCompletedStats(player)
    expect(player.lifetimeStats.dailyGoalsCompleted).toBe(1)

    player = applyPlusOneCalculationStats(player)
    expect(player.lifetimeStats.hasSolvedPlusOneCalculation).toBe(true)
    expect(applyPlusOneCalculationStats(player)).toBe(player)
  })

  it('detecta cálculo X + 1', () => {
    expect(isPlusOneAddition({ operator: '+', operand: 1, result: 11 })).toBe(true)
    expect(isPlusOneAddition({ operator: '+', operand: 2, result: 12 })).toBe(false)
    expect(isPlusOneAddition(null)).toBe(false)
  })

  it('faz parse seguro de stats persistidas', () => {
    const parsed = parsePlayerLifetimeStats({
      lifetimeScoreNormal: 100_000,
      bestScoreNormal: 420,
      normalGamesCompleted: 12,
      autoChecksEarnedNormal: 3,
      challengesCompleted: 2,
      hasZeroScoreNormalGameOver: true,
      hasPurchasedShopAutoCheck: true,
      gameChangerCompletions: {
        plus99: 4,
        minus1: -2,
        fourSeconds: 1.8,
        timesDiv: Number.NaN,
      },
    })

    expect(parsed.lifetimeScoreNormal).toBe(100_000)
    expect(parsed.bestScoreNormal).toBe(420)
    expect(parsed.normalGamesCompleted).toBe(12)
    expect(parsed.autoChecksEarnedNormal).toBe(3)
    expect(parsed.challengesCompleted).toBe(2)
    expect(parsed.hasZeroScoreNormalGameOver).toBe(true)
    expect(parsed.hasPurchasedShopAutoCheck).toBe(true)
    expect(parsed.gameChangerCompletions.plus99).toBe(4)
    expect(parsed.gameChangerCompletions.minus1).toBe(0)
    expect(parsed.gameChangerCompletions.fourSeconds).toBe(1)
    expect(parsed.gameChangerCompletions.timesDiv).toBe(0)
  })

  it('usa limite de 60s como referência de desafio concluído', () => {
    expect(SIXTY_SECONDS_LIMIT_MS).toBe(60_000)
  })
})
