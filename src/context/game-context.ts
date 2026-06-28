import { createContext, useContext } from 'react'
import type { useGame } from '../hooks/useGame'

export type GameContextValue = ReturnType<typeof useGame>

export const GameContext = createContext<GameContextValue | null>(null)

export function useGameContext(): GameContextValue {
  const value = useContext(GameContext)
  if (value === null) {
    throw new Error('useGameContext deve ser usado dentro de <GameProvider>.')
  }
  return value
}
