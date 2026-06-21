import type { GameSession } from './types'

export const AUTO_CHECK_CYCLE_CHANCE = 0.02
export const FOUR_SECONDS_CYCLE_CHANCE = 0.02
export const TIMES_DIV_CYCLE_CHANCE = 0.02
export const PLUS_CYCLE_CHANCE = 0.02
export const MINUS_CYCLE_CHANCE = 0.02
export const FOUR_SECONDS_GAME_CHANGER_CORRECT = 10
export const TIMES_DIV_GAME_CHANGER_CORRECT = 10
export const SIDE_CYCLE_STEPS = 4
export const SIDE_CYCLE_MIN_LEVEL = 5

type CycleAdvanceUpdate = Partial<
  Pick<
    GameSession,
    | 'autoCheckCycleStep'
    | 'fourSecondsCycleStep'
    | 'fourSecondsGameChangerRemaining'
    | 'timesDivCycleStep'
    | 'timesDivGameChangerRemaining'
    | 'plusCycleStep'
    | 'plusGameChangerActive'
    | 'minusCycleStep'
    | 'minusGameChangerActive'
  >
> & {
  autoCheckGranted?: boolean
}

export function isFourSecondsGameChangerActive(session: GameSession): boolean {
  return session.fourSecondsGameChangerRemaining > 0
}

export function isTimesDivGameChangerActive(session: GameSession): boolean {
  return session.timesDivGameChangerRemaining > 0
}

export function isPlusGameChangerActive(session: GameSession): boolean {
  return session.plusGameChangerActive
}

export function isMinusGameChangerActive(session: GameSession): boolean {
  return session.minusGameChangerActive
}

export function isAnyGameChangerActive(session: GameSession): boolean {
  return (
    isFourSecondsGameChangerActive(session) ||
    isTimesDivGameChangerActive(session) ||
    isPlusGameChangerActive(session) ||
    isMinusGameChangerActive(session)
  )
}

export function canRollCycleEvents(session: GameSession): boolean {
  return !isAnyGameChangerActive(session)
}

function advanceAutoCheckCycle(session: GameSession): CycleAdvanceUpdate {
  if (session.autoCheckCycleStep === null) return {}

  if (session.autoCheckCycleStep >= SIDE_CYCLE_STEPS) {
    return {
      autoCheckCycleStep: null,
      autoCheckGranted: true,
    }
  }

  return { autoCheckCycleStep: session.autoCheckCycleStep + 1 }
}

function advanceFourSecondsPreCycle(session: GameSession): CycleAdvanceUpdate {
  if (session.fourSecondsCycleStep === null) return {}

  if (session.fourSecondsCycleStep >= SIDE_CYCLE_STEPS) {
    return {
      fourSecondsCycleStep: null,
      fourSecondsGameChangerRemaining: FOUR_SECONDS_GAME_CHANGER_CORRECT,
    }
  }

  return { fourSecondsCycleStep: session.fourSecondsCycleStep + 1 }
}

function advanceTimesDivPreCycle(session: GameSession): CycleAdvanceUpdate {
  if (session.timesDivCycleStep === null) return {}

  if (session.timesDivCycleStep >= SIDE_CYCLE_STEPS) {
    return {
      timesDivCycleStep: null,
      timesDivGameChangerRemaining: TIMES_DIV_GAME_CHANGER_CORRECT,
    }
  }

  return { timesDivCycleStep: session.timesDivCycleStep + 1 }
}

function advancePlusPreCycle(session: GameSession): CycleAdvanceUpdate {
  if (session.plusCycleStep === null) return {}

  if (session.plusCycleStep >= SIDE_CYCLE_STEPS) {
    return {
      plusCycleStep: null,
      plusGameChangerActive: true,
    }
  }

  return { plusCycleStep: session.plusCycleStep + 1 }
}

function advanceMinusPreCycle(session: GameSession): CycleAdvanceUpdate {
  if (session.minusCycleStep === null) return {}

  if (session.minusCycleStep >= SIDE_CYCLE_STEPS) {
    return {
      minusCycleStep: null,
      minusGameChangerActive: true,
    }
  }

  return { minusCycleStep: session.minusCycleStep + 1 }
}

function rollNewCycleEvents(session: GameSession): CycleAdvanceUpdate {
  if (!canRollCycleEvents(session)) return {}

  const update: CycleAdvanceUpdate = {}
  const noRightCycle =
    session.fourSecondsCycleStep === null &&
    session.timesDivCycleStep === null &&
    session.plusCycleStep === null &&
    session.minusCycleStep === null
  const eligibleForRightCycle = noRightCycle && session.rhythmLevel >= SIDE_CYCLE_MIN_LEVEL

  if (eligibleForRightCycle) {
    const candidates: Array<'fourSeconds' | 'timesDiv' | 'plus' | 'minus'> = []
    if (Math.random() < FOUR_SECONDS_CYCLE_CHANCE) candidates.push('fourSeconds')
    if (Math.random() < TIMES_DIV_CYCLE_CHANCE) candidates.push('timesDiv')
    if (Math.random() < PLUS_CYCLE_CHANCE) candidates.push('plus')
    if (Math.random() < MINUS_CYCLE_CHANCE) candidates.push('minus')

    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      if (pick === 'fourSeconds') update.fourSecondsCycleStep = 1
      else if (pick === 'timesDiv') update.timesDivCycleStep = 1
      else if (pick === 'plus') update.plusCycleStep = 1
      else update.minusCycleStep = 1
    }
  }

  const startedRightCycle =
    update.fourSecondsCycleStep === 1 ||
    update.timesDivCycleStep === 1 ||
    update.plusCycleStep === 1 ||
    update.minusCycleStep === 1

  if (
    !startedRightCycle &&
    session.autoCheckCycleStep === null &&
    Math.random() < AUTO_CHECK_CYCLE_CHANCE
  ) {
    update.autoCheckCycleStep = 1
  }

  return update
}

export function advanceSideCyclesOnCorrect(session: GameSession): CycleAdvanceUpdate {
  if (!canRollCycleEvents(session)) {
    return {}
  }

  if (session.autoCheckCycleStep !== null) {
    return advanceAutoCheckCycle(session)
  }
  if (session.fourSecondsCycleStep !== null) {
    return advanceFourSecondsPreCycle(session)
  }
  if (session.timesDivCycleStep !== null) {
    return advanceTimesDivPreCycle(session)
  }
  if (session.plusCycleStep !== null) {
    return advancePlusPreCycle(session)
  }
  if (session.minusCycleStep !== null) {
    return advanceMinusPreCycle(session)
  }

  return rollNewCycleEvents(session)
}
