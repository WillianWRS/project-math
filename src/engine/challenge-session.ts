import { generateInitialBase, generateOperation } from './operation-generator'
import { rhythmLevelTimerMs } from './level-system'
import { submitAnswer as baseSubmitAnswer, tickTimer as baseTickTimer } from './game-state-machine'
import type { ChallengeModeId, ChallengeProgress, GameSession, SubmitResult } from './types'

const DOUBLE_COINS_SCORE_CAP = 1_000
const SIXTY_SECONDS_LIMIT_MS = 60_000
const TIMES_DIV_ROUNDS = 50
const THREE_SECONDS_PLUS_REWARD = 25
const THREE_SECONDS_MINUS_REWARD = 50

function emptyChallengeProgress(phase: ChallengeProgress['threeSecondsPhase'] = 'plus'): ChallengeProgress {
  return {
    bonusCoinsEarned: 0,
    threeSecondsPhase: phase,
    roundsCompleted: 0,
  }
}

function createPlayingSession(partial: Partial<GameSession> & Pick<GameSession, 'baseNumber' | 'operation'>): GameSession {
  return {
    phase: 'playing',
    score: 0,
    rhythmLevel: 1,
    timerMs: rhythmLevelTimerMs(1),
    timerMaxMs: rhythmLevelTimerMs(1),
    elapsedMs: 0,
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
    ...partial,
  }
}

export function startChallengeGame(mode: ChallengeModeId): GameSession {
  switch (mode) {
    case 'double-coins': {
      const rhythmLevel = 1
      const baseNumber = generateInitialBase(rhythmLevel)
      const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)
      return createPlayingSession({
        rhythmLevel,
        timerMs: timerMaxMs,
        timerMaxMs,
        baseNumber,
        operation: generateOperation(baseNumber, rhythmLevel, null),
        challengeMode: mode,
        challengeProgress: emptyChallengeProgress(),
      })
    }
    case 'sixty-seconds': {
      const rhythmLevel = 5
      const baseNumber = generateInitialBase(rhythmLevel)
      const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)
      return createPlayingSession({
        rhythmLevel,
        timerMs: timerMaxMs,
        timerMaxMs,
        baseNumber,
        operation: generateOperation(baseNumber, rhythmLevel, null),
        challengeMode: mode,
        challengeProgress: emptyChallengeProgress(),
      })
    }
    case 'three-seconds': {
      const rhythmLevel = 5
      const baseNumber = 1
      const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)
      return createPlayingSession({
        rhythmLevel,
        timerMs: timerMaxMs,
        timerMaxMs,
        baseNumber,
        operation: generateOperation(baseNumber, rhythmLevel, null, { forcePlusCycleRules: true }),
        plusGameChangerActive: true,
        challengeMode: mode,
        challengeProgress: emptyChallengeProgress('plus'),
        challengeInstantChangerSwitch: true,
      })
    }
    case 'times-div-only': {
      const rhythmLevel = 5
      const baseNumber = generateInitialBase(rhythmLevel)
      const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)
      return createPlayingSession({
        rhythmLevel,
        timerMs: timerMaxMs,
        timerMaxMs,
        baseNumber,
        operation: generateOperation(baseNumber, rhythmLevel, null, { forceTimesDivRules: true }),
        timesDivGameChangerRemaining: TIMES_DIV_ROUNDS,
        challengeMode: mode,
        challengeProgress: emptyChallengeProgress(),
      })
    }
    default:
      throw new Error(`Modo de desafio não suportado: ${mode satisfies never}`)
  }
}

function pinRhythmLevel(session: GameSession): GameSession {
  if (session.challengeMode === 'sixty-seconds' || session.challengeMode === 'three-seconds' || session.challengeMode === 'times-div-only') {
    const rhythmLevel = 5
    const timerMaxMs = rhythmLevelTimerMs(rhythmLevel)
    return { ...session, rhythmLevel, timerMaxMs, timerMs: timerMaxMs }
  }
  return session
}

