import { useCallback, type SetStateAction } from "react";
import { setInputValue, submitAnswer } from "../../engine/game-state-machine";
import { isAnyGameChangerActive } from "../../engine/game-changer-cycles";
import { PERFECT_ANSWER_COINS } from "../../engine/rewards";
import type { GameSession } from "../../engine/types";
import type { PlayerData } from "../../platform/storage";
import {
  playCorrectAnswerSfx,
  playSfx,
} from "../../platform/audio-service";

const PERFECT_ANSWER_RATIO = 0.9;

export interface GameActionsOptions {
  sessionRef: React.MutableRefObject<GameSession>;
  setSession: (action: SetStateAction<GameSession>) => void;
  commitPlayer: (updater: (current: PlayerData) => PlayerData) => PlayerData;
  grantAutoCheck: (amount: number) => void;
  spendAutoCheck: () => boolean;
  soundEnabledRef: React.MutableRefObject<boolean>;
  benchmarkSessionRef: React.MutableRefObject<boolean>;
  cycleStartedAtRef: React.MutableRefObject<number>;
  cycleTimerMaxRef: React.MutableRefObject<number>;
  elapsedMsRef: React.MutableRefObject<number>;
  registerPerfectAnswer: () => void;
}

export interface GameActions {
  onConfirm: () => void;
  onAutoCorrect: () => void;
  onUseAutoCheckAtTimeout: () => void;
  onDeclineAutoCheckAtTimeout: () => void;
}

/**
 * Ações disparadas pela interação do jogador durante a partida.
 * O valor digitado já está em `session.inputValue` (fonte única) antes do submit.
 */
export function useGameActions({
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
}: GameActionsOptions): GameActions {
  const applyAnswerResult = useCallback(
    (current: GameSession, fromAutoCheck = false) => {
      const {
        session: next,
        result,
        autoCheckGranted,
      } = submitAnswer(current, {
        autoCheck: fromAutoCheck,
      });
      setSession(next);

      if (autoCheckGranted) {
        grantAutoCheck(1);
      }

      if (result === "correct") {
        const elapsedInCycleMs = Math.max(
          0,
          performance.now() - cycleStartedAtRef.current,
        );
        const cycleTimerMaxMs = Math.max(1, cycleTimerMaxRef.current);
        const liveTimerRatio = Math.max(
          0,
          1 - elapsedInCycleMs / cycleTimerMaxMs,
        );
        if (
          !fromAutoCheck &&
          !benchmarkSessionRef.current &&
          liveTimerRatio >= PERFECT_ANSWER_RATIO
        ) {
          registerPerfectAnswer();
          commitPlayer((fresh) => ({
            ...fresh,
            coins: fresh.coins + PERFECT_ANSWER_COINS,
          }));
        }
        playCorrectAnswerSfx(
          isAnyGameChangerActive(current),
          soundEnabledRef.current,
          fromAutoCheck,
        );
      } else if (result === "wrong") {
        playSfx("error", soundEnabledRef.current);
      }
    },
    [
      benchmarkSessionRef,
      commitPlayer,
      cycleStartedAtRef,
      cycleTimerMaxRef,
      grantAutoCheck,
      registerPerfectAnswer,
      setSession,
      soundEnabledRef,
    ],
  );

  const onConfirm = useCallback(() => {
    applyAnswerResult(sessionRef.current);
  }, [applyAnswerResult, sessionRef]);

  const runAutoCorrect = useCallback(
    (consumeWallet: boolean) => {
      const current = sessionRef.current;
      if (
        current.phase !== "playing" ||
        current.isSubmitLocked ||
        !current.operation
      )
        return;

      let spent = false;
      if (consumeWallet) {
        spent = spendAutoCheck();
        if (!spent) return;
      }

      const forcedAnswer = setInputValue(
        current,
        String(current.operation.result),
      );
      const {
        session: next,
        result,
        autoCheckGranted,
      } = submitAnswer(forcedAnswer, { autoCheck: true });
      setSession(next);

      if (result === "locked" && spent && consumeWallet) {
        grantAutoCheck(1);
        return;
      }
      if (autoCheckGranted) {
        grantAutoCheck(1);
      }
      if (result === "correct") {
        playCorrectAnswerSfx(
          isAnyGameChangerActive(current),
          soundEnabledRef.current,
          true,
        );
      } else if (result === "wrong") {
        playSfx("error", soundEnabledRef.current);
      }
    },
    [grantAutoCheck, sessionRef, setSession, soundEnabledRef, spendAutoCheck],
  );

  const onAutoCorrect = useCallback(() => {
    runAutoCorrect(true);
  }, [runAutoCorrect]);

  const onUseAutoCheckAtTimeout = useCallback(() => {
    const current = sessionRef.current;
    if (current.phase !== "playing" || !current.awaitingAutoCheckChoice) return;
    runAutoCorrect(true);
  }, [runAutoCorrect, sessionRef]);

  const onDeclineAutoCheckAtTimeout = useCallback(() => {
    setSession((current) => {
      if (current.phase !== "playing") return current;
      return {
        ...current,
        phase: "game_over",
        timerMs: 0,
        elapsedMs: elapsedMsRef.current,
        awaitingAutoCheckChoice: false,
      };
    });
  }, [elapsedMsRef, setSession]);

  return {
    onConfirm,
    onAutoCorrect,
    onUseAutoCheckAtTimeout,
    onDeclineAutoCheckAtTimeout,
  };
}
