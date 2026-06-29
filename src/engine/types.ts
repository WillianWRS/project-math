export type GamePhase = 'idle' | 'playing' | 'game_over'

export type ChallengeModeId = 'double-coins' | 'sixty-seconds' | 'three-seconds' | 'times-div-only'

export interface ChallengeProgress {
  bonusCoinsEarned: number
  threeSecondsPhase: 'plus' | 'minus'
  roundsCompleted: number
}

export type Operator = '+' | '-' | '×' | '÷'

export interface Operation {
  operator: Operator
  operand: number
  result: number
}

export interface GameSession {
  phase: GamePhase
  score: number
  rhythmLevel: number
  timerMs: number
  timerMaxMs: number
  elapsedMs: number
  baseNumber: number
  operation: Operation | null
  inputValue: string
  isSubmitLocked: boolean
  rhythmLevelUpFlash: number | null
  answerFlash: string | null
  answerFlashAuto: boolean
  beatRecord: boolean
  awaitingAutoCheckChoice: boolean
  /** Nível 5+: próximas N operações forçadas em +/− após acerto nos 2s finais */
  easyOperationsRemaining: number
  /** Acertos restantes para liberar nova ajuda clutch (0 = elegível) */
  clutchHelpCooldownRemaining: number
  /** Passo ativo do ciclo lateral (1–4); null = sem ciclo em andamento */
  autoCheckCycleStep: number | null
  /** Passo ativo do four-seconds-cycle (1–4); null = sem ciclo em andamento */
  fourSecondsCycleStep: number | null
  /** Acertos restantes no game changer 4s (+/−, operando 1–9); 0 = inativo */
  fourSecondsGameChangerRemaining: number
  /** Passo ativo do times-div-cycle (1–4); null = sem ciclo em andamento */
  timesDivCycleStep: number | null
  /** Acertos restantes no game changer ×÷; 0 = inativo */
  timesDivGameChangerRemaining: number
  /** Passo ativo do plus-cycle (1–4); null = sem ciclo em andamento */
  plusCycleStep: number | null
  /** Game changer + ativo (só +, operando 1–9, até resultado 99) */
  plusGameChangerActive: boolean
  /** Passo ativo do minus-cycle (1–4); null = sem ciclo em andamento */
  minusCycleStep: number | null
  /** Game changer − ativo (só −, operando 1–9, até resultado 1) */
  minusGameChangerActive: boolean
  /** Modo de desafio ativo; null = partida normal */
  challengeMode: ChallengeModeId | null
  challengeProgress: ChallengeProgress | null
  /** Troca seca de overlay de game changer (desafio 3 segundos) */
  challengeInstantChangerSwitch: boolean
}

export type SubmitResult = 'correct' | 'wrong' | 'locked' | 'empty'
