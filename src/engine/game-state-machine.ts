import { generateInitialBase, generateOperation, evaluateAnswer } from './operation-generator'
import { levelTimerMs, scoreToLevel } from './level-system'
import type { GameSession, SubmitResult } from './types'

const SUBMIT_LOCK_MS = 500
const SCORE_PER_CORRECT = 10

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
    beatRecord: false,
  }
}

export function startGame(): GameSession {
  const baseNumber = generateInitialBase()
  const level = 1
  const timerMaxMs = levelTimerMs(level)

  return {
    phase: 'playing',
    score: 0,
    level,
    timerMs: timerMaxMs,
    timerMaxMs,
    baseNumber,
    operation: generateOperation(baseNumber),
    inputValue: '',
    isSubmitLocked: false,
    levelUpFlash: null,
    beatRecord: false,
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
      session: { ...session, isSubmitLocked: true },
      result: 'wrong',
    }
  }

  const previousLevel = session.level
  const score = session.score + SCORE_PER_CORRECT
  const level = scoreToLevel(score)
  const timerMaxMs = levelTimerMs(level)
  const baseNumber = session.operation.result
  const leveledUp = level > previousLevel

  return {
    session: {
      ...session,
      score,
      level,
      baseNumber,
      operation: generateOperation(baseNumber),
      inputValue: '',
      timerMs: timerMaxMs,
      timerMaxMs,
      isSubmitLocked: false,
      levelUpFlash: leveledUp ? level : null,
    },
    result: 'correct',
  }
}

export function unlockSubmit(session: GameSession): GameSession {
  if (!session.isSubmitLocked) {
    return session
  }
  return { ...session, isSubmitLocked: false }
}

export function clearLevelUpFlash(session: GameSession): GameSession {
  if (session.levelUpFlash === null) {
    return session
  }
  return { ...session, levelUpFlash: null }
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
