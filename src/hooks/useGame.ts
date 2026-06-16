import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearLevelUpFlash,
  clearAnswerFlash,
  createInitialSession,
  markBeatRecord,
  returnToMenu,
  setInputValue,
  startGame,
  submitAnswer,
  SUBMIT_LOCK_MS,
  tickTimer,
  unlockSubmit,
} from '../engine/game-state-machine'
import type { GameSession } from '../engine/types'
import {
  loadBackgroundTheme,
  loadHighScore,
  loadSoundEnabled,
  saveBackgroundTheme,
  saveHighScore,
  saveSoundEnabled,
  type BackgroundTheme,
  type HighScoreRecord,
} from '../platform/storage'

export function useGame() {
  const [session, setSession] = useState<GameSession>(createInitialSession)
  const [highScore, setHighScore] = useState<HighScoreRecord | null>(() => loadHighScore())
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled())
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(() => loadBackgroundTheme())
  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => {
    if (session.phase !== 'playing') return

    let lastTick = performance.now()
    let frameId = 0

    const loop = (now: number) => {
      const delta = now - lastTick
      lastTick = now

      setSession((current) => {
        if (current.phase !== 'playing') return current

        const next = tickTimer(current, delta)
        if (next.phase !== 'game_over') return next

        const currentHigh = loadHighScore()
        if (next.score > (currentHigh?.score ?? 0)) {
          const record = saveHighScore(next.score)
          setHighScore(record)
          return markBeatRecord(next, true)
        }

        return markBeatRecord(next, false)
      })

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [session.phase])

  useEffect(() => {
    if (!session.isSubmitLocked) return

    const timeout = window.setTimeout(() => {
      setSession((current) => unlockSubmit(current))
    }, SUBMIT_LOCK_MS)

    return () => window.clearTimeout(timeout)
  }, [session.isSubmitLocked])

  useEffect(() => {
    if (session.answerFlash === null) return

    const timeout = window.setTimeout(() => {
      setSession((current) => clearAnswerFlash(current))
    }, 560)

    return () => window.clearTimeout(timeout)
  }, [session.answerFlash])

  useEffect(() => {
    if (session.levelUpFlash === null) return

    const timeout = window.setTimeout(() => {
      setSession((current) => clearLevelUpFlash(current))
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [session.levelUpFlash])

  const onStart = useCallback(() => {
    if (sessionRef.current.phase === 'playing') return
    setSession(startGame())
  }, [])

  const onReturnToMenu = useCallback(() => {
    setSession(returnToMenu())
  }, [])

  const onConfirm = useCallback(() => {
    setSession((current) => submitAnswer(current).session)
  }, [])

  const onInputChange = useCallback((value: string) => {
    setSession((current) => setInputValue(current, value))
  }, [])

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled)
    saveSoundEnabled(enabled)
  }, [])

  const setTheme = useCallback((theme: BackgroundTheme) => {
    setBackgroundTheme(theme)
    saveBackgroundTheme(theme)
  }, [])

  return {
    session,
    highScore,
    soundEnabled,
    backgroundTheme,
    onStart,
    onReturnToMenu,
    onConfirm,
    onInputChange,
    toggleSound,
    setBackgroundTheme: setTheme,
  }
}