function finishChallenge(session: GameSession): GameSession {
  return {
    ...session,
    phase: 'game_over',
    awaitingAutoCheckChoice: false,
    autoCheckCycleStep: null,
  }
}

function handleThreeSecondsAfterCorrect(session: GameSession): GameSession {
  if (session.challengeMode !== 'three-seconds' || !session.challengeProgress) return session

  const progress = session.challengeProgress

  if (progress.threeSecondsPhase === 'plus' && session.baseNumber === 99) {
    const bonusCoinsEarned = progress.bonusCoinsEarned + THREE_SECONDS_PLUS_REWARD
    const nextOperation = generateOperation(99, session.rhythmLevel, session.operation, {
      forceMinusCycleRules: true,
    })
    return {
      ...session,
      plusGameChangerActive: false,
      minusGameChangerActive: true,
      operation: nextOperation,
      challengeProgress: {
        ...progress,
        bonusCoinsEarned,
        threeSecondsPhase: 'minus',
      },
      challengeInstantChangerSwitch: true,
    }
  }

  if (progress.threeSecondsPhase === 'minus' && session.baseNumber === 1) {
    const bonusCoinsEarned = progress.bonusCoinsEarned + THREE_SECONDS_MINUS_REWARD
    return finishChallenge({
      ...session,
      minusGameChangerActive: false,
      operation: null,
      challengeProgress: {
        ...progress,
        bonusCoinsEarned,
      },
    })
  }

  return session
}

function handleTimesDivOnlyAfterCorrect(session: GameSession): GameSession {
  if (session.challengeMode !== 'times-div-only' || !session.challengeProgress) return session

  const roundsCompleted = session.challengeProgress.roundsCompleted + 1
  const progress = { ...session.challengeProgress, roundsCompleted }

  if (roundsCompleted >= TIMES_DIV_ROUNDS) {
    return finishChallenge({
      ...session,
      timesDivGameChangerRemaining: 0,
      challengeProgress: progress,
      operation: null,
    })
  }

  return { ...session, challengeProgress: progress }
}

function handleDoubleCoinsAfterCorrect(session: GameSession): GameSession {
  if (session.challengeMode !== 'double-coins') return session
  if (session.score >= DOUBLE_COINS_SCORE_CAP) {
    return finishChallenge({ ...session, score: DOUBLE_COINS_SCORE_CAP })
  }
  return session
}

export function submitChallengeAnswer(
  session: GameSession,
  options?: { autoCheck?: boolean },
): {
  session: GameSession
  result: SubmitResult
  autoCheckGranted: boolean
} {
  const outcome = baseSubmitAnswer(session, options)
  if (outcome.result !== 'correct') return outcome

  let next = pinRhythmLevel(outcome.session)
  next = handleThreeSecondsAfterCorrect(next)
  next = handleTimesDivOnlyAfterCorrect(next)
  next = handleDoubleCoinsAfterCorrect(next)

  return { ...outcome, session: next }
}

export function tickChallengeTimer(session: GameSession, deltaMs: number): GameSession {
  if (session.phase !== 'playing') return session

  if (session.challengeMode === 'sixty-seconds') {
    const elapsedMs = session.elapsedMs + deltaMs
    if (elapsedMs >= SIXTY_SECONDS_LIMIT_MS) {
      return finishChallenge({ ...session, elapsedMs: SIXTY_SECONDS_LIMIT_MS, timerMs: 0 })
    }
  }

  return baseTickTimer(session, deltaMs)
}

export function challengeSessionElapsedLimitMs(mode: ChallengeModeId | null): number | null {
  if (mode === 'sixty-seconds') return SIXTY_SECONDS_LIMIT_MS
  return null
}

export {
  DOUBLE_COINS_SCORE_CAP,
  SIXTY_SECONDS_LIMIT_MS,
  TIMES_DIV_ROUNDS,
  THREE_SECONDS_PLUS_REWARD,
  THREE_SECONDS_MINUS_REWARD,
}
