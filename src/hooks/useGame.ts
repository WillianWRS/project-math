import { useCallback, useEffect, useRef, useState } from "react";
import { returnToMenu, startGame } from "../engine/game-state-machine";
import { isAnyGameChangerActive } from "../engine/game-changer-cycles";
import type { GameSession } from "../engine/types";
import type { BenchmarkVirtualKey } from "../engine/benchmark-types";
import {
  playCorrectAnswerSfx,
  playRandomWriteSfx,
} from "../platform/audio-service";
import { env } from "../config/env";
import { usePlayer } from "./usePlayer";
import { useBenchmark } from "./useBenchmark";
import { useGameSession } from "./game/useGameSession";
import { useAudioSettings } from "./game/useAudioSettings";
import { useGameClock } from "./game/useGameClock";
import { useGameRewards } from "./game/useGameRewards";
import { useGameCosmetics } from "./game/useGameCosmetics";
import { useGameActions } from "./game/useGameActions";

export type { PostGameRewards } from "./game/useGameRewards";
export type { TutorialCompletionResult } from "./game/useGameCosmetics";

const PERFECT_ANSWER_RATIO = 0.9;

/**
 * Orquestrador da partida. Não contém lógica de regra de jogo: apenas compõe os hooks
 * de responsabilidade isolada (sessão, áudio, relógio, recompensas, cosméticos, ações e
 * benchmark), conecta os refs compartilhados e expõe a API consumida pela UI.
 */
