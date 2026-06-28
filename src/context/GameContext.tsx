import type { ReactNode } from 'react'
import { useGame } from '../hooks/useGame'
import { GameContext } from './game-context'

/**
 * Provê o estado/ações do jogo via contexto. Centraliza a única chamada de `useGame()`
 * e elimina o prop drilling: a árvore consome o que precisa com `useGameContext()`.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGame()
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>
}
