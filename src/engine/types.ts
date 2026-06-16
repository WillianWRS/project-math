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
  beatRecord: boolean
}

export type SubmitResult = 'correct' | 'wrong' | 'locked' | 'empty'
