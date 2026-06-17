import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearLevelUpFlash,
  clearAnswerFlash,
  createInitialSession,
  DEBUG_AUTO_CHECK_ALWAYS_ENABLED,
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
import { playRandomWriteSfx, playSfx, preloadSfx, syncAmbient } from '../platform/audio-service'

export function useGame() {
  const [session, setSession] = useState<GameSession>(createInitialSession)
  const [highScore, setHighScore] = useState<HighScoreRecord | null>(() => loadHighScore())
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled())
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(() => loadBackgroundTheme())
  const sessionRef = useRef(session)
  sessionRef.current = session
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled
  const gameOverFxHandledRef = useRef(false)

  useEffect(() => {
    preloadSfx()
  }, [])

  useEffect(() => {
    syncAmbient(soundEnabled && session.phase === 'playing')
  }, [soundEnabled, session.phase])

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
        const beatRecord = next.score > (currentHigh?.score ?? 0)

        if (!gameOverFxHandledRef.current) {
          gameOverFxHandledRef.current = true
          queueMicrotask(() => {
            if (beatRecord) {
              setHighScore(saveHighScore(next.score))
            }
            playSfx(beatRecord ? 'record' : 'gameOver', soundEnabledRef.current)
          })
        }

        return markBeatRecord(next, beatRecord)
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
    gameOverFxHandledRef.current = false
    setSession(startGame())
  }, [])

  const onReturnToMenu = useCallback(() => {
    gameOverFxHandledRef.current = false
    setSession(returnToMenu())
  }, [])

  const onConfirm = useCallback(() => {
    const { session: next, result } = submitAnswer(sessionRef.current)
    setSession(next)

    if (result === 'correct') {
      playSfx('success', soundEnabledRef.current)
    } else if (result === 'wrong') {
      playSfx('error', soundEnabledRef.current)
    }
  }, [])

  const onAutoCorrect = useCallback(() => {
    const current = sessionRef.current
    if (
      current.phase !== 'playing' ||
      current.isSubmitLocked ||
      !current.operation ||
      (!DEBUG_AUTO_CHECK_ALWAYS_ENABLED && current.autoCheckCharges <= 0)
    ) {
      return
    }

    const { session: next, result } = submitAnswer(
      setInputValue(current, String(current.operation.result)),
      { autoCheck: true },
    )
    setSession(next)

    if (result === 'correct') {
      playSfx('success', soundEnabledRef.current)
    } else if (result === 'wrong') {
      playSfx('error', soundEnabledRef.current)
    }
  }, [])

  const onInputChange = useCallback((value: string) => {
    setSession((current) => setInputValue(current, value))
  }, [])

  const playClick = useCallback(() => {
    playSfx('click', soundEnabledRef.current)
  }, [])

  const playGameStart = useCallback(() => {
    playSfx('gameStart', soundEnabledRef.current)
  }, [])

  const playWriteKey = useCallback(() => {
    playRandomWriteSfx(soundEnabledRef.current)
  }, [])

  const playEraseKey = useCallback(() => {
    playSfx('erase', soundEnabledRef.current)
  }, [])

  const playGoToMenu = useCallback(() => {
    playSfx('goToMenu', soundEnabledRef.current)
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
    onAutoCorrect,
    onInputChange,
    toggleSound,
    setBackgroundTheme: setTheme,
    playClick,
    playGameStart,
    playWriteKey,
    playEraseKey,
    playGoToMenu,
  }
}
