type Listener = () => void

type TimerSnapshot = {
  timerMs: number
  elapsedMs: number
}

let timerMs = 0
let elapsedMs = 0
let snapshot: TimerSnapshot = { timerMs: 0, elapsedMs: 0 }
const listeners = new Set<Listener>()

function commitSnapshot(nextTimerMs: number, nextElapsedMs: number) {
  timerMs = nextTimerMs
  elapsedMs = nextElapsedMs
  if (snapshot.timerMs === timerMs && snapshot.elapsedMs === elapsedMs) {
    return false
  }
  snapshot = { timerMs, elapsedMs }
  return true
}

export const gameTimerStore = {
  getSnapshot() {
    return snapshot
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  set(nextTimerMs: number, nextElapsedMs: number) {
    if (Math.abs(timerMs - nextTimerMs) < 1 && Math.abs(elapsedMs - nextElapsedMs) < 1) {
      return
    }
    if (commitSnapshot(nextTimerMs, nextElapsedMs)) {
      listeners.forEach((listener) => listener())
    }
  },

  sync(nextTimerMs: number, nextElapsedMs: number) {
    if (commitSnapshot(nextTimerMs, nextElapsedMs)) {
      listeners.forEach((listener) => listener())
    }
  },
}
