export type GamePhase = 'idle' | 'playing' | 'game_over'

export type Operator = '+' | '-' | '×' | '÷'

export interface Operation {
  operator: Operator
  operand: number
  result: number
}

export interface GameSession {
  phase: GamePhase
  score: number
  level: number
  timerMs: number
  timerMaxMs: number
  baseNumber: number
  operation: Operation | null
  inputValue: string
  isSubmitLocked: boolean
  levelUpFlash: number | null
  answerFlash: string | null
  beatRecord: boolean
  /** Nível 5+: próximas N operações forçadas em +/− após acerto nos 2s finais */
  easyOperationsRemaining: number
  /** Acertos restantes para liberar nova ajuda clutch (0 = elegível) */
  clutchHelpCooldownRemaining: number
}

export type SubmitResult = 'correct' | 'wrong' | 'locked' | 'empty'
