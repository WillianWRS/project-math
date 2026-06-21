import { generateInitialBase, generateOperation, evaluateAnswer } from './operation-generator'
import { advanceSideCyclesOnCorrect } from './game-changer-cycles'
import { rhythmLevelTimerMs, scoreToRhythmLevel, crossedScoreMilestoneBurst } from './level-system'
import type { GameSession, SubmitResult } from './types'
const SUBMIT_LOCK_MS = 280
const SCORE_PER_CORRECT = 10
const CLUTCH_WINDOW_MS = 2_000
const CLUTCH_EASY_OPERATIONS = 2
const CLUTCH_RECHARGE_CORRECT = 8

function canTriggerClutchHelp(session: GameSession): boolean {  return (
    session.rhythmLevel >= 5 &&
    session.timerMs <= CLUTCH_WINDOW_MS &&
    session.clutchHelpCooldownRemaining === 0
  )
}

export function createInitialSession(): GameSession {
  return {
    phase: 'idle',
    score: 0,
    rhythmLevel: 1,
    timerMs: rhythmLevelTimerMs(1),
    timerMaxMs: rhythmLevelTimerMs(1),
    elapsedMs: 0,
    baseNumber: 0,
    operation: null,
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
  }
}

export function startGame(): GameSession {
  const rhythmLevel = 1
  const baseNumber = generateInitialBase(rhythmLevel)
  const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)

  return {
    phase: 'playing',
    score: 0,
    rhythmLevel,
    timerMs: timerMaxMs,
    timerMaxMs,
    elapsedMs: 0,
    baseNumber,
    operation: generateOperation(baseNumber, rhythmLevel, null),
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
    autoCheckCycleStep: null,
  }
}

export function submitAnswer(
  session: GameSession,
  options?: { autoCheck?: boolean },
): {
  session: GameSession
  result: SubmitResult
  autoCheckGranted: boolean
} {
  if (session.phase !== 'playing') {
    return { session, result: 'locked', autoCheckGranted: false }
  }

  if (session.isSubmitLocked) {
    return { session, result: 'locked', autoCheckGranted: false }
  }

  if (!session.operation) {
    return { session, result: 'locked', autoCheckGranted: false }
  }

  const trimmed = session.inputValue.trim()
  if (trimmed === '') {
    return { session, result: 'empty', autoCheckGranted: false }
  }

  const answer = Number.parseInt(trimmed, 10)
  if (Number.isNaN(answer)) {
    return { session, result: 'empty', autoCheckGranted: false }
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
      autoCheckGranted: false,
    }
  }

  const previousRhythmLevel = session.rhythmLevel
  const score = session.score + SCORE_PER_CORRECT
  const rhythmLevel = scoreToRhythmLevel(score)
  const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)
  const baseNumber = session.operation.result
  const leveledUp = rhythmLevel > previousRhythmLevel
  const milestoneBurst = crossedScoreMilestoneBurst(session.score, score)
  const rhythmLevelUpFlash = leveledUp ? rhythmLevel : milestoneBurst ? 5 : null

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

  const cycleUpdate = advanceSideCyclesOnCorrect({ ...session, score, rhythmLevel })
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
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, { forceFourSecondsRules: true })
    fourSecondsGameChangerRemaining -= 1
  } else if (forceTimesDivRules) {
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, { forceTimesDivRules: true })
    timesDivGameChangerRemaining -= 1
  } else if (forcePlusCycleRules) {
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, { forcePlusCycleRules: true })
  } else if (forceMinusCycleRules) {
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, { forceMinusCycleRules: true })
  } else if (forcePlusPreCycleFinal) {
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, {
      forcePlusPreCycleFinal: true,
    })
  } else if (forceMinusPreCycleFinal) {
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, {
      forceMinusPreCycleFinal: true,
    })
  } else {
    operation = generateOperation(baseNumber, rhythmLevel, session.operation, { forceAddSubOnly })
    if (forceAddSubOnly) {
      easyOperationsRemaining -= 1
    }
  }

  return {
    session: {
      ...session,
      score,
      rhythmLevel,
      baseNumber,
      operation,
      inputValue: '',
      timerMs: timerMaxMs,
      timerMaxMs,
      isSubmitLocked: false,
      rhythmLevelUpFlash,
      answerFlash: trimmed,
      answerFlashAuto: options?.autoCheck ?? false,
      awaitingAutoCheckChoice: false,
      easyOperationsRemaining,
      clutchHelpCooldownRemaining,
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
    autoCheckGranted: Boolean(cycleUpdate.autoCheckGranted),
  }
}

export function unlockSubmit(session: GameSession): GameSession {
  if (!session.isSubmitLocked) {
    return session
  }
  return { ...session, isSubmitLocked: false, inputValue: '' }
}

export function clearLevelUpFlash(session: GameSession): GameSession {
  if (session.rhythmLevelUpFlash === null) {
    return session
  }
  return { ...session, rhythmLevelUpFlash: null }
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
