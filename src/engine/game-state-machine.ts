import { generateInitialBase, generateOperation, evaluateAnswer } from './operation-generator'
import { advanceSideCyclesOnCorrect } from './game-changer-cycles'
import { levelTimerMs, scoreToLevel, crossedScoreMilestoneBurst } from './level-system'
import type { GameSession, SubmitResult } from './types'
const SUBMIT_LOCK_MS = 280
const SCORE_PER_CORRECT = 10
const CLUTCH_WINDOW_MS = 2_000
const CLUTCH_EASY_OPERATIONS = 2
const CLUTCH_RECHARGE_CORRECT = 8

function canTriggerClutchHelp(session: GameSession): boolean {  return (
    session.level >= 5 &&
    session.timerMs <= CLUTCH_WINDOW_MS &&
    session.clutchHelpCooldownRemaining === 0
  )
}

export function createInitialSession(): GameSession {
  return {
    phase: 'idle',
    score: 0,
    level: 1,
    timerMs: levelTimerMs(1),
    timerMaxMs: levelTimerMs(1),
    baseNumber: 0,
    operation: null,
    inputValue: '',
    isSubmitLocked: false,
    levelUpFlash: null,
    answerFlash: null,
    answerFlashAuto: false,
    beatRecord: false,
    easyOperationsRemaining: 0,
    clutchHelpCooldownRemaining: 0,
    autoCheckCharges: 0,
    autoCheckCycleStep: null,
    fourSecondsCycleStep: null,
    fourSecondsGameChangerRemaining: 0,
    timesDivCycleStep: null,
    timesDivGameChangerRemaining: 0,
    plusCycleStep: null,
    plusGameChangerActive: false,
    minusCycleStep: null,
    minusGameChangerActive: false,
  }
}

export function startGame(): GameSession {
  const level = 1
  const baseNumber = generateInitialBase(level)
  const timerMaxMs = levelTimerMs(level)

  return {
    phase: 'playing',
    score: 0,
    level,
    timerMs: timerMaxMs,
    timerMaxMs,
    baseNumber,
    operation: generateOperation(baseNumber, level, null),
    inputValue: '',
    isSubmitLocked: false,
    levelUpFlash: null,
    answerFlash: null,
    answerFlashAuto: false,
    beatRecord: false,
    easyOperationsRemaining: 0,
    clutchHelpCooldownRemaining: 0,
    autoCheckCharges: 0,
    autoCheckCycleStep: null,
    fourSecondsCycleStep: null,
    fourSecondsGameChangerRemaining: 0,
    timesDivCycleStep: null,
    timesDivGameChangerRemaining: 0,
    plusCycleStep: null,
    plusGameChangerActive: false,
    minusCycleStep: null,
    minusGameChangerActive: false,
  }
}

export function tickTimer(session: GameSession, deltaMs: number): GameSession {
  if (session.phase !== 'playing') {
    return session
  }

  const timerMs = Math.max(0, session.timerMs - deltaMs)
  if (timerMs > 0) {
    return { ...session, timerMs }
  }

  return {
    ...session,
    phase: 'game_over',
    timerMs: 0,
    autoCheckCharges: 0,
    autoCheckCycleStep: null,
  }
}

