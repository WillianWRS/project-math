import { AnimatePresence, motion } from '../../lib/motion'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import { NumericKeypad } from './NumericKeypad'
import { PlayFieldsSideLayout } from './SideCardRails'
import {
  ElapsedTimeLabel,
  PlayingTimerBar,
} from './GameTimerDisplay'
import { CurtainOverlay } from './CurtainOverlay'
import { PlayFieldsFrame } from './PlayFieldsFrame'
import { PlayStackWithChangerBg, type PlayStackChangerTheme } from './PlayStackWithChangerBg'
import { TimerDangerOverlay } from './TimerDangerOverlay'
import { WaterSceneLayer } from './WaterSceneLayer'
import {
  isSceneAmbientDecorPaused,
  isSceneModalDecorPaused,
  SCENE_BG_INGAME,
  SCENE_BG_MENU,
  SCENE_BG_STATIC,
} from '../../lib/scene-decor-pause'
import { isFourSecondsGameChangerActive, isMinusGameChangerActive, isPlusGameChangerActive, isTimesDivGameChangerActive } from '../../engine/game-changer-cycles'
import {
  generateFourSecondsOperation,
  generateInitialBase,
  generateOperation,
  generatePlusCycleOperation,
  generateTimesDivOperation,
} from '../../engine/operation-generator'
import { SUBMIT_LOCK_MS } from '../../engine/game-state-machine'
import { type RightCardVariant } from './side-card-types'
import type { Operation } from '../../engine/types'
import { ShareCardTemplate } from '../share/ShareCardTemplate'
import { shareScoreCardFromElement } from '../../utils/share-score-card'
import { xpToLevel } from '../../engine/player-level'
import { formatDuration } from '../../engine/rewards'
import { preloadGameplayModals } from '../../platform/preload-modals'
import { playSfx } from '../../platform/audio-service'
import { formatAppVersionLabel } from '../../config/app-version'
import type { BackgroundTheme } from '../../platform/storage'
import type { TutorialCompletionResult } from '../../hooks/useGame'
import { GameModalLayer } from './GameModalLayer'
import { playUiClickAfterPaint, primeAudioOnPointerDown } from '../../lib/modal-ui'
import { Modal } from '../ui/Modal'
import { useGameContext } from '../../context/game-context'
import {
  IconAutoCheck,
  IconCoin,
  IconDiamond,
  IconGear,
  IconPerson,
  IconPlay,
  IconShare,
  IconShop,
  IconTutorial,
  IconWeeklyChallenges,
} from './icons'
import {
  AnswerDisplay,
  OperationValue,
  SlideValue,
} from './play/AnswerDisplay'
import {
  AnimatedGameMenuButton,
  MenuBenchmarkButton,
  MenuHudButton,
  MenuHudInlineButton,
  MenuLevelBadge,
  MenuPrimaryActions,
  MenuThemeTestButton,
} from './menu/MenuHud'
import { ThemeTestSideLayout } from './theme-test/ThemeTestSideLayout'
import {
  BENCHMARK_METRIC_ORDER,
  benchmarkGradeTone,
  benchmarkPhaseSeverityTone,
  gradeForMetric,
} from './benchmark/benchmark-format'
import {
  TUTORIAL_FINAL_TARGET,
  TUTORIAL_MESSAGES,
  type TutorialStep,
} from './tutorial/tutorial-content'

type PresentationPhase = 'menu' | 'opening' | 'in-game' | 'theme-test' | 'tutorial' | 'closing'

const sceneEnterTransition = { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const }
const ENTER_DURATION_MS = 280
const THEME_TEST_ENTER_DURATION_MS = 100
const CLOSE_DURATION_MS = 320
const menuStageTransition = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const }
const layerParallaxTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
const LIGHT_THEMES: BackgroundTheme[] = ['water', 'sunset', 'ice', 'aurora']
const REWARD_ODOMETER_DURATION_MS = 3_000
const POST_GAME_PRIMARY_FALLBACK_MS = 1_800
const COIN_PAYOUT_SFX_SRC = '/audio/coin.mp3'
const AVATAR_CROP_VIEWPORT_SIZE = 230
const AVATAR_EXPORT_SIZE = 512
const DAILY_GOAL_SCORE_TARGET = 500

function avatarBorderLevelFromPlayerLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level >= 50) return 5
  if (level >= 30) return 4
  if (level >= 20) return 3
  if (level >= 10) return 2
  return 1
}

async function getAudioDurationMs(src: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    const settle = (durationMs: number) => {
      audio.onloadedmetadata = null
      audio.onerror = null
      resolve(durationMs)
    }
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0
      settle(duration > 0 ? Math.round(duration * 1000) : POST_GAME_PRIMARY_FALLBACK_MS)
    }
    audio.onerror = () => settle(POST_GAME_PRIMARY_FALLBACK_MS)
  })
}

const SCENE_THEME_CLASS: Partial<Record<BackgroundTheme, string>> = {
  default: 'game-scene--default',
  water: 'game-scene--water',
  sunset: 'game-scene--sunset',
  forest: 'game-scene--forest',
  violet: 'game-scene--violet',
  ember: 'game-scene--ember',
  neon: 'game-scene--neon',
  midnight: 'game-scene--midnight',
  retro: 'game-scene--retro',
  ice: 'game-scene--ice',
  aurora: 'game-scene--aurora',
}

function menuStageItem(
  delay: number,
  offsetX: number,
  offsetY: number,
): {
  initial: { opacity: number; x: number; y: number; scale: number }
  animate: { opacity: number; x: number; y: number; scale: number; transition: typeof menuStageTransition & { delay: number } }
} {
  return {
    initial: { opacity: 0, x: offsetX, y: offsetY, scale: 0.97 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { ...menuStageTransition, delay },
    },
  }
}

