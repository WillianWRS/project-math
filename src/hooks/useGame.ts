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
import { scoreToCoins } from '../engine/rewards'
import type { GameSession } from '../engine/types'
import { usePlayer } from './usePlayer'
import { ensureDailyFresh } from '../platform/daily-reset'
import { isAnyGameChangerActive } from '../engine/game-changer-cycles'
import { loadSoundEnabled, loadTopScores, saveSoundEnabled, saveTopScore, type ScoreRecord } from '../platform/storage'
import { playCorrectAnswerSfx, playRandomWriteSfx, playSfx, preloadSfx, syncAmbient } from '../platform/audio-service'

const TIMER_UI_PUBLISH_MS = 100
const DAILY_GOAL_SCORE = 1000
const DAILY_GOAL_XP_REWARD = 1000

export interface PostGameRewards {
  xpGained: number
  coinsGained: number
  goalCompleted: boolean
}

export function useGame() {
  const [session, setSession] = useState<GameSession>(createInitialSession)
  const [topScores, setTopScores] = useState<ScoreRecord[]>(() => loadTopScores())
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled())
  const [lastGameRewards, setLastGameRewards] = useState<PostGameRewards>({
    xpGained: 0,
    coinsGained: 0,
    goalCompleted: false,
  })
  const { player, commitPlayer, grantAutoCheck, spendAutoCheck, setEquippedTheme, ...playerActions } =
    usePlayer()

  const sessionRef = useRef(session)
  const playerRef = useRef(player)
  const soundEnabledRef = useRef(soundEnabled)
  const gameOverFxHandledRef = useRef(false)
  const lastPersistedScoreRef = useRef<number | null>(null)
  const timerMsRef = useRef(session.timerMs)
  const elapsedMsRef = useRef(session.elapsedMs)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    preloadSfx()
  }, [])

  useEffect(() => {
    syncAmbient(soundEnabled && session.phase === 'playing' && !session.awaitingAutoCheckChoice)
  }, [soundEnabled, session.phase, session.awaitingAutoCheckChoice])

  useEffect(() => {
    timerMsRef.current = session.timerMs
    elapsedMsRef.current = session.elapsedMs
  }, [session.phase, session.score, session.timerMs, session.elapsedMs])

  useEffect(() => {
    if (session.phase !== 'playing') return

    let lastTick = performance.now()
    let lastPublish = lastTick
    let frameId = 0

    const loop = (now: number) => {
      const delta = now - lastTick
      lastTick = now

      if (!sessionRef.current.awaitingAutoCheckChoice) {
        timerMsRef.current = Math.max(0, timerMsRef.current - delta)
        elapsedMsRef.current += delta
      }

      if (timerMsRef.current <= 0 && !sessionRef.current.awaitingAutoCheckChoice) {
        setSession((current) => {
          if (current.phase !== 'playing') return current
          if (current.awaitingAutoCheckChoice) return current
          if (playerRef.current.walletAutoChecks > 0) {
            return { ...current, timerMs: 0, awaitingAutoCheckChoice: true }
          }
          return tickTimer({ ...current, timerMs: 0 }, 0)
        })
        return
      }

      if (now - lastPublish >= TIMER_UI_PUBLISH_MS) {
        lastPublish = now
        const timerMs = timerMsRef.current
        const elapsedMs = elapsedMsRef.current
        setSession((current) => {
          if (current.phase !== 'playing') return current
          if (
            Math.abs(current.timerMs - timerMs) < 1 &&
            Math.abs(current.elapsedMs - elapsedMs) < 1
          ) {
            return current
          }
          return { ...current, timerMs, elapsedMs }
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

    const coinsGained = scoreToCoins(session.score)
    let goalCompleted = false
    let xpGained = session.score

    commitPlayer((current) => {
      const fresh = ensureDailyFresh(current)
      const dailyScore = fresh.daily.scoreAccumulated + session.score
      goalCompleted = !fresh.daily.goalClaimed && dailyScore >= DAILY_GOAL_SCORE
      if (goalCompleted) {
        xpGained += DAILY_GOAL_XP_REWARD
      }

      return {
        ...fresh,
        xp: fresh.xp + xpGained,
        coins: fresh.coins + coinsGained,
        walletAutoChecks: fresh.walletAutoChecks + (goalCompleted ? 1 : 0),
        daily: {
          ...fresh.daily,
          scoreAccumulated: dailyScore,
          goalClaimed: fresh.daily.goalClaimed || goalCompleted,
        },
      }
    })

    setLastGameRewards({ xpGained, coinsGained, goalCompleted })

    const result = saveTopScore(session.score, session.elapsedMs)
    setTopScores(result.scores)
    setSession((current) =>
      current.phase === 'game_over' && current.beatRecord === result.isTop1
        ? current
        : markBeatRecord(current, result.isTop1),
    )
    playSfx(result.isTop1 ? 'record' : 'gameOver', soundEnabledRef.current)
  }, [session.phase, session.score, session.elapsedMs, commitPlayer])

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
    if (session.rhythmLevelUpFlash === null) return
    const timeout = window.setTimeout(() => {
      setSession((current) => clearLevelUpFlash(current))
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [session.rhythmLevelUpFlash])

  const onStart = useCallback(() => {
    if (sessionRef.current.phase === 'playing') return
    gameOverFxHandledRef.current = false
    lastPersistedScoreRef.current = null
    setLastGameRewards({ xpGained: 0, coinsGained: 0, goalCompleted: false })
    setSession(startGame())
  }, [])

  const onReturnToMenu = useCallback(() => {
    gameOverFxHandledRef.current = false
    lastPersistedScoreRef.current = null
    setSession(returnToMenu())
  }, [])

  const applyAnswerResult = useCallback(
    (current: GameSession, fromAutoCheck = false) => {
      const { session: next, result, autoCheckGranted } = submitAnswer(current, {
        autoCheck: fromAutoCheck,
      })
      setSession(next)

      if (autoCheckGranted) {
        grantAutoCheck(1)
      }

      if (result === 'correct') {
        playCorrectAnswerSfx(isAnyGameChangerActive(current), soundEnabledRef.current, fromAutoCheck)
      } else if (result === 'wrong') {
        playSfx('error', soundEnabledRef.current)
      }
    },
    [grantAutoCheck],
  )

  const onConfirm = useCallback(() => {
    applyAnswerResult(sessionRef.current)
  }, [applyAnswerResult])

  const runAutoCorrect = useCallback((consumeWallet: boolean) => {
    const current = sessionRef.current
    if (current.phase !== 'playing' || current.isSubmitLocked || !current.operation) return

    let spent = false
    if (!DEBUG_AUTO_CHECK_ALWAYS_ENABLED && consumeWallet) {
      spent = spendAutoCheck()
      if (!spent) return
    }

    const forcedAnswer = setInputValue(current, String(current.operation.result))
    const { session: next, result, autoCheckGranted } = submitAnswer(forcedAnswer, { autoCheck: true })
    setSession(next)

    if (result === 'locked' && spent && consumeWallet) {
      grantAutoCheck(1)
      return
    }
    if (autoCheckGranted) {
      grantAutoCheck(1)
    }
    if (result === 'correct') {
      playCorrectAnswerSfx(isAnyGameChangerActive(current), soundEnabledRef.current, true)
    } else if (result === 'wrong') {
      playSfx('error', soundEnabledRef.current)
    }
  }, [grantAutoCheck, spendAutoCheck])

  const onAutoCorrect = useCallback(() => {
    runAutoCorrect(true)
  }, [runAutoCorrect])

  const onUseAutoCheckAtTimeout = useCallback(() => {
    const current = sessionRef.current
    if (current.phase !== 'playing' || !current.awaitingAutoCheckChoice) return
    runAutoCorrect(true)
  }, [runAutoCorrect])

  const onDeclineAutoCheckAtTimeout = useCallback(() => {
    setSession((current) => {
      if (current.phase !== 'playing') return current
      return {
        ...current,
        phase: 'game_over',
        timerMs: 0,
        awaitingAutoCheckChoice: false,
      }
    })
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

  return {
    session,
    topScores,
    soundEnabled,
    backgroundTheme: player.equippedThemeId,
    player,
    lastGameRewards,
    onStart,
    onReturnToMenu,
    onConfirm,
    onAutoCorrect,
    onUseAutoCheckAtTimeout,
    onDeclineAutoCheckAtTimeout,
    onInputChange,
    toggleSound,
    setBackgroundTheme: setEquippedTheme,
    grantAutoCheck,
    spendAutoCheck,
    ...playerActions,
    playClick,
    playGameStart,
    playWriteKey,
    playEraseKey,
    playGoToMenu,
  }
}