export function submitAnswer(
  session: GameSession,
  options?: { autoCheck?: boolean },
): {
  session: GameSession
  result: SubmitResult
} {
  if (session.phase !== 'playing') {
    return { session, result: 'locked' }
  }

  if (session.isSubmitLocked) {
    return { session, result: 'locked' }
  }

  if (
    options?.autoCheck &&
    !DEBUG_AUTO_CHECK_ALWAYS_ENABLED &&
    session.autoCheckCharges <= 0
  ) {
    return { session, result: 'locked' }
  }

  if (!session.operation) {
    return { session, result: 'locked' }
  }

  const trimmed = session.inputValue.trim()
  if (trimmed === '') {
    return { session, result: 'empty' }
  }

  const answer = Number.parseInt(trimmed, 10)
  if (Number.isNaN(answer)) {
    return { session, result: 'empty' }
  }

  const isCorrect = evaluateAnswer(session.baseNumber, session.operation, answer)

  if (!isCorrect) {
    return {
      session: {
        ...session,
        isSubmitLocked: true,
        clutchHelpCooldownRemaining:
          session.clutchHelpCooldownRemaining > 0 ? CLUTCH_RECHARGE_CORRECT : 0,
      },
      result: 'wrong',
    }
  }

  const previousLevel = session.level
  const score = session.score + SCORE_PER_CORRECT
  const level = scoreToLevel(score)
  const timerMaxMs = levelTimerMs(level)
  const baseNumber = session.operation.result
  const leveledUp = level > previousLevel
  const milestoneBurst = crossedScoreMilestoneBurst(session.score, score)
  const levelUpFlash = leveledUp ? level : milestoneBurst ? 5 : null

  let easyOperationsRemaining = session.easyOperationsRemaining
  let clutchHelpCooldownRemaining = session.clutchHelpCooldownRemaining
  let fourSecondsGameChangerRemaining = session.fourSecondsGameChangerRemaining
  let timesDivGameChangerRemaining = session.timesDivGameChangerRemaining
  let plusGameChangerActive = session.plusGameChangerActive
  let minusGameChangerActive = session.minusGameChangerActive

  if (canTriggerClutchHelp(session)) {
    easyOperationsRemaining = CLUTCH_EASY_OPERATIONS
    clutchHelpCooldownRemaining = CLUTCH_RECHARGE_CORRECT
  } else if (clutchHelpCooldownRemaining > 0) {
    clutchHelpCooldownRemaining -= 1
  }

  const cycleUpdate = advanceSideCyclesOnCorrect({ ...session, score, level })
  if (cycleUpdate.fourSecondsGameChangerRemaining !== undefined) {
    fourSecondsGameChangerRemaining = cycleUpdate.fourSecondsGameChangerRemaining
  }
  if (cycleUpdate.timesDivGameChangerRemaining !== undefined) {
    timesDivGameChangerRemaining = cycleUpdate.timesDivGameChangerRemaining
  }
  if (cycleUpdate.plusGameChangerActive !== undefined) {
    plusGameChangerActive = cycleUpdate.plusGameChangerActive
  }
  if (cycleUpdate.minusGameChangerActive !== undefined) {
    minusGameChangerActive = cycleUpdate.minusGameChangerActive
  }

  const plusReachedGoal = plusGameChangerActive && baseNumber === 99
  if (plusReachedGoal) {
    plusGameChangerActive = false
  }

  const minusReachedGoal = minusGameChangerActive && baseNumber === 1
  if (minusReachedGoal) {
    minusGameChangerActive = false
  }

  const nextPlusCycleStep =
    cycleUpdate.plusCycleStep !== undefined ? cycleUpdate.plusCycleStep : session.plusCycleStep
  const nextMinusCycleStep =
    cycleUpdate.minusCycleStep !== undefined ? cycleUpdate.minusCycleStep : session.minusCycleStep

  const forceFourSecondsRules = fourSecondsGameChangerRemaining > 0
  const forceTimesDivRules = timesDivGameChangerRemaining > 0
  const forcePlusCycleRules = plusGameChangerActive
  const forceMinusCycleRules = minusGameChangerActive
  const forcePlusPreCycleFinal = nextPlusCycleStep === 4
  const forceMinusPreCycleFinal = nextMinusCycleStep === 4
  const forceAddSubOnly =
    !forceFourSecondsRules &&
    !forceTimesDivRules &&
    !forcePlusCycleRules &&
    !forceMinusCycleRules &&
    !forcePlusPreCycleFinal &&
    !forceMinusPreCycleFinal &&
    easyOperationsRemaining > 0

  let operation
  if (forceFourSecondsRules) {
    operation = generateOperation(baseNumber, level, session.operation, { forceFourSecondsRules: true })
    fourSecondsGameChangerRemaining -= 1
  } else if (forceTimesDivRules) {
    operation = generateOperation(baseNumber, level, session.operation, { forceTimesDivRules: true })
    timesDivGameChangerRemaining -= 1
  } else if (forcePlusCycleRules) {
    operation = generateOperation(baseNumber, level, session.operation, { forcePlusCycleRules: true })
  } else if (forceMinusCycleRules) {
    operation = generateOperation(baseNumber, level, session.operation, { forceMinusCycleRules: true })
  } else if (forcePlusPreCycleFinal) {
    operation = generateOperation(baseNumber, level, session.operation, {
      forcePlusPreCycleFinal: true,
    })
  } else if (forceMinusPreCycleFinal) {
    operation = generateOperation(baseNumber, level, session.operation, {
      forceMinusPreCycleFinal: true,
    })
  } else {
    operation = generateOperation(baseNumber, level, session.operation, { forceAddSubOnly })
    if (forceAddSubOnly) {
      easyOperationsRemaining -= 1
    }
  }

  let autoCheckCharges = cycleUpdate.autoCheckCharges ?? session.autoCheckCharges
  if (options?.autoCheck === true && !DEBUG_AUTO_CHECK_ALWAYS_ENABLED) {
    autoCheckCharges -= 1
  }

  return {
    session: {
      ...session,
      score,
      level,
      baseNumber,
      operation,
      inputValue: '',
      timerMs: timerMaxMs,
      timerMaxMs,
      isSubmitLocked: false,
      levelUpFlash,
      answerFlash: trimmed,
      answerFlashAuto: options?.autoCheck ?? false,
      easyOperationsRemaining,
      clutchHelpCooldownRemaining,
      autoCheckCharges,
      autoCheckCycleStep:
        cycleUpdate.autoCheckCycleStep !== undefined
          ? cycleUpdate.autoCheckCycleStep
          : session.autoCheckCycleStep,
      fourSecondsCycleStep:
        cycleUpdate.fourSecondsCycleStep !== undefined
          ? cycleUpdate.fourSecondsCycleStep
          : session.fourSecondsCycleStep,
      fourSecondsGameChangerRemaining,
      timesDivCycleStep:
        cycleUpdate.timesDivCycleStep !== undefined
          ? cycleUpdate.timesDivCycleStep
          : session.timesDivCycleStep,
      timesDivGameChangerRemaining,
      plusCycleStep:
        cycleUpdate.plusCycleStep !== undefined ? cycleUpdate.plusCycleStep : session.plusCycleStep,
      plusGameChangerActive,
      minusCycleStep:
        cycleUpdate.minusCycleStep !== undefined ? cycleUpdate.minusCycleStep : session.minusCycleStep,
      minusGameChangerActive,
    },
    result: 'correct',
  }
}

export function unlockSubmit(session: GameSession): GameSession {
  if (!session.isSubmitLocked) {
    return session
  }
  return { ...session, isSubmitLocked: false, inputValue: '' }
}

export function clearLevelUpFlash(session: GameSession): GameSession {
  if (session.levelUpFlash === null) {
    return session
  }
  return { ...session, levelUpFlash: null }
}

export function clearAnswerFlash(session: GameSession): GameSession {
  if (session.answerFlash === null) {
    return session
  }
  return { ...session, answerFlash: null, answerFlashAuto: false }
}

export function setInputValue(session: GameSession, value: string): GameSession {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 2)
  return { ...session, inputValue: digitsOnly }
}

export function markBeatRecord(session: GameSession, beatRecord: boolean): GameSession {
  return { ...session, beatRecord }
}

export function returnToMenu(): GameSession {
  return createInitialSession()
}

export { SUBMIT_LOCK_MS }

/** Debug: auto-check do teclado sempre disponível, sem consumir cargas. */
export const DEBUG_AUTO_CHECK_ALWAYS_ENABLED = false
