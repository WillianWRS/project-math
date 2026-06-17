import { generateInitialBase, generateOperation, evaluateAnswer } from './operation-generator'
import { levelTimerMs, scoreToLevel, crossedScoreMilestoneBurst } from './level-system'
import type { GameSession, SubmitResult } from './types'

const SUBMIT_LOCK_MS = 500
const SCORE_PER_CORRECT = 10
const CLUTCH_WINDOW_MS = 2_000
const CLUTCH_EASY_OPERATIONS = 2
const CLUTCH_RECHARGE_CORRECT = 8

function canTriggerClutchHelp(session: GameSession): boolean {
  return (
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
    beatRecord: false,
    easyOperationsRemaining: 0,
    clutchHelpCooldownRemaining: 0,
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
    beatRecord: false,
    easyOperationsRemaining: 0,
    clutchHelpCooldownRemaining: 0,
  }
}

export function tickTimer(session: GameSession, deltaMs: number): GameSession {
  if (session.phase !== 'playing' || session.isSubmitLocked) {
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
  }
}

export function submitAnswer(session: GameSession): {
  session: GameSession
  result: SubmitResult
} {
  if (session.phase !== 'playing') {
    return { session, result: 'locked' }
  }

  if (session.isSubmitLocked) {
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

  if (canTriggerClutchHelp(session)) {
    easyOperationsRemaining = CLUTCH_EASY_OPERATIONS
    clutchHelpCooldownRemaining = CLUTCH_RECHARGE_CORRECT
  } else if (clutchHelpCooldownRemaining > 0) {
    clutchHelpCooldownRemaining -= 1
  }

  const forceAddSubOnly = easyOperationsRemaining > 0
  const operation = generateOperation(baseNumber, level, session.operation, { forceAddSubOnly })
  if (forceAddSubOnly) {
    easyOperationsRemaining -= 1
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
      easyOperationsRemaining,
      clutchHelpCooldownRemaining,
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
  return { ...session, answerFlash: null }
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
