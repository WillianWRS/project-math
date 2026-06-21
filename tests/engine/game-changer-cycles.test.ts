import { describe, expect, it } from 'vitest'
import {
  advanceSideCyclesOnCorrect,
  canRollCycleEvents,
  isAnyGameChangerActive,
  isFourSecondsGameChangerActive,
  isMinusGameChangerActive,
  isPlusGameChangerActive,
  isTimesDivGameChangerActive,
  SIDE_CYCLE_STEPS,
} from '../../src/engine/game-changer-cycles'
import type { GameSession } from '../../src/engine/types'

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
    ...overrides,
  }
}

describe('game changer flags', () => {
  it('detecta game changers ativos', () => {
    expect(isFourSecondsGameChangerActive(baseSession({ fourSecondsGameChangerRemaining: 3 }))).toBe(
      true,
    )
    expect(isTimesDivGameChangerActive(baseSession({ timesDivGameChangerRemaining: 1 }))).toBe(true)
    expect(isPlusGameChangerActive(baseSession({ plusGameChangerActive: true }))).toBe(true)
    expect(isMinusGameChangerActive(baseSession({ minusGameChangerActive: true }))).toBe(true)
  })

  it('identifica quando qualquer game changer está ativo', () => {
    expect(isAnyGameChangerActive(baseSession())).toBe(false)
    expect(isAnyGameChangerActive(baseSession({ plusGameChangerActive: true }))).toBe(true)
  })

  it('bloqueia novos ciclos enquanto um game changer está ativo', () => {
    expect(canRollCycleEvents(baseSession())).toBe(true)
    expect(canRollCycleEvents(baseSession({ minusGameChangerActive: true }))).toBe(false)
  })
})

describe('advanceSideCyclesOnCorrect', () => {
  it('não avança ciclos com game changer ativo', () => {
    const update = advanceSideCyclesOnCorrect(
      baseSession({ plusGameChangerActive: true, autoCheckCycleStep: 2 }),
    )
    expect(update).toEqual({})
  })

  it('avança o ciclo de auto-check passo a passo', () => {
    const step2 = advanceSideCyclesOnCorrect(baseSession({ autoCheckCycleStep: 1 }))
    expect(step2.autoCheckCycleStep).toBe(2)

    const completed = advanceSideCyclesOnCorrect(
      baseSession({ autoCheckCycleStep: SIDE_CYCLE_STEPS }),
    )
    expect(completed.autoCheckCycleStep).toBeNull()
    expect(completed.autoCheckGranted).toBe(true)
  })

  it('ativa o game changer four-seconds ao completar o pré-ciclo', () => {
    const update = advanceSideCyclesOnCorrect(
      baseSession({ fourSecondsCycleStep: SIDE_CYCLE_STEPS }),
    )
    expect(update.fourSecondsCycleStep).toBeNull()
    expect(update.fourSecondsGameChangerRemaining).toBe(10)
  })
})