export function GameScreen() {
  const {
    session,
    inputValue,
    topScores,
    player,
    lastGameRewards,
    benchmarkMode,
    perfectAnswerToken,
    benchmarkMetrics,
    benchmarkVirtualKeypadPress,
    soundEnabled,
    menuAudioReady,
    needsGestureUnlock,
    activateAudioFromGesture,
    devModeEnabled,
    godModeEnabled,
    showGodModeToggle,
    backgroundTheme,
    onStart,
    onStartBenchmarkSession,
    onReturnToMenu,
    onConfirm,
    onAutoCorrect,
    onUseAutoCheckAtTimeout,
    onDeclineAutoCheckAtTimeout,
    onInputChange,
    toggleSound: onSoundChange,
    toggleDevMode: onDevModeChange,
    toggleGodMode: onGodModeChange,
    setBackgroundTheme: onBackgroundThemeChange,
    buyTheme: onBuyTheme,
    setEquippedBadge: onEquipBadge,
    purchaseBadge: onBuyBadge,
    purchaseAutoCheckWithDiamonds: onBuyAutoCheck,
    updateDisplayName: onSaveDisplayName,
    updateAvatarPhoto: onSaveAvatarPhoto,
    watchSimulatedAd: onWatchRewardedAd,
    playClick: onPlayClick,
    playGameStart: onPlayGameStart,
    playWriteKey: onPlayWriteKey,
    playEraseKey: onPlayEraseKey,
    playGoToMenu: onPlayGoToMenu,
    completeTutorial: onCompleteTutorial,
  } = useGameContext()
  const rewardedAdsWatched = player.daily.rewardedAdsWatched
  const sceneRootRef = useRef<HTMLDivElement>(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [rewardedOpen, setRewardedOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [weeklyChallengesOpen, setWeeklyChallengesOpen] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)
  const [avatarCropOpen, setAvatarCropOpen] = useState(false)
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null)
  const [avatarDraftNaturalSize, setAvatarDraftNaturalSize] = useState({ width: 0, height: 0 })
  const [avatarScale, setAvatarScale] = useState(1)
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 })
  const [avatarDragging, setAvatarDragging] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [presentation, setPresentation] = useState<PresentationPhase>('menu')
  const answerFieldRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [pendingStartMode, setPendingStartMode] = useState<
    'play' | 'benchmark' | 'theme-test' | 'tutorial' | null
  >(null)
  const [themeTestScore, setThemeTestScore] = useState(0)
  const [themeTestBurstFlash, setThemeTestBurstFlash] = useState<number | null>(null)
  const [themeTestBurstToken, setThemeTestBurstToken] = useState(0)
  const [themeTestChanger, setThemeTestChanger] = useState<RightCardVariant | null>(null)
  const [themeTestChangerBurst, setThemeTestChangerBurst] = useState<RightCardVariant | null>(null)
  const [themeTestChangerBurstToken, setThemeTestChangerBurstToken] = useState(0)
  const [themeTestAutoCheckEnabled, setThemeTestAutoCheckEnabled] = useState(true)
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(0)
  const [tutorialInput, setTutorialInput] = useState('')
  const [tutorialDemoBase, setTutorialDemoBase] = useState(24)
  const [tutorialDemoOperation, setTutorialDemoOperation] = useState<Operation>({
    operator: '+',
    operand: 7,
    result: 31,
  })
  const [tutorialDemoAnswer, setTutorialDemoAnswer] = useState('31')
  const [tutorialDemoScore, setTutorialDemoScore] = useState(0)
  const [tutorialDemoChangerRound, setTutorialDemoChangerRound] = useState(0)
  const [tutorialAutoDemoCharge, setTutorialAutoDemoCharge] = useState(1)
  const [tutorialAutoDemoResolving, setTutorialAutoDemoResolving] = useState(false)
  const [tutorialStep5Resolving, setTutorialStep5Resolving] = useState(false)
  const [tutorialStep5ShakeActive, setTutorialStep5ShakeActive] = useState(false)
  const [tutorialFinalShakeActive, setTutorialFinalShakeActive] = useState(false)
  const [tutorialDefeatTimerMs, setTutorialDefeatTimerMs] = useState(4_000)
  const [tutorialDefeatGameOver, setTutorialDefeatGameOver] = useState(false)
  const [tutorialFinalBase, setTutorialFinalBase] = useState(7)
  const [tutorialFinalOperation, setTutorialFinalOperation] = useState<Operation>({
    operator: '+',
    operand: 3,
    result: 10,
  })
  const [tutorialFinalInput, setTutorialFinalInput] = useState('')
  const [tutorialFinalSolved, setTutorialFinalSolved] = useState(0)
  const [tutorialFinalAutoChecks, setTutorialFinalAutoChecks] = useState(1)
  const [tutorialCompletionResult, setTutorialCompletionResult] = useState<TutorialCompletionResult | null>(null)
  const [gameOverRewardDisplay, setGameOverRewardDisplay] = useState({ xp: 0, coins: 0 })
  const onStartRef = useRef(onStart)
  const onStartBenchmarkSessionRef = useRef(onStartBenchmarkSession)
  const onInputChangeRef = useRef(onInputChange)
  const onConfirmRef = useRef(onConfirm)
  const onPlayWriteKeyRef = useRef(onPlayWriteKey)
  const onPlayEraseKeyRef = useRef(onPlayEraseKey)
  const inputValueRef = useRef(inputValue)
  const inputDisabledRef = useRef(false)
  const benchmarkModeRef = useRef(benchmarkMode)
  const phaseRef = useRef(session.phase)
  const submitLockedRef = useRef(session.isSubmitLocked)
  const backNavigationBypassRef = useRef(false)
  const backTrapInitializedRef = useRef(false)
  const gameOverRewardSequenceKeyRef = useRef<string | null>(null)
  const avatarGalleryInputRef = useRef<HTMLInputElement>(null)
  const avatarCameraInputRef = useRef<HTMLInputElement>(null)
  const avatarPreviewRef = useRef<HTMLDivElement>(null)
  const avatarImageRef = useRef<HTMLImageElement>(null)
  const avatarDragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)

  useEffect(() => {
    onStartRef.current = onStart
  }, [onStart])

  useEffect(() => {
    onStartBenchmarkSessionRef.current = onStartBenchmarkSession
  }, [onStartBenchmarkSession])

  useEffect(() => {
    onInputChangeRef.current = onInputChange
  }, [onInputChange])

  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

  useEffect(() => {
    onPlayWriteKeyRef.current = onPlayWriteKey
  }, [onPlayWriteKey])

  useEffect(() => {
    onPlayEraseKeyRef.current = onPlayEraseKey
  }, [onPlayEraseKey])

  const isPlaying = session.phase === 'playing'
  const isGameOver = session.phase === 'game_over'
  const isThemeTestScene = presentation === 'theme-test'
  const isTutorialScene = presentation === 'tutorial'
  const showBenchmarkResults = benchmarkMode && isGameOver && benchmarkMetrics !== null
  const playerLevel = xpToLevel(player.xp)
  const avatarBorderLevel = avatarBorderLevelFromPlayerLevel(playerLevel)
  const dailyGoalRatio = Math.min(1, player.daily.scoreAccumulated / DAILY_GOAL_SCORE_TARGET)
  const gameOverElapsedText = formatDuration(session.elapsedMs)
  const liveFourSecondsActive = isFourSecondsGameChangerActive(session)
  const topScore = topScores[0] ?? null
  const liveTimesDivActive = isTimesDivGameChangerActive(session)
  const livePlusActive = isPlusGameChangerActive(session)
  const liveMinusActive = isMinusGameChangerActive(session)
  const fourSecondsActive = isThemeTestScene ? themeTestChanger === 'timer' : liveFourSecondsActive
  const timesDivActive = isThemeTestScene ? themeTestChanger === 'mult-div' : liveTimesDivActive
  const plusActive = isThemeTestScene ? themeTestChanger === 'cap-up' : livePlusActive
  const minusActive = isThemeTestScene ? themeTestChanger === 'cap-down' : liveMinusActive
  const currentScore = isThemeTestScene ? themeTestScore : session.score
  const inputDisabled = !isPlaying || session.isSubmitLocked || benchmarkMode
  const timeoutModalOpen = session.awaitingAutoCheckChoice && session.phase === 'playing' && !benchmarkMode
  const anyModalOpen =
    playerOpen ||
    shopOpen ||
    settingsOpen ||
    weeklyChallengesOpen ||
    rewardedOpen ||
    avatarPickerOpen ||
    avatarCropOpen ||
    exitConfirmOpen ||
    timeoutModalOpen
  const ambientDecorPaused = isSceneAmbientDecorPaused({ anyModalOpen, presentation })
  const modalDecorPaused = isSceneModalDecorPaused({ anyModalOpen })

  useEffect(() => {
    inputValueRef.current = inputValue
  }, [inputValue])

  useEffect(() => {
    inputDisabledRef.current = inputDisabled
  }, [inputDisabled])

  useEffect(() => {
    benchmarkModeRef.current = benchmarkMode
  }, [benchmarkMode])

  useEffect(() => {
    phaseRef.current = session.phase
    submitLockedRef.current = session.isSubmitLocked
  }, [session.phase, session.isSubmitLocked])

  useEffect(() => {
    if (!isGameOver || benchmarkMode) {
      gameOverRewardSequenceKeyRef.current = null
      const frame = window.requestAnimationFrame(() => {
        setGameOverRewardDisplay({ xp: lastGameRewards.xpGained, coins: lastGameRewards.coinsGained })
      })
      return () => window.cancelAnimationFrame(frame)
    }

    const sequenceKey = [
      session.score,
      session.elapsedMs,
      session.beatRecord ? 1 : 0,
      lastGameRewards.xpGained,
      lastGameRewards.coinsGained,
    ].join(':')
    if (gameOverRewardSequenceKeyRef.current === sequenceKey) return
    gameOverRewardSequenceKeyRef.current = sequenceKey

    const targetXp = Math.max(0, lastGameRewards.xpGained)
    const targetCoins = Math.max(0, lastGameRewards.coinsGained)
    if (targetCoins < 3) {
      const frame = window.requestAnimationFrame(() => {
        setGameOverRewardDisplay({ xp: targetXp, coins: targetCoins })
      })
      return () => window.cancelAnimationFrame(frame)
    }

    let cancelled = false
    let revealTimeout = 0
    let rafId = 0
    let zeroFrame = 0
    let coinAudio: HTMLAudioElement | null = null

    zeroFrame = window.requestAnimationFrame(() => {
      setGameOverRewardDisplay({ xp: 0, coins: 0 })
    })

    const primarySfxSrc = session.beatRecord ? '/audio/record.mp3' : '/audio/game-over.mp3'
    void (async () => {
      const waitMs = soundEnabled ? await getAudioDurationMs(primarySfxSrc) : 0
      if (cancelled) return

      revealTimeout = window.setTimeout(() => {
        if (cancelled) return

        if (soundEnabled) {
          coinAudio = new Audio(COIN_PAYOUT_SFX_SRC)
          coinAudio.currentTime = 0
          void coinAudio.play().catch(() => {
            // Ignora bloqueios de autoplay neste efeito visual.
          })
        }

        const startedAt = performance.now()
        const animate = (now: number) => {
          if (cancelled) return
          const progress = Math.max(0, Math.min(1, (now - startedAt) / REWARD_ODOMETER_DURATION_MS))
          setGameOverRewardDisplay({
            xp: Math.round(targetXp * progress),
            coins: Math.round(targetCoins * progress),
          })
          if (progress >= 1) return
          rafId = window.requestAnimationFrame(animate)
        }
        rafId = window.requestAnimationFrame(animate)
      }, waitMs)
    })()

    return () => {
      cancelled = true
      window.cancelAnimationFrame(zeroFrame)
      window.clearTimeout(revealTimeout)
      window.cancelAnimationFrame(rafId)
      if (coinAudio) {
        coinAudio.pause()
        coinAudio.currentTime = 0
      }
    }
  }, [
    benchmarkMode,
    isGameOver,
    lastGameRewards.coinsGained,
    lastGameRewards.xpGained,
    session.beatRecord,
    session.elapsedMs,
    session.score,
    soundEnabled,
  ])

  const appendDigit = useCallback(
    (digit: string) => {
      if (inputDisabled) return
      onPlayWriteKey()
      const nextValue = `${inputValueRef.current}${digit}`
      inputValueRef.current = nextValue
      onInputChange(nextValue)
    },
    [inputDisabled, onInputChange, onPlayWriteKey],
  )

  const backspaceDigit = useCallback(() => {
    if (inputDisabled || inputValueRef.current.length === 0) return
    onPlayEraseKey()
    const nextValue = inputValueRef.current.slice(0, -1)
    inputValueRef.current = nextValue
    onInputChange(nextValue)
  }, [inputDisabled, onInputChange, onPlayEraseKey])
  const showGameContent =
    presentation === 'opening' ||
    presentation === 'in-game' ||
    presentation === 'theme-test' ||
    presentation === 'tutorial'
  const showMenuChrome = presentation === 'menu'
  const isInGameScene = presentation !== 'menu'
  const parallaxLayerActive =
    presentation === 'opening' ||
    presentation === 'in-game' ||
    presentation === 'theme-test' ||
    presentation === 'tutorial'
  const effectiveBackgroundTheme: BackgroundTheme = backgroundTheme
  const useWaterBackground = isInGameScene && effectiveBackgroundTheme === 'water'
  const useWaterLikeBackground =
    isInGameScene &&
    (effectiveBackgroundTheme === 'water' ||
      effectiveBackgroundTheme === 'ice' ||
      effectiveBackgroundTheme === 'aurora')
  const useSunsetBackground = isInGameScene && effectiveBackgroundTheme === 'sunset'
  const useSunsetUiLight = useSunsetBackground
  const useForestBackground = isInGameScene && effectiveBackgroundTheme === 'forest'
  const useForestUiLight = useForestBackground
  const useVioletBackground = isInGameScene && effectiveBackgroundTheme === 'violet'
  const useVioletUiLight = useVioletBackground
  const useEmberBackground = isInGameScene && effectiveBackgroundTheme === 'ember'
  const useEmberUiLight = useEmberBackground
  const useNeonBackground = isInGameScene && effectiveBackgroundTheme === 'neon'
  const useNeonUiLight = useNeonBackground
  const useMidnightBackground = isInGameScene && effectiveBackgroundTheme === 'midnight'
  const useMidnightUiLight = useMidnightBackground
  const useRetroBackground = isInGameScene && effectiveBackgroundTheme === 'retro'
  const useRetroUiLight = useRetroBackground
  const useLightBackground = isInGameScene && LIGHT_THEMES.includes(effectiveBackgroundTheme)
  const sceneThemeClass = isInGameScene
    ? (SCENE_THEME_CLASS[effectiveBackgroundTheme] ?? 'bg-charcoal')
    : 'bg-charcoal'
  const headerThemeClass = useWaterLikeBackground
    ? 'game-scene-header--water'
    : useSunsetBackground
      ? 'game-scene-header--sunset'
      : useForestBackground
        ? 'game-scene-header--forest'
        : useVioletBackground
          ? 'game-scene-header--violet'
          : useEmberBackground
            ? 'game-scene-header--ember'
            : useNeonBackground
              ? 'game-scene-header--neon'
              : useMidnightBackground
                ? 'game-scene-header--midnight'
                : useRetroBackground
                  ? 'game-scene-header--retro'
                  : undefined
  const baseFieldClass = fourSecondsActive
    ? 'text-orange-950'
    : timesDivActive
      ? 'text-blue-950'
      : plusActive
        ? 'text-emerald-950'
        : minusActive
          ? 'text-rose-950'
          : useWaterLikeBackground
            ? 'text-sky-900'
            : useSunsetUiLight
              ? 'text-orange-950'
              : useForestUiLight
                ? 'text-amber-950'
                : useVioletUiLight
                  ? 'text-violet-950'
                  : useEmberUiLight
                    ? 'text-orange-950'
                    : useNeonUiLight
                      ? 'text-sky-100'
                      : useMidnightUiLight
                        ? 'text-slate-100'
                        : useRetroUiLight
                          ? 'text-amber-950'
                          : 'text-white'
  const mutedFieldClass = fourSecondsActive
    ? 'text-orange-800/45'
    : timesDivActive
      ? 'text-blue-800/45'
      : plusActive
        ? 'text-emerald-800/45'
        : minusActive
          ? 'text-rose-800/45'
          : useWaterLikeBackground
            ? 'text-sky-700/45'
            : useSunsetUiLight
              ? 'text-orange-900/45'
              : useForestUiLight
                ? 'text-amber-900/45'
                : useVioletUiLight
                  ? 'text-violet-900/45'
                  : useEmberUiLight
                    ? 'text-orange-900/45'
                    : useNeonUiLight
                      ? 'text-sky-200/40'
                      : useMidnightUiLight
                        ? 'text-slate-300/40'
                        : useRetroUiLight
                          ? 'text-amber-900/45'
                          : 'text-charcoal-muted'
  const showCurtain = presentation !== 'in-game' && presentation !== 'theme-test' && presentation !== 'tutorial'
  const curtainOpen = presentation === 'opening'
  const curtainInitialOpen = presentation === 'closing'

  const handleShare = async () => {
    const card = document.getElementById('share-card-template')
    if (!card || sharing) return
    setSharing(true)
    try {
      await shareScoreCardFromElement(card)
    } finally {
      setSharing(false)
    }
  }

  const createTutorialFinalOperation = useCallback((base: number, previous: Operation | null = null): Operation => {
    return generateOperation(base, 5, previous)
  }, [])

  const createTutorialModifierOperation = useCallback(
    (step: TutorialStep, base: number, previous: Operation | null = null): Operation => {
      if (step === 8) return generateFourSecondsOperation(base, previous)
      if (step === 9) return generateTimesDivOperation(base, 5, previous)
      if (step === 10) return generatePlusCycleOperation(base, previous)
      if (step === 11) {
        const safeBase = Math.max(2, base)
        const operation: Operation = {
          operator: '-',
          operand: Math.min(9, safeBase - 1),
          result: safeBase - Math.min(9, safeBase - 1),
        }
        return operation
      }
      return generateOperation(base, 5, previous)
    },
    [],
  )

  const createTutorialMinusToOneOperation = useCallback((base: number, stepsLeft: number): Operation => {
    const safeBase = Math.max(2, base)
    const rawOperand =
      stepsLeft <= 1 ? safeBase - 1 : Math.ceil((safeBase - 1) / Math.max(1, stepsLeft))
    const operand = Math.max(1, Math.min(9, Math.min(safeBase - 1, rawOperand)))
    return {
      operator: '-',
      operand,
      result: safeBase - operand,
    }
  }, [])

  const prepareTutorialModifierStep = useCallback(
    (step: TutorialStep) => {
      const initialBase = step === 8 ? 24 : step === 9 ? 36 : step === 10 ? 70 : 18
      const initialOperation =
        step === 11
          ? createTutorialMinusToOneOperation(initialBase, 5)
          : createTutorialModifierOperation(step, initialBase, null)
      setTutorialDemoBase(initialBase)
      setTutorialDemoOperation(initialOperation)
      setTutorialDemoAnswer(String(initialOperation.result))
      setTutorialDemoChangerRound(1)
    },
    [createTutorialMinusToOneOperation, createTutorialModifierOperation],
  )

  const prepareTutorialAutoCheckStep = useCallback(() => {
    setTutorialDemoBase(98)
    setTutorialDemoOperation({ operator: '÷', operand: 14, result: 7 })
    setTutorialDemoAnswer('')
    setTutorialAutoDemoCharge(1)
    setTutorialAutoDemoResolving(false)
  }, [])

  const prepareTutorialFinalChallengeStep = useCallback(() => {
    const initialBase = generateInitialBase(5)
    const initialOperation = createTutorialFinalOperation(initialBase, null)
    setTutorialFinalBase(initialBase)
    setTutorialFinalOperation(initialOperation)
    setTutorialFinalInput('')
    setTutorialFinalSolved(0)
    setTutorialFinalAutoChecks(0)
    setTutorialFinalShakeActive(false)
  }, [createTutorialFinalOperation])

  const resetTutorialState = useCallback(() => {
    setTutorialStep(0)
    setTutorialInput('')
    setTutorialDemoBase(24)
    setTutorialDemoOperation({ operator: '+', operand: 7, result: 31 })
    setTutorialDemoAnswer('31')
    setTutorialDemoScore(0)
    setTutorialDemoChangerRound(0)
    setTutorialAutoDemoCharge(1)
    setTutorialAutoDemoResolving(false)
    setTutorialStep5Resolving(false)
    setTutorialStep5ShakeActive(false)
    setTutorialFinalShakeActive(false)
    setTutorialDefeatTimerMs(4_000)
    setTutorialDefeatGameOver(false)

    const initialBase = generateInitialBase(5)
    const initialOperation = createTutorialFinalOperation(initialBase, null)
    setTutorialFinalBase(initialBase)
    setTutorialFinalOperation(initialOperation)
    setTutorialFinalInput('')
    setTutorialFinalSolved(0)
    setTutorialFinalAutoChecks(0)
    setTutorialCompletionResult(null)
  }, [createTutorialFinalOperation])

  const handlePlay = () => {
    if (presentation !== 'menu') return
    setExitConfirmOpen(false)
    setPendingStartMode('play')
    onPlayGameStart()
    setSharing(false)
    setPresentation('opening')
  }

  const handleBenchmark = () => {
    if (presentation !== 'menu') return
    setExitConfirmOpen(false)
    setPendingStartMode('benchmark')
    onPlayGameStart()
    setSharing(false)
    setPresentation('opening')
  }

  const handleThemeTest = () => {
    if (presentation !== 'menu') return
    setExitConfirmOpen(false)
    setPendingStartMode('theme-test')
    setThemeTestScore(99999)
    setThemeTestBurstFlash(null)
    setThemeTestBurstToken(0)
    setThemeTestChanger(null)
    setThemeTestChangerBurst(null)
    setThemeTestChangerBurstToken(0)
    setThemeTestAutoCheckEnabled(true)
    onPlayGameStart()
    setSharing(false)
    setPresentation('opening')
  }

  const handleTutorial = () => {
    if (presentation !== 'menu') return
    setExitConfirmOpen(false)
    setPendingStartMode('tutorial')
    setSharing(false)
    onPlayGameStart()
    resetTutorialState()
    setPresentation('opening')
  }

  const handleReturnToMenu = useCallback(() => {
    if (!isInGameScene) return
    setExitConfirmOpen(false)
    onPlayGoToMenu()
    onReturnToMenu()
    setSharing(false)
    setPresentation('closing')
  }, [isInGameScene, onPlayGoToMenu, onReturnToMenu])

  const closePlayerModal = useCallback(() => {
    setPlayerOpen(false)
    playUiClickAfterPaint(() => playSfx('clickClose', soundEnabled))
  }, [soundEnabled])

  const closeShopModal = useCallback(() => {
    setShopOpen(false)
    playUiClickAfterPaint(() => playSfx('clickClose', soundEnabled))
  }, [soundEnabled])

  const closeSettingsModal = useCallback(() => {
    setSettingsOpen(false)
    playUiClickAfterPaint(() => playSfx('clickClose', soundEnabled))
  }, [soundEnabled])

  const closeRewardedModal = useCallback(() => {
    setRewardedOpen(false)
    playUiClickAfterPaint(() => playSfx('clickClose', soundEnabled))
  }, [soundEnabled])

  const resetAvatarDraft = useCallback(() => {
    avatarDragRef.current = null
    setAvatarDragging(false)
    setAvatarDraftUrl(null)
    setAvatarDraftNaturalSize({ width: 0, height: 0 })
    setAvatarScale(1)
    setAvatarOffset({ x: 0, y: 0 })
  }, [])

  const clampAvatarOffset = useCallback((nextOffset: { x: number; y: number }, scaleValue: number) => {
    const viewport = avatarPreviewRef.current
    const image = avatarImageRef.current
    if (!viewport || !image) return nextOffset
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) return nextOffset

    const viewportSize = viewport.clientWidth
    if (viewportSize <= 0) return nextOffset

    const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight)
    const drawWidth = image.naturalWidth * baseScale * scaleValue
    const drawHeight = image.naturalHeight * baseScale * scaleValue
    const maxX = Math.max(0, (drawWidth - viewportSize) / 2)
    const maxY = Math.max(0, (drawHeight - viewportSize) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    }
  }, [])

  const closeAvatarPicker = useCallback(() => {
    setAvatarPickerOpen(false)
    playUiClickAfterPaint(() => playSfx('clickClose', soundEnabled))
  }, [soundEnabled])

  const closeAvatarCrop = useCallback(() => {
    avatarDragRef.current = null
    setAvatarDragging(false)
    setAvatarCropOpen(false)
    setAvatarScale(1)
    setAvatarOffset({ x: 0, y: 0 })
    playUiClickAfterPaint(() => playSfx('clickClose', soundEnabled))
  }, [soundEnabled])

  const openPlayerModal = useCallback(() => {
    setExitConfirmOpen(false)
    setPlayerOpen(true)
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick])

  const openAvatarPicker = useCallback(() => {
    setExitConfirmOpen(false)
    setAvatarPickerOpen(true)
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick])

  const requestAvatarSource = useCallback((source: 'gallery' | 'camera') => {
    setAvatarPickerOpen(false)
    const input = source === 'camera' ? avatarCameraInputRef.current : avatarGalleryInputRef.current
    if (!input) return
    input.value = ''
    window.setTimeout(() => input.click(), 0)
  }, [])

  const handleAvatarFilePicked = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (!dataUrl) return
      setAvatarDraftUrl(dataUrl)
      setAvatarDraftNaturalSize({ width: 0, height: 0 })
      setAvatarScale(1)
      setAvatarOffset({ x: 0, y: 0 })
      setAvatarCropOpen(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const removeAvatarPhoto = useCallback(() => {
    onSaveAvatarPhoto(null)
    setAvatarPickerOpen(false)
    resetAvatarDraft()
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick, onSaveAvatarPhoto, resetAvatarDraft])

  const onAvatarPreviewPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!avatarDraftUrl) return
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    avatarDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: avatarOffset.x,
      originY: avatarOffset.y,
    }
    setAvatarDragging(true)
  }, [avatarDraftUrl, avatarOffset.x, avatarOffset.y])

  const onAvatarPreviewPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = avatarDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const next = {
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    }
    setAvatarOffset(clampAvatarOffset(next, avatarScale))
  }, [avatarScale, clampAvatarOffset])

  const onAvatarPreviewPointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = avatarDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    avatarDragRef.current = null
    setAvatarDragging(false)
  }, [])

  const saveAvatarCrop = useCallback(() => {
    const image = avatarImageRef.current
    const viewport = avatarPreviewRef.current
    if (!image || !viewport || !avatarDraftUrl) return
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) return

    const viewportSize = viewport.clientWidth
    if (viewportSize <= 0) return

    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_EXPORT_SIZE
    canvas.height = AVATAR_EXPORT_SIZE
    const context = canvas.getContext('2d')
    if (!context) return

    const baseScale = Math.max(AVATAR_EXPORT_SIZE / image.naturalWidth, AVATAR_EXPORT_SIZE / image.naturalHeight)
    const drawWidth = image.naturalWidth * baseScale * avatarScale
    const drawHeight = image.naturalHeight * baseScale * avatarScale
    const previewToCanvas = AVATAR_EXPORT_SIZE / viewportSize
    const drawX = (AVATAR_EXPORT_SIZE - drawWidth) / 2 + avatarOffset.x * previewToCanvas
    const drawY = (AVATAR_EXPORT_SIZE - drawHeight) / 2 + avatarOffset.y * previewToCanvas

    context.fillStyle = '#000'
    context.fillRect(0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE)
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

    const avatarDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onSaveAvatarPhoto(avatarDataUrl)
    resetAvatarDraft()
    setAvatarCropOpen(false)
    playUiClickAfterPaint(onPlayClick)
  }, [avatarDraftUrl, avatarOffset.x, avatarOffset.y, avatarScale, onPlayClick, onSaveAvatarPhoto, resetAvatarDraft])

  const avatarPreviewBaseScale =
    avatarDraftNaturalSize.width > 0 && avatarDraftNaturalSize.height > 0
      ? Math.max(
          AVATAR_CROP_VIEWPORT_SIZE / avatarDraftNaturalSize.width,
          AVATAR_CROP_VIEWPORT_SIZE / avatarDraftNaturalSize.height,
        )
      : 1
  const avatarPreviewDrawWidth = avatarDraftNaturalSize.width * avatarPreviewBaseScale * avatarScale
  const avatarPreviewDrawHeight = avatarDraftNaturalSize.height * avatarPreviewBaseScale * avatarScale

  const openShopModal = useCallback(() => {
    setExitConfirmOpen(false)
    setShopOpen(true)
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick])

  const openSettingsModal = useCallback(() => {
    setExitConfirmOpen(false)
    setSettingsOpen(true)
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick])

  const openWeeklyChallengesModal = useCallback(() => {
    setExitConfirmOpen(false)
    setWeeklyChallengesOpen(true)
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick])

  const closeWeeklyChallengesModal = useCallback(() => {
    setWeeklyChallengesOpen(false)
    playUiClickAfterPaint(onPlayClick)
  }, [onPlayClick])

  const requestExitAppOrPreviousPage = useCallback(() => {
    const nav = navigator as Navigator & { app?: { exitApp?: () => void } }
    if (typeof nav.app?.exitApp === 'function') {
      nav.app.exitApp()
      return
    }
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    window.close()
  }, [])

  const handleBackRequest = useCallback((): 'consumed' | 'exit' => {
    if (avatarCropOpen) {
      closeAvatarCrop()
      return 'consumed'
    }
    if (avatarPickerOpen) {
      closeAvatarPicker()
      return 'consumed'
    }
    if (playerOpen) {
      closePlayerModal()
      return 'consumed'
    }
    if (shopOpen) {
      closeShopModal()
      return 'consumed'
    }
    if (settingsOpen) {
      closeSettingsModal()
      return 'consumed'
    }
    if (rewardedOpen) {
      closeRewardedModal()
      return 'consumed'
    }
    if (timeoutModalOpen) {
      onDeclineAutoCheckAtTimeout()
      return 'consumed'
    }
    if (presentation !== 'menu') {
      handleReturnToMenu()
      return 'consumed'
    }
    if (!exitConfirmOpen) {
      setExitConfirmOpen(true)
      return 'consumed'
    }
    return 'exit'
  }, [
    avatarCropOpen,
    avatarPickerOpen,
    playerOpen,
    shopOpen,
    settingsOpen,
    rewardedOpen,
    timeoutModalOpen,
    presentation,
    exitConfirmOpen,
    closeAvatarCrop,
    closeAvatarPicker,
    closePlayerModal,
    closeShopModal,
    closeSettingsModal,
    closeRewardedModal,
    onDeclineAutoCheckAtTimeout,
    handleReturnToMenu,
  ])

  const handlePlayAgain = () => {
    if (presentation !== 'in-game' || session.phase !== 'game_over') return
    onPlayGameStart()
    setSharing(false)
    onStart()
  }

  const handleThemeTestFieldClick = () => {
    if (!isThemeTestScene) return
    onPlayClick()
    setThemeTestScore((previous) => {
      const next = previous + 100
      if (next >= 200) {
        setThemeTestBurstFlash(5)
        setThemeTestBurstToken((token) => token + 1)
      }
      return next
    })
  }

  const handleThemeTestChangerToggle = (variant: RightCardVariant) => {
    playSfx('gameChanger', soundEnabled)
    const activating = themeTestChanger !== variant
    setThemeTestChanger(themeTestChanger === variant ? null : variant)
    if (activating) {
      setThemeTestChangerBurst(variant)
      setThemeTestChangerBurstToken((token) => token + 1)
    }
  }

  const handleThemeTestChangerBurstComplete = useCallback(() => {
    setThemeTestChangerBurst(null)
  }, [])

  const handleThemeTestAutoCheckToggle = () => {
    playSfx('autoCheck', soundEnabled)
    setThemeTestAutoCheckEnabled((current) => !current)
  }

  const handleThemeTestKeypadDigit = () => {
    if (!isThemeTestScene) return
    onPlayWriteKey()
    // Theme Test não altera o input principal; apenas feedback visual/sonoro.
  }

  const handleThemeTestKeypadBackspace = () => {
    if (!isThemeTestScene) return
    onPlayEraseKey()
  }

  const handleThemeTestKeypadEnter = () => {
    if (!isThemeTestScene) return
    playSfx('success', soundEnabled)
  }

  const handleThemeTestKeypadAuto = () => {
    if (!isThemeTestScene) return
    handleThemeTestAutoCheckToggle()
  }

  const resolveTutorialFinalAnswer = useCallback(() => {
    if (!isTutorialScene || tutorialStep !== 17) return
    const trimmed = tutorialFinalInput.trim()
    if (trimmed.length === 0) return
    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isNaN(parsed) || parsed !== tutorialFinalOperation.result) {
      playSfx('error', soundEnabled)
      setShakeKey((key) => key + 1)
      setTutorialFinalInput('')
      setTutorialFinalShakeActive(true)
      window.setTimeout(() => {
        setTutorialFinalShakeActive(false)
      }, SUBMIT_LOCK_MS)
      return
    }

    const nextSolved = tutorialFinalSolved + 1
    setTutorialFinalSolved(nextSolved)
    setTutorialFinalInput('')

    if (nextSolved >= TUTORIAL_FINAL_TARGET) {
      playSfx('record', soundEnabled)
      if (tutorialCompletionResult === null) {
        setTutorialCompletionResult(onCompleteTutorial())
      }
      setTutorialStep(18)
      return
    }

    playSfx('success', soundEnabled)
    const nextBase = tutorialFinalOperation.result
    const nextOperation = createTutorialFinalOperation(nextBase, tutorialFinalOperation)
    setTutorialFinalBase(nextBase)
    setTutorialFinalOperation(nextOperation)
  }, [
    createTutorialFinalOperation,
    isTutorialScene,
    onCompleteTutorial,
    soundEnabled,
    tutorialCompletionResult,
    tutorialFinalInput,
    tutorialFinalOperation,
    tutorialFinalSolved,
    tutorialStep,
  ])

  const handleTutorialDigit = useCallback((digit: string) => {
    if (!isTutorialScene) return
    if (tutorialStep === 5) {
      const next = `${tutorialInput}${digit}`.replace(/\D/g, '').slice(0, 2)
      setTutorialInput(next)
      onPlayWriteKey()
      return
    }
    if (tutorialStep !== 17) return
    const next = `${tutorialFinalInput}${digit}`.replace(/\D/g, '').slice(0, 2)
    setTutorialFinalInput(next)
    onPlayWriteKey()
  }, [isTutorialScene, onPlayWriteKey, tutorialFinalInput, tutorialInput, tutorialStep])

  const handleTutorialBackspace = useCallback(() => {
    if (!isTutorialScene) return
    if (tutorialStep === 5) {
      setTutorialInput((current) => current.slice(0, -1))
      onPlayEraseKey()
      return
    }
    if (tutorialStep !== 17) return
    setTutorialFinalInput((current) => current.slice(0, -1))
    onPlayEraseKey()
  }, [isTutorialScene, onPlayEraseKey, tutorialStep])

  const handleTutorialAutoCheck = useCallback(() => {
    if (!isTutorialScene) return

    if (tutorialStep === 15) {
      if (tutorialAutoDemoCharge <= 0 || tutorialAutoDemoResolving) return
      setTutorialAutoDemoCharge(0)
      setTutorialAutoDemoResolving(true)
      setTutorialDemoAnswer(String(tutorialDemoOperation.result))
      playSfx('autoCheck', soundEnabled)

      const nextBase = tutorialDemoOperation.result
      const nextOperation = generateOperation(nextBase, 5, tutorialDemoOperation)
      window.setTimeout(() => {
        setTutorialDemoBase(nextBase)
        setTutorialDemoOperation(nextOperation)
        setTutorialDemoAnswer('')
      }, 260)

      window.setTimeout(() => {
        setTutorialAutoDemoResolving(false)
        setTutorialStep(16)
      }, 920)
      return
    }

    if (tutorialStep !== 17 || tutorialFinalAutoChecks <= 0) return
    setTutorialFinalAutoChecks(0)
    setTutorialFinalInput(String(tutorialFinalOperation.result))
    playSfx('autoCheck', soundEnabled)
  }, [
    isTutorialScene,
    soundEnabled,
    tutorialAutoDemoCharge,
    tutorialAutoDemoResolving,
    tutorialDemoOperation,
    tutorialFinalAutoChecks,
    tutorialFinalOperation.result,
    tutorialStep,
  ])

  const handleTutorialEnter = useCallback(() => {
    if (tutorialStep === 17) {
      resolveTutorialFinalAnswer()
      return
    }
    if (tutorialStep !== 5 || tutorialStep5Resolving) return
    if (tutorialInput !== '7') {
      playSfx('error', soundEnabled)
      setTutorialInput('')
      setTutorialStep5ShakeActive(true)
      setShakeKey((key) => key + 1)
      window.setTimeout(() => {
        setTutorialStep5ShakeActive(false)
      }, SUBMIT_LOCK_MS)
      return
    }

    playSfx('success', soundEnabled)
    const nextBase = 7
    const nextOperation = generateOperation(nextBase, 1, null)
    setTutorialDemoBase(nextBase)
    setTutorialDemoOperation(nextOperation)
    setTutorialDemoAnswer('')
    setTutorialInput('')
    setTutorialStep5ShakeActive(false)
    setTutorialStep5Resolving(true)

    window.setTimeout(() => {
      setTutorialStep5Resolving(false)
      setTutorialDefeatTimerMs(4_000)
      setTutorialDefeatGameOver(false)
      setTutorialStep(6)
    }, 420)
  }, [
    resolveTutorialFinalAnswer,
    soundEnabled,
    tutorialInput,
    tutorialStep,
    tutorialStep5Resolving,
  ])

  const advanceTutorialStep = useCallback(() => {
    if (!isTutorialScene) return
    if (tutorialStep === 17 && tutorialFinalSolved < TUTORIAL_FINAL_TARGET) return

    playSfx('success', soundEnabled)

    if (tutorialStep === 18) {
      handleReturnToMenu()
      return
    }

    const nextStep = Math.min(18, tutorialStep + 1) as TutorialStep
    if (nextStep >= 8 && nextStep <= 11) {
      prepareTutorialModifierStep(nextStep)
    }
    if (nextStep >= 12 && nextStep <= 15) {
      prepareTutorialAutoCheckStep()
    }
    if (nextStep === 17) {
      prepareTutorialFinalChallengeStep()
    }
    setTutorialStep(nextStep)
  }, [
    handleReturnToMenu,
    isTutorialScene,
    prepareTutorialAutoCheckStep,
    prepareTutorialFinalChallengeStep,
    prepareTutorialModifierStep,
    soundEnabled,
    tutorialFinalSolved,
    tutorialStep,
  ])

  useEffect(() => {
    if (!isTutorialScene || tutorialStep !== 6 || tutorialDefeatGameOver) return

    const timeout = window.setTimeout(() => {
      const next = Math.max(0, tutorialDefeatTimerMs - 100)
      setTutorialDefeatTimerMs(next)
      if (next <= 0) {
        playSfx('gameOver', soundEnabled)
        setTutorialDefeatGameOver(true)
      }
    }, 100)

    return () => window.clearTimeout(timeout)
  }, [isTutorialScene, soundEnabled, tutorialDefeatGameOver, tutorialDefeatTimerMs, tutorialStep])

  useEffect(() => {
    if (!isTutorialScene || tutorialStep < 8 || tutorialStep > 11) return
    if (tutorialDemoChangerRound >= 5) return

    const timeout = window.setTimeout(() => {
      const nextRound = tutorialDemoChangerRound + 1
      const nextBase = tutorialDemoOperation.result
      const nextOperation =
        tutorialStep === 11
          ? createTutorialMinusToOneOperation(nextBase, 6 - nextRound)
          : createTutorialModifierOperation(tutorialStep, nextBase, tutorialDemoOperation)
      setTutorialDemoBase(nextBase)
      setTutorialDemoOperation(nextOperation)
      setTutorialDemoAnswer(String(nextOperation.result))
      setTutorialDemoScore((score) => score + 10)
      setTutorialDemoChangerRound(nextRound)
    }, 650)

    return () => window.clearTimeout(timeout)
  }, [
    createTutorialMinusToOneOperation,
    createTutorialModifierOperation,
    isTutorialScene,
    tutorialDemoChangerRound,
    tutorialDemoOperation,
    tutorialStep,
  ])

  useEffect(() => {
    if (!showMenuChrome) return
    preloadGameplayModals()
  }, [showMenuChrome])

  useEffect(() => {
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousOverscrollBehavior = body.style.overscrollBehavior

    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = previousOverflow
      body.style.overscrollBehavior = previousOverscrollBehavior
    }
  }, [])

  useEffect(() => {
    if (presentation !== 'opening' || pendingStartMode === null) return

    const mode = pendingStartMode
    const enterDuration = mode === 'theme-test' ? THEME_TEST_ENTER_DURATION_MS : ENTER_DURATION_MS
    const timeout = window.setTimeout(() => {
      if (mode === 'benchmark') {
        onStartBenchmarkSessionRef.current()
        setPresentation('in-game')
      } else if (mode === 'tutorial') {
        setPresentation('tutorial')
      } else if (mode === 'theme-test') {
        setPresentation('theme-test')
      } else {
        onStartRef.current()
        setPresentation('in-game')
      }
      setPendingStartMode(null)
    }, enterDuration)

    return () => window.clearTimeout(timeout)
  }, [presentation, pendingStartMode])

  useEffect(() => {
    if (presentation !== 'closing') return

    const timeout = window.setTimeout(() => {
      setPresentation((current) => (current === 'closing' ? 'menu' : current))
    }, CLOSE_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [presentation])

  useEffect(() => {
    if (themeTestBurstFlash === null) return
    const timeout = window.setTimeout(() => {
      setThemeTestBurstFlash(null)
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [themeTestBurstFlash])

  useEffect(() => {
    if (!session.isSubmitLocked || session.phase !== 'playing') return

    const frame = requestAnimationFrame(() => {
      setShakeKey((key) => key + 1)
    })

    return () => cancelAnimationFrame(frame)
  }, [session.isSubmitLocked, session.phase])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (benchmarkModeRef.current || phaseRef.current !== 'playing' || submitLockedRef.current) return

      if (event.key >= '0' && event.key <= '9') {
        if (inputDisabledRef.current) return
        event.preventDefault()
        const nextValue = `${inputValueRef.current}${event.key}`
        inputValueRef.current = nextValue
        onPlayWriteKeyRef.current()
        onInputChangeRef.current(nextValue)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        onConfirmRef.current()
      }
      if (event.key === 'Backspace') {
        if (inputDisabledRef.current || inputValueRef.current.length === 0) return
        event.preventDefault()
        const nextValue = inputValueRef.current.slice(0, -1)
        inputValueRef.current = nextValue
        onPlayEraseKeyRef.current()
        onInputChangeRef.current(nextValue)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!backTrapInitializedRef.current) {
      window.history.pushState({ projectMathBackTrap: true }, '', window.location.href)
      backTrapInitializedRef.current = true
    }

    const onPopState = () => {
      if (backNavigationBypassRef.current) {
        backNavigationBypassRef.current = false
        return
      }

      const action = handleBackRequest()
      if (action === 'exit') {
        backNavigationBypassRef.current = true
        requestExitAppOrPreviousPage()
        return
      }

      window.history.pushState({ projectMathBackTrap: true }, '', window.location.href)
    }

    const onHardwareBack = (event: Event) => {
      event.preventDefault?.()
      const action = handleBackRequest()
      if (action === 'exit') {
        requestExitAppOrPreviousPage()
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('backbutton', onHardwareBack)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('backbutton', onHardwareBack)
    }
  }, [handleBackRequest, requestExitAppOrPreviousPage])

  const themeTestOperation: Operation = { operator: '+', operand: 7, result: 31 }
  const tutorialChangerVariant: RightCardVariant | null =
    tutorialStep === 8
      ? 'timer'
      : tutorialStep === 9
        ? 'mult-div'
        : tutorialStep === 10
          ? 'cap-up'
          : tutorialStep === 11
            ? 'cap-down'
            : null
  const activeChangerTheme: PlayStackChangerTheme | null = fourSecondsActive
    ? 'four-seconds'
    : timesDivActive
      ? 'times-div'
      : plusActive
        ? 'plus-cycle'
        : minusActive
          ? 'minus-cycle'
          : null
  const tutorialActiveChangerTheme: PlayStackChangerTheme | null =
    tutorialChangerVariant === 'timer'
      ? 'four-seconds'
      : tutorialChangerVariant === 'mult-div'
        ? 'times-div'
        : tutorialChangerVariant === 'cap-up'
          ? 'plus-cycle'
          : tutorialChangerVariant === 'cap-down'
            ? 'minus-cycle'
            : null
  const tutorialNextDisabled = tutorialStep === 17 && tutorialFinalSolved < TUTORIAL_FINAL_TARGET
  const tutorialNextLabel = tutorialStep === 18 ? 'Concluir' : 'OK'
  const tutorialStatusLine =
    tutorialStep === 17
      ? `${tutorialFinalSolved}/${TUTORIAL_FINAL_TARGET} contas`
      : null
  const tutorialDefeatRatio = Math.max(0, Math.min(1, tutorialDefeatTimerMs / 4_000))
  const tutorialDisplayTimerRatio = tutorialStep === 6 ? tutorialDefeatRatio : 1
  const tutorialDefeatUrgent = tutorialDefeatRatio < 0.25
  const tutorialDefeatNearDeath = tutorialDefeatRatio < 0.2
  const tutorialDisplayBase =
    tutorialStep === 17
      ? tutorialFinalBase
      : tutorialStep === 0
        ? ''
        : tutorialStep <= 4
        ? 5
        : tutorialStep === 5
          ? tutorialStep5Resolving
            ? tutorialDemoBase
            : 5
          : tutorialDemoBase
  const tutorialDisplayOperation: Operation | null =
    tutorialStep === 17
      ? tutorialFinalOperation
      : tutorialStep === 0
        ? null
        : tutorialStep <= 4
        ? ({ operator: '+', operand: 2, result: 7 } as Operation)
        : tutorialStep === 5
          ? tutorialStep5Resolving
            ? tutorialDemoOperation
            : ({ operator: '+', operand: 2, result: 7 } as Operation)
          : tutorialDemoOperation
  const tutorialDisplayAnswer =
    tutorialStep === 17
      ? tutorialFinalInput
      : tutorialStep <= 4
        ? ''
        : tutorialStep === 5
          ? tutorialStep5Resolving
            ? ''
            : tutorialInput
          : tutorialDemoAnswer
  const basePlayStackClass = useWaterLikeBackground
    ? 'game-play-stack--water'
    : useSunsetBackground
      ? 'game-play-stack--sunset'
      : useForestBackground
        ? 'game-play-stack--forest'
        : useVioletBackground
          ? 'game-play-stack--violet'
          : useEmberBackground
            ? 'game-play-stack--ember'
            : useNeonBackground
              ? 'game-play-stack--neon'
              : useMidnightBackground
                ? 'game-play-stack--midnight'
                : useRetroBackground
                  ? 'game-play-stack--retro'
                  : 'bg-charcoal-field'

  const sceneRootClassName = [
    'game-scene-root relative flex h-dvh min-h-dvh max-h-dvh flex-col overflow-hidden text-white transition-colors duration-500',
    sceneThemeClass,
    ambientDecorPaused ? 'game-scene-root--ambient-decor-paused' : '',
    modalDecorPaused ? 'game-scene-root--modal-decor-paused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const sceneBgAnimate = ambientDecorPaused
    ? SCENE_BG_STATIC
    : isInGameScene
      ? SCENE_BG_INGAME
      : SCENE_BG_MENU
  const sceneBgTransition = ambientDecorPaused ? { duration: 0 } : layerParallaxTransition

  return (
    <div ref={sceneRootRef} className={sceneRootClassName}>
      <TimerDangerOverlay
        isPlaying={isPlaying}
        timerMaxMs={session.timerMaxMs}
        fallbackTimerMs={session.timerMs}
      />
      <motion.div
        className="game-scene-bg-layer pointer-events-none absolute inset-0 z-0"
        initial={false}
        animate={sceneBgAnimate}
        transition={sceneBgTransition}
      >
        {useWaterBackground && <WaterSceneLayer paused={ambientDecorPaused} />}
      </motion.div>

      {showGameContent && (
        <motion.div
          className="relative z-10 mx-auto flex h-full w-full max-w-md flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={sceneEnterTransition}
          style={{ willChange: presentation === 'opening' ? 'transform' : 'auto' }}
        >
          <motion.header
            className={headerThemeClass}
            initial={{ opacity: 0, x: 10, y: -12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ ...layerParallaxTransition, delay: 0.04 }}
          >
            <div className="game-scene-header-bar relative">
                {isInGameScene ? (
                  <div className="game-header-left-dock">
                    {!isTutorialScene && (
                      <span className={`game-player-level-badge game-player-level-badge--${player.equippedBadgeId}`}>
                        Nível {playerLevel}
                      </span>
                    )}
                    <AnimatedGameMenuButton
                      onClick={handleReturnToMenu}
                    />
                  </div>
                ) : (
                  <div aria-hidden />
                )}

                <div className="game-header-center-dock">
                  <AnimatePresence mode="wait" initial={false}>
                    {isPlaying && (
                      <motion.p
                        key="header-elapsed"
                        className="game-header-center-dock__elapsed text-center font-mono text-sm font-medium tabular-nums text-charcoal-muted"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ElapsedTimeLabel fallbackMs={session.elapsedMs} />
                      </motion.p>
                    )}
                    {isGameOver && !benchmarkMode && (
                      <motion.div
                        key="header-play-again"
                        className="game-header-center-dock__slot game-header-center-dock__slot--play"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <MenuHudInlineButton
                          label="Jogar novamente"
                          variant="accent"
                          onClick={handlePlayAgain}
                          fill
                        >
                          <span className="scale-75">
                            <IconPlay />
                          </span>
                        </MenuHudInlineButton>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="game-header-score-dock">
                  {!isGameOver && !isTutorialScene && (
                    <>
                      <p className="text-xs uppercase tracking-widest text-charcoal-muted">Pontuação</p>
                      <div className="game-header-score-dock__value">
                        <AnimatePresence mode="sync" initial={false}>
                          <motion.p
                            key={currentScore}
                            className="game-header-score-dock__number"
                            initial={{ y: '100%', opacity: 0.5 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '-100%', opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          >
                            {currentScore}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              </div>
          </motion.header>

          <motion.main
            className="mt-5 flex min-h-0 flex-1 flex-col items-center gap-4"
            initial={{ opacity: 0, x: -8, y: 14 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ ...layerParallaxTransition, delay: 0.08 }}
          >
            {isTutorialScene ? (
              <>
                {tutorialStep === 6 && tutorialDefeatGameOver ? (
                  <div className="w-full max-w-xs">
                    <div
                      className={`game-over-card flex h-[calc(14.5rem+3px)] w-full items-center justify-center rounded-2xl p-4 text-center ${
                        useWaterLikeBackground
                          ? 'game-over-card--water'
                          : useSunsetBackground
                            ? 'game-over-card--sunset'
                            : 'game-over-card--default'
                      }`}
                    >
                      <p className="game-over-card__score text-center text-xl font-bold">Fim de jogo</p>
                    </div>
                  </div>
                ) : tutorialStep === 18 ? (
                  <div className="w-full max-w-xs">
                    <div
                      className={`game-over-card flex h-[calc(14.5rem+3px)] w-full flex-col items-center justify-center rounded-2xl p-4 text-center ${
                        useWaterLikeBackground
                          ? 'game-over-card--water'
                          : useSunsetBackground
                            ? 'game-over-card--sunset'
                            : 'game-over-card--default'
                      }`}
                    >
                      <p className="game-over-card__score text-center font-mono text-2xl font-bold">
                        Tutorial completado.
                      </p>
                      <div className="mt-2 text-sm font-semibold">
                        {tutorialCompletionResult?.rewardsGranted ? (
                          <>
                            <span className="game-over-reward-xp">+{tutorialCompletionResult.xpGained} XP</span>
                            <span className="game-over-reward-sep mx-2">•</span>
                            <span className="game-over-reward-coins">+{tutorialCompletionResult.coinsGained} moedas</span>
                          </>
                        ) : (
                          <span className="game-over-card__meta">Recompensas coletadas.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <PlayFieldsSideLayout
                    autoCheckCycleStep={tutorialStep >= 12 && tutorialStep <= 15 ? 0 : null}
                    fourSecondsCycleStep={tutorialStep === 8 ? 0 : null}
                    fourSecondsGameChangerRemaining={tutorialStep === 8 ? Math.max(0, 5 - tutorialDemoChangerRound) : 0}
                    timesDivCycleStep={tutorialStep === 9 ? 0 : null}
                    timesDivGameChangerRemaining={tutorialStep === 9 ? Math.max(0, 5 - tutorialDemoChangerRound) : 0}
                    plusCycleStep={tutorialStep === 10 ? 0 : null}
                    plusGameChangerActive={tutorialStep === 10}
                    minusCycleStep={tutorialStep === 11 ? 0 : null}
                    minusGameChangerActive={tutorialStep === 11}
                    answerFieldRef={answerFieldRef}
                    parallaxActive={parallaxLayerActive}
                  >
                    <PlayFieldsFrame
                      level={tutorialStep === 17 ? 5 : 1}
                      levelUpFlash={null}
                      burstScore={tutorialStep === 17 ? tutorialFinalSolved * 10 : tutorialDemoScore}
                      waterLight
                      borderActive
                    >
                      <div className="relative">
                        <PlayStackWithChangerBg
                          baseClassName="game-play-stack--water"
                          activeChangerTheme={tutorialActiveChangerTheme}
                          instantSwitch={tutorialStep >= 8 && tutorialStep <= 11}
                        >
                          <div
                            className={`game-play-stack__divider border-b px-3 py-4 text-center ${
                              tutorialStep === 1 ? 'game-tutorial-field-pulse' : ''
                            }`}
                          >
                            <SlideValue
                              value={tutorialDisplayBase}
                              slotClassName="h-14"
                              className={`text-5xl font-bold ${
                                tutorialActiveChangerTheme === 'four-seconds'
                                  ? 'text-orange-950'
                                  : tutorialActiveChangerTheme === 'times-div'
                                    ? 'text-blue-950'
                                    : tutorialActiveChangerTheme === 'plus-cycle'
                                      ? 'text-emerald-950'
                                      : tutorialActiveChangerTheme === 'minus-cycle'
                                        ? 'text-rose-950'
                                        : 'text-sky-900'
                              }`}
                              shakeActive={false}
                              shakeKey={shakeKey}
                            />
                          </div>
                          <div
                            className={`game-play-stack__divider border-b px-3 py-3 text-center ${
                              tutorialStep === 2 ? 'game-tutorial-field-pulse' : ''
                            }`}
                          >
                            {tutorialDisplayOperation ? (
                              <OperationValue
                                operation={tutorialDisplayOperation}
                                slotClassName="h-10"
                                waterLight
                                fourSecondsLight={tutorialActiveChangerTheme === 'four-seconds'}
                                timesDivLight={tutorialActiveChangerTheme === 'times-div'}
                                plusLight={tutorialActiveChangerTheme === 'plus-cycle'}
                                minusLight={tutorialActiveChangerTheme === 'minus-cycle'}
                              />
                            ) : (
                              <div className="h-10" />
                            )}
                          </div>
                          <AnswerDisplay
                            value={tutorialDisplayAnswer}
                            disabled={false}
                          shake={
                            (tutorialStep === 5 && tutorialStep5ShakeActive) ||
                            (tutorialStep === 17 && tutorialFinalShakeActive)
                          }
                            shakeKey={shakeKey}
                            answerFlash={null}
                            answerFlashAuto={false}
                            flashKey={tutorialDemoScore + tutorialFinalSolved}
                            perfectAnswerToken={0}
                            waterLight
                            fourSecondsLight={tutorialActiveChangerTheme === 'four-seconds'}
                            timesDivLight={tutorialActiveChangerTheme === 'times-div'}
                            plusLight={tutorialActiveChangerTheme === 'plus-cycle'}
                            minusLight={tutorialActiveChangerTheme === 'minus-cycle'}
                            pulse={tutorialStep === 3}
                            slotRef={answerFieldRef}
                          />
                        </PlayStackWithChangerBg>
                        {tutorialStep === 0 ? <div className="game-tutorial-fields-disabled-overlay" aria-hidden /> : null}
                      </div>
                    </PlayFieldsFrame>
                  </PlayFieldsSideLayout>
                )}

                <div className="game-play-controls flex w-full max-w-xs flex-col gap-3">
                  {tutorialStep !== 18 ? (
                    <div
                      className={`h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated${
                        !tutorialDefeatGameOver && tutorialStep === 6 && tutorialDefeatNearDeath
                          ? ' timer-bar-shell--near-death'
                          : ''
                      }`}
                      style={
                        !tutorialDefeatGameOver && tutorialStep === 6 && tutorialDefeatNearDeath
                          ? {
                              boxShadow:
                                '0 0 0 1px rgba(251,113,133,0.22), 0 0 14px -4px rgba(251,113,133,0.58), 0 0 24px -10px rgba(251,113,133,0.7)',
                            }
                          : undefined
                      }
                    >
                      <div
                        className="timer-bar-fill relative h-full rounded-full"
                        style={{ width: `${tutorialDisplayTimerRatio * 100}%` }}
                      >
                        <div
                          className={`h-full w-full rounded-full ${
                            tutorialStep === 6 && tutorialDefeatUrgent
                              ? 'bg-gradient-to-r from-rose-700 via-rose-500 to-rose-300'
                              : 'bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200'
                          }`}
                        />
                        {tutorialStep === 6 && tutorialDefeatRatio > 0.015 && !tutorialDefeatGameOver ? (
                          <>
                            <span
                              className={`timer-spark-trail pointer-events-none absolute right-1 top-0 h-full w-5 bg-gradient-to-l to-transparent ${
                                tutorialDefeatUrgent ? 'from-rose-200/70' : 'from-white/45'
                              }${tutorialDefeatNearDeath ? ' timer-spark--near-death' : ' timer-spark--urgent'}`}
                              aria-hidden
                            />
                            <span
                              className={`timer-spark-dot pointer-events-none absolute right-0 top-1/2 z-10 h-2 w-2 rounded-full ${
                                tutorialDefeatUrgent ? 'bg-rose-50' : 'bg-white'
                              }${tutorialDefeatNearDeath ? ' timer-spark--near-death' : ' timer-spark--urgent'}`}
                              aria-hidden
                            />
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {(tutorialStep === 5 && !tutorialStep5Resolving) ||
                  tutorialStep === 15 ||
                  tutorialStep === 17 ? (
                    <NumericKeypad
                      disabled={!(tutorialStep === 5 || tutorialStep === 15 || tutorialStep === 17)}
                      interactionLocked={!(tutorialStep === 5 || tutorialStep === 15 || tutorialStep === 17)}
                      autoCheckOnly={tutorialStep === 15}
                      backspaceDisabled={
                        tutorialStep === 5
                          ? tutorialInput.length === 0
                          : tutorialStep === 17
                            ? tutorialFinalInput.length === 0
                            : true
                      }
                      autoCheckCharges={
                        tutorialStep === 17
                          ? tutorialFinalAutoChecks
                          : tutorialStep === 15
                            ? tutorialAutoDemoCharge
                            : 0
                      }
                      virtualPress={null}
                      onDigit={handleTutorialDigit}
                      onBackspace={handleTutorialBackspace}
                      onAutoCorrect={handleTutorialAutoCheck}
                      onEnter={handleTutorialEnter}
                    />
                  ) : null}
                  {tutorialStep !== 5 && tutorialStep !== 15 && tutorialStep !== 17 && tutorialStep !== 18 ? (
                    <div className="game-tutorial-balloon rounded-xl border border-sky-200/60 bg-white/90 p-3 text-sky-950 shadow-lg">
                    <p className="text-sm font-semibold">{TUTORIAL_MESSAGES[tutorialStep]}</p>
                    {tutorialStatusLine ? (
                      <p className="mt-1 text-xs text-sky-800/80">{tutorialStatusLine}</p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={advanceTutorialStep}
                        disabled={tutorialNextDisabled}
                        className="game-btn-push game-btn-push-secondary rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {tutorialNextLabel}
                      </button>
                      <button
                        type="button"
                        onClick={handleReturnToMenu}
                        className="game-btn-push game-btn-push-secondary rounded-lg bg-charcoal-elevated px-3 py-2 text-xs font-semibold tracking-wide text-stone-100"
                      >
                        Pular tutorial
                      </button>
                    </div>
                  </div>
                  ) : null}
                  {tutorialStep === 18 ? (
                    <button
                      type="button"
                      onClick={handleReturnToMenu}
                      className={`game-btn-push game-btn-push-secondary rounded-lg px-3 py-2 text-xs font-semibold tracking-wide ${
                        useWaterLikeBackground
                          ? 'bg-sky-700 text-white'
                          : useSunsetBackground
                            ? 'bg-orange-700 text-orange-50'
                            : 'bg-charcoal-elevated text-stone-100'
                      }`}
                    >
                      Concluir
                    </button>
                  ) : null}
                </div>
              </>
            ) : isThemeTestScene ? (
              <ThemeTestSideLayout
                activeChanger={themeTestChanger}
                changerBurst={themeTestChangerBurst}
                changerBurstToken={themeTestChangerBurstToken}
                autoCheckEnabled={themeTestAutoCheckEnabled}
                onToggleAutoCheck={handleThemeTestAutoCheckToggle}
                onToggleChanger={handleThemeTestChangerToggle}
                onChangerBurstComplete={handleThemeTestChangerBurstComplete}
                parallaxActive={parallaxLayerActive}
              >
                <PlayFieldsFrame
                  level={5}
                  levelUpFlash={themeTestBurstFlash}
                  burstScore={themeTestBurstToken}
                  waterLight={useLightBackground}
                  borderActive
                >
                  <PlayStackWithChangerBg
                    baseClassName={basePlayStackClass}
                    activeChangerTheme={activeChangerTheme}
                  >
                    <button
                      type="button"
                      onClick={handleThemeTestFieldClick}
                      className="game-play-stack__divider block w-full border-b px-3 py-4 text-center"
                    >
                      <SlideValue
                        value={24}
                        slotClassName="h-14"
                        className={`text-5xl font-bold ${baseFieldClass}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleThemeTestFieldClick}
                      className="game-play-stack__divider block w-full border-b px-3 py-3 text-center"
                    >
                      <OperationValue
                        operation={themeTestOperation}
                        slotClassName="h-10"
                        waterLight={useWaterLikeBackground}
                        sunsetLight={useSunsetUiLight}
                        forestLight={useForestUiLight}
                        violetLight={useVioletUiLight}
                        emberLight={useEmberUiLight}
                        neonLight={useNeonUiLight}
                        midnightLight={useMidnightUiLight}
                        retroLight={useRetroUiLight}
                        fourSecondsLight={fourSecondsActive}
                        timesDivLight={timesDivActive}
                        plusLight={plusActive}
                        minusLight={minusActive}
                      />
                    </button>

                    <button type="button" onClick={handleThemeTestFieldClick} className="block w-full text-left">
                      <AnswerDisplay
                        value="31"
                        disabled={false}
                        shake={false}
                        answerFlash={null}
                        answerFlashAuto={false}
                        flashKey={themeTestScore}
                        perfectAnswerToken={0}
                        waterLight={useWaterLikeBackground}
                        sunsetLight={useSunsetUiLight}
                        forestLight={useForestUiLight}
                        violetLight={useVioletUiLight}
                        emberLight={useEmberUiLight}
                        neonLight={useNeonUiLight}
                        midnightLight={useMidnightUiLight}
                        retroLight={useRetroUiLight}
                        fourSecondsLight={fourSecondsActive}
                        timesDivLight={timesDivActive}
                        plusLight={plusActive}
                        minusLight={minusActive}
                      />
                    </button>
                  </PlayStackWithChangerBg>
                </PlayFieldsFrame>
              </ThemeTestSideLayout>
            ) : !showBenchmarkResults ? (
              <PlayFieldsSideLayout
                autoCheckCycleStep={session.autoCheckCycleStep}
                fourSecondsCycleStep={session.fourSecondsCycleStep}
                fourSecondsGameChangerRemaining={session.fourSecondsGameChangerRemaining}
                timesDivCycleStep={session.timesDivCycleStep}
                timesDivGameChangerRemaining={session.timesDivGameChangerRemaining}
                plusCycleStep={session.plusCycleStep}
                plusGameChangerActive={session.plusGameChangerActive}
                minusCycleStep={session.minusCycleStep}
                minusGameChangerActive={session.minusGameChangerActive}
                answerFieldRef={answerFieldRef}
                parallaxActive={parallaxLayerActive}
              >
                <PlayFieldsFrame
                  level={session.rhythmLevel}
                  levelUpFlash={session.rhythmLevelUpFlash}
                  burstScore={session.score}
                  waterLight={useLightBackground}
                  borderActive={isPlaying}
                >
                  <PlayStackWithChangerBg
                    baseClassName={basePlayStackClass}
                    activeChangerTheme={activeChangerTheme}
                  >
                    <div className="game-play-stack__divider border-b px-3 py-4 text-center">
                      {isPlaying || isGameOver ? (
                        <SlideValue
                          value={session.baseNumber}
                          slotClassName="h-14"
                          className={`text-5xl font-bold ${baseFieldClass}`}
                          shakeActive={session.isSubmitLocked && isPlaying}
                          shakeKey={shakeKey}
                        />
                      ) : (
                        <p
                          className={`font-mono text-5xl font-bold tabular-nums ${mutedFieldClass}`}
                        >
                          —
                        </p>
                      )}
                    </div>

                    <div className="game-play-stack__divider border-b px-3 py-3 text-center">
                      {session.operation && (isPlaying || isGameOver) ? (
                        <OperationValue
                          operation={session.operation}
                          slotClassName="h-10"
                          waterLight={useWaterLikeBackground}
                          sunsetLight={useSunsetUiLight}
                          forestLight={useForestUiLight}
                          violetLight={useVioletUiLight}
                          emberLight={useEmberUiLight}
                          neonLight={useNeonUiLight}
                          midnightLight={useMidnightUiLight}
                          retroLight={useRetroUiLight}
                          fourSecondsLight={fourSecondsActive}
                          timesDivLight={timesDivActive}
                          plusLight={plusActive}
                          minusLight={minusActive}
                          shakeActive={session.isSubmitLocked && isPlaying}
                          shakeKey={shakeKey}
                        />
                      ) : (
                        <p
                          className={`font-mono text-3xl font-medium tabular-nums tracking-wide ${mutedFieldClass}`}
                        >
                          —
                        </p>
                      )}
                    </div>

                    <AnswerDisplay
                      value={inputValue}
                      disabled={inputDisabled}
                      shake={session.isSubmitLocked}
                      shakeKey={shakeKey}
                      answerFlash={session.answerFlash}
                      answerFlashAuto={session.answerFlashAuto}
                      flashKey={session.score}
                      perfectAnswerToken={
                        isPlaying && session.score > 0 ? perfectAnswerToken : 0
                      }
                      waterLight={useWaterLikeBackground}
                      sunsetLight={useSunsetUiLight}
                      forestLight={useForestUiLight}
                      violetLight={useVioletUiLight}
                      emberLight={useEmberUiLight}
                      neonLight={useNeonUiLight}
                      midnightLight={useMidnightUiLight}
                      retroLight={useRetroUiLight}
                      fourSecondsLight={fourSecondsActive}
                      timesDivLight={timesDivActive}
                      plusLight={plusActive}
                      minusLight={minusActive}
                      slotRef={answerFieldRef}
                    />
                  </PlayStackWithChangerBg>
                </PlayFieldsFrame>
              </PlayFieldsSideLayout>
            ) : null}

            {isThemeTestScene && (
              <div className="w-full max-w-xs space-y-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-elevated">
                  <div className="timer-bar-fill relative h-full w-full rounded-full">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-200" />
                  </div>
                </div>
                <NumericKeypad
                  disabled={false}
                  interactionLocked={false}
                  backspaceDisabled={false}
                  autoCheckCharges={themeTestAutoCheckEnabled ? 1 : 0}
                  virtualPress={null}
                  onDigit={() => handleThemeTestKeypadDigit()}
                  onBackspace={handleThemeTestKeypadBackspace}
                  onAutoCorrect={handleThemeTestKeypadAuto}
                  onEnter={handleThemeTestKeypadEnter}
                />
                <p className="text-center text-xs text-amber-300/80">
                  Teste do tema.
                </p>
              </div>
            )}

            {isPlaying && (
              <div className="game-play-controls flex w-full max-w-xs flex-col gap-4">
                <PlayingTimerBar timerMaxMs={session.timerMaxMs} />
                <NumericKeypad
                  disabled={inputDisabled}
                  interactionLocked={benchmarkMode}
                  backspaceDisabled={inputValue.length === 0}
                  autoCheckCharges={player.walletAutoChecks}
                  virtualPress={benchmarkMode ? benchmarkVirtualKeypadPress : null}
                  onDigit={appendDigit}
                  onBackspace={backspaceDigit}
                  onAutoCorrect={onAutoCorrect}
                  onEnter={onConfirm}
                />
              </div>
            )}

            {benchmarkMode && isPlaying && (
              <p className="text-center text-xs uppercase tracking-[0.18em] text-amber-300/80">
                Benchmark em andamento
              </p>
            )}

            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full max-w-xs"
              >
                <div
                  className={`game-over-card w-full rounded-2xl p-4 text-center ${
                    useWaterLikeBackground
                      ? 'game-over-card--water'
                      : useSunsetBackground
                        ? 'game-over-card--sunset'
                        : 'game-over-card--default'
                  }`}
                >
                  <p
                    className={`game-over-card__label text-sm uppercase tracking-wide ${
                      useLightBackground ? '' : 'text-charcoal-muted'
                    }`}
                  >
                    {benchmarkMode && benchmarkMetrics ? 'Benchmark' : 'FIM DE JOGO'}
                  </p>
                  <p
                    className={`game-over-card__score font-mono text-2xl font-bold ${
                      useLightBackground ? '' : 'text-white'
                    }`}
                  >
                    {session.score} pontos
                  </p>
                  {!(benchmarkMode && benchmarkMetrics) && (
                    <p
                      className={`game-over-card__duration mt-1 text-xs ${
                        useLightBackground ? '' : 'text-charcoal-muted'
                      }`}
                    >
                      Tempo: {gameOverElapsedText}
                    </p>
                  )}

                  {benchmarkMode && benchmarkMetrics ? (
                    <div className="mt-3 space-y-2 text-left text-xs">
                      <div className="game-modal-card px-3 py-2">
                        <p className="font-semibold text-stone-200">Performance</p>
                        <ul className="mt-1 space-y-1 text-charcoal-muted">
                          {BENCHMARK_METRIC_ORDER.map((gradeId) => gradeForMetric(benchmarkMetrics, gradeId))
                            .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade))
                            .map((grade) => (
                              <li key={grade.id} className="flex items-center justify-between gap-3">
                                <span>{grade.label}</span>
                                <span className="flex items-center gap-2 font-mono tabular-nums text-stone-300">
                                  <span>{grade.value}</span>
                                  <span className={`${benchmarkGradeTone(grade.grade)} font-bold`}>
                                    {grade.grade}
                                  </span>
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div className="game-modal-card px-3 py-2">
                        <p className="font-semibold text-stone-200">Diagnóstico</p>
                        <p className="mt-1 text-charcoal-muted">
                          Tema:{' '}
                          <span className="text-stone-300">
                            {benchmarkMetrics.equippedTheme}
                            {benchmarkMetrics.themeGpuTier === 'heavy' ? ' (GPU pesado)' : ' (GPU leve)'}
                          </span>
                        </p>
                        {benchmarkMetrics.phaseDiagnosis.length > 0 && (
                          <ul className="mt-2 space-y-1 text-charcoal-muted">
                            {benchmarkMetrics.phaseDiagnosis.slice(0, 4).map((phase) => (
                              <li key={phase.phaseId} className="flex items-center justify-between gap-3">
                                <span>{phase.label}</span>
                                <span
                                  className={`font-mono tabular-nums ${benchmarkPhaseSeverityTone(phase.severity)}`}
                                >
                                  p95 {phase.p95FrameMs} ms
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <ul className="mt-2 space-y-1 text-[0.68rem] leading-relaxed text-charcoal-muted">
                          {benchmarkMetrics.performanceHints.map((hint) => (
                            <li key={hint}>• {hint}</li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-center text-[0.68rem] uppercase tracking-[0.16em] text-emerald-400">
                        {benchmarkMetrics.completed ? 'Benchmark concluído' : 'Benchmark interrompido'}
                      </p>

                      <div className="benchmark-overall-result">
                        <p className="benchmark-overall-result__label">Resultado geral</p>
                        <p
                          className={`benchmark-overall-result__grade ${benchmarkGradeTone(benchmarkMetrics.overallGrade)}`}
                        >
                          {benchmarkMetrics.overallGrade}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                  <p className="mt-1 text-xs">
                    <span className="game-over-reward-xp">+{gameOverRewardDisplay.xp} XP</span>
                    <span className="game-over-reward-sep"> • </span>
                    <span className="game-over-reward-coins">+{gameOverRewardDisplay.coins} moedas</span>
                  </p>
                  {lastGameRewards.goalCompleted && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Meta diária completa!{' '}
                      <span className="game-over-reward-xp">+200 XP</span> e +10 moedas
                    </p>
                  )}
                  {session.beatRecord ? (
                    <p className="mt-1 text-sm text-emerald-400">Novo recorde pessoal!</p>
                  ) : topScore ? (
                    <p
                      className={`game-over-card__meta mt-1 text-sm ${
                        useLightBackground ? '' : 'text-charcoal-muted'
                      }`}
                    >
                      Recorde: {topScore.score} pontos
                    </p>
                  ) : null}
                  {!benchmarkMode && (
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharing}
                    className="game-btn-push game-btn-push-secondary mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal-elevated px-3 py-2 text-xs font-semibold tracking-wide text-stone-100"
                  >
                    {!sharing && <IconShare />}
                    {sharing ? 'Gerando imagem...' : 'Compartilhar'}
                  </button>
                  )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </motion.main>
        </motion.div>
      )}

      {showCurtain && (
        <CurtainOverlay
          key={presentation === 'closing' ? 'closing' : 'curtain'}
          open={curtainOpen}
          initialOpen={curtainInitialOpen}
        />
      )}

      {showMenuChrome && (
        <>
          <div className="game-menu-top fixed inset-x-0 top-0 z-[60] flex items-start justify-between gap-3 px-4 pt-[max(0.3rem,env(safe-area-inset-top))] sm:px-6">
            <motion.div {...menuStageItem(0.03, -12, -10)} className="game-menu-player-header">
              <MenuLevelBadge
                xp={player.xp}
                avatarDataUrl={player.avatarDataUrl}
                onAvatarClick={openAvatarPicker}
                borderLevel={avatarBorderLevel}
              />
              <span className="game-menu-player-header__name">{player.displayName}</span>
            </motion.div>
            <div className="game-menu-top-stats">
              <div className="game-menu-top-stats__row">
                <motion.div
                  {...menuStageItem(0.04, 0, -10)}
                  className="game-menu-autocheck"
                  aria-label={`${player.walletAutoChecks} auto-check${player.walletAutoChecks === 1 ? '' : 's'}`}
                >
                  <span className="game-menu-autocheck__icon">
                    <IconAutoCheck />
                  </span>
                  <span className="game-menu-autocheck__value">{player.walletAutoChecks}</span>
                </motion.div>
                <motion.div
                  {...menuStageItem(0.045, 6, -10)}
                  className="game-menu-diamonds"
                  aria-label={`${player.diamonds} diamante${player.diamonds === 1 ? '' : 's'}`}
                >
                  <span className="game-menu-diamonds__icon">
                    <IconDiamond />
                  </span>
                  <span className="game-menu-diamonds__value">{player.diamonds}</span>
                </motion.div>
                <motion.div {...menuStageItem(0.05, 12, -10)} className="game-menu-coins" aria-label={`${player.coins} moedas`}>
                  <span className="game-menu-coins__icon">
                    <IconCoin />
                  </span>
                  <span className="game-menu-coins__value">{player.coins}</span>
                </motion.div>
              </div>
              <motion.div
                {...menuStageItem(0.06, 14, -8)}
                className="game-menu-daily-card"
                aria-label={`Meta diária ${player.daily.scoreAccumulated} de ${DAILY_GOAL_SCORE_TARGET}`}
              >
                <div className="game-menu-daily-card__top">
                  <span className="game-menu-daily-card__label">Meta diária</span>
                  <span className="game-menu-daily-card__value">
                    {player.daily.scoreAccumulated}/{DAILY_GOAL_SCORE_TARGET}
                  </span>
                </div>
                <div className="game-menu-daily-card__track">
                  <span
                    className={`game-menu-daily-card__fill${player.daily.goalClaimed ? ' game-menu-daily-card__fill--claimed' : ''}`}
                    style={{ width: `${dailyGoalRatio * 100}%` }}
                  />
                </div>
                <p className={`game-menu-daily-card__reward${player.daily.goalClaimed ? ' game-menu-daily-card__reward--claimed' : ''}`}>
                  {player.daily.goalClaimed ? (
                    'Recompensa coletada'
                  ) : (
                    <>
                      +200 XP • +10{' '}
                      <span className="game-menu-daily-card__coin-icon" aria-hidden>
                        <IconCoin />
                      </span>
                    </>
                  )}
                </p>
              </motion.div>
            </div>
          </div>

          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
            {menuAudioReady ? (
              <div className="pointer-events-auto flex flex-col items-center gap-3">
                <motion.div
                  {...menuStageItem(0.06, 0, 20)}
                  className="game-menu-primary-actions"
                >
                  <MenuPrimaryActions
                    onPlayPointerDown={primeAudioOnPointerDown}
                    onPlay={handlePlay}
                    onWeeklyPointerDown={primeAudioOnPointerDown}
                    onWeekly={openWeeklyChallengesModal}
                  />
                </motion.div>
                {devModeEnabled && (
                  <>
                    <motion.div {...menuStageItem(0.08, -8, 16)}>
                      <MenuBenchmarkButton
                        onPointerDown={primeAudioOnPointerDown}
                        onClick={handleBenchmark}
                      />
                    </motion.div>
                    <motion.div {...menuStageItem(0.1, 9, 18)}>
                      <MenuThemeTestButton
                        onPointerDown={primeAudioOnPointerDown}
                        onClick={handleThemeTest}
                      />
                    </motion.div>
                  </>
                )}
              </div>
            ) : needsGestureUnlock ? (
              <motion.button
                type="button"
                className="pointer-events-auto game-btn-push game-btn-push-secondary rounded-2xl bg-charcoal-elevated px-8 py-4 text-base font-semibold tracking-wide text-stone-100 ring-1 ring-stone-600/60"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  activateAudioFromGesture()
                }}
                aria-label="Ativar som e continuar"
              >
                Toque para ativar o som
              </motion.button>
            ) : (
              <motion.p
                className="pointer-events-none px-6 text-center text-sm font-medium tracking-wide text-stone-400"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                Carregando sons...
              </motion.p>
            )}
          </div>

          <div className="game-menu-dock fixed inset-x-0 bottom-0 z-[60]">
            {menuAudioReady ? (
              <footer className="game-menu-footer flex items-end justify-between gap-1 px-3 pb-2 pt-1 sm:gap-2 sm:px-6">
                <motion.div {...menuStageItem(0.06, -16, 12)}>
                  <MenuHudButton
                    label="Jogador"
                    onClick={openPlayerModal}
                    onPointerDown={primeAudioOnPointerDown}
                  >
                    <IconPerson />
                  </MenuHudButton>
                </motion.div>

                <motion.div {...menuStageItem(0.08, -8, 12)}>
                  <MenuHudButton
                    label="Loja"
                    onClick={openShopModal}
                    onPointerDown={primeAudioOnPointerDown}
                  >
                    <IconShop />
                  </MenuHudButton>
                </motion.div>

                <motion.div {...menuStageItem(0.1, 8, 12)}>
                  <MenuHudButton
                    label={player.tutorial.completed ? 'Tutorial ✓' : 'Tutorial'}
                    onClick={handleTutorial}
                    onPointerDown={primeAudioOnPointerDown}
                  >
                    <IconTutorial />
                  </MenuHudButton>
                </motion.div>

                <motion.div {...menuStageItem(0.12, 16, 12)}>
                  <MenuHudButton
                    label="Configurações"
                    onClick={openSettingsModal}
                    onPointerDown={primeAudioOnPointerDown}
                  >
                    <IconGear />
                  </MenuHudButton>
                </motion.div>
              </footer>
            ) : null}

            <div className="game-menu-version-strip" aria-hidden>
              <span>{formatAppVersionLabel()}</span>
            </div>
          </div>
        </>
      )}

      <Modal
        open={weeklyChallengesOpen}
        title="Desafios semanais"
        titleIcon={<IconWeeklyChallenges />}
        onClose={closeWeeklyChallengesModal}
      >
        <p className="text-sm leading-relaxed text-stone-200">
          Objetivos especiais toda semana com recompensas exclusivas.
        </p>
        <p className="mt-3 text-xs text-charcoal-muted">Em breve.</p>
      </Modal>

      <Modal
        open={avatarPickerOpen}
        title="Trocar foto"
        onClose={closeAvatarPicker}
        closeOnBackdrop={!avatarCropOpen}
        sheetAnchor="top"
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-200">Escolha uma origem para sua foto de perfil.</p>
          <button
            type="button"
            onClick={() => requestAvatarSource('gallery')}
            className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
          >
            Fotos da galeria
          </button>
          <button
            type="button"
            onClick={() => requestAvatarSource('camera')}
            className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
          >
            Tirar com a câmera
          </button>
          {player.avatarDataUrl ? (
            <button
              type="button"
              onClick={removeAvatarPhoto}
              className="game-btn-push w-full rounded-xl bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-200 ring-1 ring-rose-400/40"
            >
              Remover foto atual
            </button>
          ) : null}
        </div>
      </Modal>

      <Modal open={avatarCropOpen} title="Enquadrar foto" onClose={closeAvatarCrop} stackLevel={1}>
        <div className="space-y-4">
          <p className="text-sm text-stone-200">Arraste e ajuste o zoom para enquadrar no molde.</p>
          <div
            ref={avatarPreviewRef}
            className={`avatar-crop-preview${avatarDragging ? ' avatar-crop-preview--dragging' : ''}`}
            style={{ width: AVATAR_CROP_VIEWPORT_SIZE, height: AVATAR_CROP_VIEWPORT_SIZE }}
            onPointerDown={onAvatarPreviewPointerDown}
            onPointerMove={onAvatarPreviewPointerMove}
            onPointerUp={onAvatarPreviewPointerEnd}
            onPointerCancel={onAvatarPreviewPointerEnd}
          >
            {avatarDraftUrl ? (
              <img
                ref={avatarImageRef}
                src={avatarDraftUrl}
                alt="Prévia da foto do avatar"
                className="avatar-crop-preview__image"
                draggable={false}
                onLoad={(event) => {
                  const loaded = event.currentTarget
                  const naturalWidth = loaded.naturalWidth
                  const naturalHeight = loaded.naturalHeight
                  if (naturalWidth <= 0 || naturalHeight <= 0) return
                  setAvatarDraftNaturalSize({ width: naturalWidth, height: naturalHeight })
                  setAvatarOffset((current) => clampAvatarOffset(current, avatarScale))
                }}
                style={{
                  width: `${avatarPreviewDrawWidth}px`,
                  height: `${avatarPreviewDrawHeight}px`,
                  transform: `translate(-50%, -50%) translate(${avatarOffset.x}px, ${avatarOffset.y}px)`,
                }}
              />
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span>Zoom</span>
              <span className="font-mono text-stone-300">{avatarScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={avatarScale}
              onChange={(event) => {
                const nextScale = Number(event.currentTarget.value)
                setAvatarScale(nextScale)
                setAvatarOffset((current) => clampAvatarOffset(current, nextScale))
              }}
              className="avatar-crop-preview__slider w-full"
            />
          </div>
          <button
            type="button"
            onClick={saveAvatarCrop}
            disabled={!avatarDraftUrl}
            className="game-btn-push game-btn-push-amber w-full rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar foto
          </button>
          <button
            type="button"
            onClick={closeAvatarCrop}
            className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      <input
        ref={avatarGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFilePicked}
      />
      <input
        ref={avatarCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleAvatarFilePicked}
      />

      <GameModalLayer
        playerOpen={playerOpen}
        shopOpen={shopOpen}
        settingsOpen={settingsOpen}
        rewardedOpen={rewardedOpen}
        timeoutModalOpen={timeoutModalOpen}
        exitConfirmOpen={exitConfirmOpen}
        player={player}
        topScores={topScores}
        godModeEnabled={godModeEnabled}
        showGodModeToggle={showGodModeToggle}
        soundEnabled={soundEnabled}
        devModeEnabled={devModeEnabled}
        rewardedAdsWatched={rewardedAdsWatched}
        onClosePlayer={closePlayerModal}
        onCloseShop={closeShopModal}
        onCloseSettings={closeSettingsModal}
        onCloseRewarded={closeRewardedModal}
        onOpenRewardedFromPlayer={() => {
          setPlayerOpen(false)
          setRewardedOpen(true)
        }}
        onSaveDisplayName={onSaveDisplayName}
        onBuyTheme={onBuyTheme}
        onEquipBadge={onEquipBadge}
        onBuyBadge={onBuyBadge}
        onBuyAutoCheck={onBuyAutoCheck}
        onSoundChange={onSoundChange}
        onDevModeChange={onDevModeChange}
        onGodModeChange={onGodModeChange}
        onBackgroundThemeChange={onBackgroundThemeChange}
        onWatchRewardedAd={onWatchRewardedAd}
        onUseAutoCheckAtTimeout={onUseAutoCheckAtTimeout}
        onDeclineAutoCheckAtTimeout={onDeclineAutoCheckAtTimeout}
        onCloseExitConfirm={() => setExitConfirmOpen(false)}
        onConfirmExit={requestExitAppOrPreviousPage}
      />
      {isGameOver && (
        <ShareCardTemplate
          theme={backgroundTheme}
          playerName={player.displayName}
          level={playerLevel}
          xp={player.xp}
          avatarDataUrl={player.avatarDataUrl}
          score={session.score}
          durationText={gameOverElapsedText}
          xpGained={lastGameRewards.xpGained}
          coinsGained={lastGameRewards.coinsGained}
          goalCompleted={lastGameRewards.goalCompleted}
        />
      )}
    </div>
  )
}
