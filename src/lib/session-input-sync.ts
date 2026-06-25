import type { GameSession } from '../engine/types'

/** Só sincroniza o input exibido quando a sessão alterou inputValue de propósito. */
export function shouldSyncInputFromSession(
  previous: GameSession,
  next: GameSession,
  displayedInputValue: string,
): boolean {
  return next.inputValue !== previous.inputValue || next.inputValue !== displayedInputValue
}
