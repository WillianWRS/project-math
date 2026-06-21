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
  loadSoundEnabled,
  loadTopScores,
  saveBackgroundTheme,
  saveSoundEnabled,
  saveTopScore,
  type BackgroundTheme,
  type ScoreRecord,
} from '../platform/storage'
import { playRandomWriteSfx, playSfx, preloadSfx, syncAmbient } from '../platform/audio-service'

/** Intervalo de publicação do timer na UI — reduz re-renders sem alterar a barra visualmente. */
const TIMER_UI_PUBLISH_MS = 100

export function useGame() {
  const [session, setSession] = useState<GameSession>(createInitialSession)
  const [topScores, setTopScores] = useState<ScoreRecord[]>(() => loadTopScores())
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled())
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(() => loadBackgroundTheme())
  const sessionRef = useRef(session)
  sessionRef.current = session
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled
  const gameOverFxHandledRef = useRef(false)
  const lastPersistedScoreRef = useRef<number | null>(null)
  const timerMsRef = useRef(session.timerMs)

  useEffect(() => {
    preloadSfx()
  }, [])

  useEffect(() => {
    syncAmbient(soundEnabled && session.phase === 'playing')
  }, [soundEnabled, session.phase])

  useEffect(() => {
    timerMsRef.current = session.timerMs
  }, [session.phase, session.score])

  useEffect(() => {
    if (session.phase !== 'playing') return

    let lastTick = performance.now()
    let lastPublish = lastTick
    let frameId = 0

    const loop = (now: number) => {
      const delta = now - lastTick
      lastTick = now
      timerMsRef.current = Math.max(0, timerMsRef.current - delta)

      if (timerMsRef.current <= 0) {
        setSession((current) => {
          if (current.phase !== 'playing') return current
          return tickTimer({ ...current, timerMs: 0 }, 0)
        })
        return
      }

      if (now - lastPublish >= TIMER_UI_PUBLISH_MS) {
        lastPublish = now
        const timerMs = timerMsRef.current
        setSession((current) => {
          if (current.phase !== 'playing') return current
          if (Math.abs(current.timerMs - timerMs) < 1) return current
          return { ...current, timerMs }
        })
      }

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [session.phase])

  useEffect(() => {
    if (session.phase !== 'game_over') return
    if (gameOverFxHandledRef.current && lastPersistedScoreRef.current === session.score) return

    gameOverFxHandledRef.current = true
    lastPersistedScoreRef.current = session.score

    const result = saveTopScore(session.score)
    setTopScores(result.scores)
    setSession((current) =>
      current.phase === 'game_over' && current.beatRecord === result.isTop1
        ? current
        : markBeatRecord(current, result.isTop1),
    )
    playSfx(result.isTop1 ? 'record' : 'gameOver', soundEnabledRef.current)
  }, [session.phase, session.score])

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
    lastPersistedScoreRef.current = null
    setSession(startGame())
  }, [])

  const onReturnToMenu = useCallback(() => {
    gameOverFxHandledRef.current = false
    lastPersistedScoreRef.current = null
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
    topScores,
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