export function useGame() {
  const {
    session,
    setSession,
    inputValue,
    onInputChange,
    sessionRef,
  } = useGameSession();

  const {
    player,
    commitPlayer,
    grantAutoCheck,
    spendAutoCheck,
    setEquippedTheme,
    purchaseTheme,
    ...playerActions
  } = usePlayer();

  const audio = useAudioSettings();
  const { soundEnabledRef } = audio;

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const [perfectAnswerToken, setPerfectAnswerToken] = useState(0);
  const registerPerfectAnswer = useCallback(() => {
    setPerfectAnswerToken((token) => token + 1);
  }, []);

  const [benchmarkMode, setBenchmarkMode] = useState(false);
  const benchmarkSessionRef = useRef(false);

  // Refs de timing compartilhados: o relógio os muta, benchmark e ações os leem.
  const timerMsRef = useRef(session.timerMs);
  const elapsedMsRef = useRef(session.elapsedMs);
  const cycleStartedAtRef = useRef(0);
  const cycleTimerMaxRef = useRef(session.timerMaxMs);

  const onBenchmarkVirtualKeyPress = useCallback(
    (key: BenchmarkVirtualKey) => {
      if (key.startsWith("digit-")) {
        playRandomWriteSfx(soundEnabledRef.current);
      }
    },
    [soundEnabledRef],
  );
  const onBenchmarkCorrectAnswer = useCallback(
    (sessionBeforeSubmit: GameSession, fromAutoCheck: boolean) => {
      playCorrectAnswerSfx(
        isAnyGameChangerActive(sessionBeforeSubmit),
        soundEnabledRef.current,
        fromAutoCheck,
      );
    },
    [soundEnabledRef],
  );
  const onBenchmarkPerfectAnswer = useCallback((timerMaxMs: number) => {
    if (timerMaxMs <= 0) return;
    const liveTimerRatio = Math.max(0, timerMsRef.current) / timerMaxMs;
    if (liveTimerRatio >= PERFECT_ANSWER_RATIO) {
      setPerfectAnswerToken((token) => token + 1);
    }
  }, []);

  const {
    benchmarkActive,
    benchmarkMetrics,
    benchmarkVirtualKeypadPress,
    onStartBenchmark,
    onInterruptBenchmark,
    resetBenchmark,
  } = useBenchmark({
    session,
    equippedTheme: player.equippedThemeId,
    setSession,
    grantAutoCheck,
    spendAutoCheck,
    onVirtualKeyPress: onBenchmarkVirtualKeyPress,
    onBenchmarkPerfectAnswer,
    onBenchmarkCorrectAnswer,
  });

  useGameClock({
    session,
    setSession,
    sessionRef,
    playerRef,
    benchmarkActive,
    benchmarkSessionRef,
    soundEnabledRef,
    timerMsRef,
    elapsedMsRef,
    cycleStartedAtRef,
    cycleTimerMaxRef,
  });

  const { lastGameRewards, topScores, resetRewardTracking, clearLastGameRewards } =
    useGameRewards({
      session,
      setSession,
      benchmarkSessionRef,
      commitPlayer,
      soundEnabledRef,
    });

  const cosmetics = useGameCosmetics({
    commitPlayer,
    setEquippedTheme,
    purchaseTheme,
  });

  const actions = useGameActions({
    sessionRef,
    setSession,
    commitPlayer,
    grantAutoCheck,
    spendAutoCheck,
    soundEnabledRef,
    benchmarkSessionRef,
    cycleStartedAtRef,
    cycleTimerMaxRef,
    elapsedMsRef,
    registerPerfectAnswer,
  });

  const onStart = useCallback(() => {
    if (sessionRef.current.phase === "playing") return;
    benchmarkSessionRef.current = false;
    setBenchmarkMode(false);
    resetBenchmark();
    resetRewardTracking();
    clearLastGameRewards();
    setPerfectAnswerToken(0);
    setSession(startGame());
  }, [
    clearLastGameRewards,
    resetBenchmark,
    resetRewardTracking,
    sessionRef,
    setSession,
  ]);

  const onStartBenchmarkSession = useCallback(() => {
    if (sessionRef.current.phase === "playing") return;
    benchmarkSessionRef.current = true;
    setBenchmarkMode(true);
    resetRewardTracking();
    clearLastGameRewards();
    setPerfectAnswerToken(0);
    onStartBenchmark();
  }, [
    clearLastGameRewards,
    onStartBenchmark,
    resetRewardTracking,
    sessionRef,
  ]);

  const onReturnToMenu = useCallback(() => {
    onInterruptBenchmark();
    benchmarkSessionRef.current = false;
    setBenchmarkMode(false);
    resetBenchmark();
    resetRewardTracking();
    setPerfectAnswerToken(0);
    setSession(returnToMenu());
  }, [
    onInterruptBenchmark,
    resetBenchmark,
    resetRewardTracking,
    setSession,
  ]);

  return {
    session,
    inputValue,
    topScores,
    soundEnabled: audio.soundEnabled,
    menuAudioReady: audio.menuAudioReady,
    menuAudioPrefetchComplete: audio.menuAudioPrefetchComplete,
    needsGestureUnlock: audio.needsGestureUnlock,
    activateAudioFromGesture: audio.activateAudioFromGesture,
    devModeEnabled: cosmetics.devModeEnabled,
    godModeEnabled: cosmetics.godModeEnabled,
    showGodModeToggle: env.showGodModeToggle,
    backgroundTheme: player.equippedThemeId,
    player,
    lastGameRewards,
    benchmarkActive,
    benchmarkMetrics,
    benchmarkVirtualKeypadPress,
    benchmarkMode,
    perfectAnswerToken,
    onStart,
    onStartBenchmarkSession,
    onReturnToMenu,
    onConfirm: actions.onConfirm,
    onAutoCorrect: actions.onAutoCorrect,
    onUseAutoCheckAtTimeout: actions.onUseAutoCheckAtTimeout,
    onDeclineAutoCheckAtTimeout: actions.onDeclineAutoCheckAtTimeout,
    onInputChange,
    toggleSound: audio.toggleSound,
    toggleDevMode: cosmetics.toggleDevMode,
    toggleGodMode: cosmetics.toggleGodMode,
    setBackgroundTheme: cosmetics.setBackgroundTheme,
    buyTheme: cosmetics.buyTheme,
    grantAutoCheck,
    spendAutoCheck,
    ...playerActions,
    playClick: audio.playClick,
    playGameStart: audio.playGameStart,
    playWriteKey: audio.playWriteKey,
    playEraseKey: audio.playEraseKey,
    playGoToMenu: audio.playGoToMenu,
    completeTutorial: cosmetics.completeTutorial,
  };
}
