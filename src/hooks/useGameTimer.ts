import { useSyncExternalStore } from 'react'
import { gameTimerStore } from '../platform/game-timer-store'

export function useGameTimer() {
  return useSyncExternalStore(gameTimerStore.subscribe, gameTimerStore.getSnapshot, gameTimerStore.getSnapshot)
}
