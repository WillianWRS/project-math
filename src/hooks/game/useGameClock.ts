import { useEffect, useRef, type SetStateAction } from "react";
import { tickTimer } from "../../engine/game-state-machine";
import type { GameSession } from "../../engine/types";
import type { PlayerData } from "../../platform/storage";
import { gameTimerStore } from "../../platform/game-timer-store";
import { unlockAudioSync } from "../../platform/audio-service";

const TIMER_UI_PUBLISH_MS = 100;
const AUTO_CHECK_TIMEOUT_DANGER_SFX_SRC = "/audio/danger.mp3";

export interface GameTimingRefs {
  timerMsRef: React.MutableRefObject<number>;
  elapsedMsRef: React.MutableRefObject<number>;
  cycleStartedAtRef: React.MutableRefObject<number>;
  cycleTimerMaxRef: React.MutableRefObject<number>;
}

export interface GameClockOptions extends GameTimingRefs {
  session: GameSession;
  setSession: (action: SetStateAction<GameSession>) => void;
  sessionRef: React.MutableRefObject<GameSession>;
  playerRef: React.MutableRefObject<PlayerData>;
  benchmarkActive: boolean;
  benchmarkSessionRef: React.MutableRefObject<boolean>;
  soundEnabledRef: React.MutableRefObject<boolean>;
}

/**
 * Dono do "tempo" da partida fora do ciclo de render do React:
 * - loop em requestAnimationFrame que decrementa o timer e publica no store externo;
 * - rastreio de início de ciclo (para detectar respostas "perfeitas");
 * - áudio de perigo quando o timeout abre a escolha de auto-check.
 *
 * Os refs de timing são criados no orquestrador (pois o benchmark também os lê) e
 * apenas mutados aqui — assim evitamos re-render a cada frame e a dependência circular
 * entre o relógio e o benchmark.
 */
export function useGameClock({
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
}: GameClockOptions): void {
  const cycleScoreRef = useRef(session.score);
  const prevPhaseRef = useRef(session.phase);
  const timeoutDangerAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutDangerPlayedRef = useRef(false);

  useEffect(() => {
    timerMsRef.current = session.timerMs;

    if (session.phase !== "playing") {
      elapsedMsRef.current = session.elapsedMs;
      gameTimerStore.sync(session.timerMs, session.elapsedMs);
      return;
    }

    if (session.score === 0 && session.elapsedMs === 0) {
      elapsedMsRef.current = 0;
    }

    gameTimerStore.set(timerMsRef.current, elapsedMsRef.current);
  }, [
    session.phase,
    session.score,
    session.timerMs,
    session.elapsedMs,
    session.awaitingAutoCheckChoice,
    elapsedMsRef,
    timerMsRef,
  ]);

  useEffect(() => {
    const phaseChanged = prevPhaseRef.current !== session.phase;
    if (
      session.phase === "playing" &&
      (phaseChanged || session.score !== cycleScoreRef.current)
    ) {
      cycleStartedAtRef.current = performance.now();
      cycleTimerMaxRef.current = session.timerMaxMs;
      cycleScoreRef.current = session.score;
    }

    if (session.phase !== "playing") {
      cycleScoreRef.current = session.score;
      cycleTimerMaxRef.current = session.timerMaxMs;
    }

    prevPhaseRef.current = session.phase;
  }, [
    session.phase,
    session.score,
    session.timerMaxMs,
    cycleStartedAtRef,
    cycleTimerMaxRef,
  ]);

  useEffect(() => {
    const shouldShowTimeoutChoice =
      session.phase === "playing" &&
      session.awaitingAutoCheckChoice &&
      !benchmarkSessionRef.current;

    if (!shouldShowTimeoutChoice) {
      timeoutDangerPlayedRef.current = false;
      if (timeoutDangerAudioRef.current) {
        timeoutDangerAudioRef.current.pause();
        timeoutDangerAudioRef.current.currentTime = 0;
        timeoutDangerAudioRef.current = null;
      }
      return;
    }

    if (timeoutDangerPlayedRef.current) return;
    timeoutDangerPlayedRef.current = true;
    if (!soundEnabledRef.current) return;

    unlockAudioSync();
    const dangerAudio = new Audio(AUTO_CHECK_TIMEOUT_DANGER_SFX_SRC);
    dangerAudio.currentTime = 0;
    timeoutDangerAudioRef.current = dangerAudio;
    void dangerAudio.play().catch(() => {
      // Ignora bloqueios de autoplay; o fluxo visual continua.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase, session.awaitingAutoCheckChoice]);

  useEffect(() => {
    if (session.phase !== "playing") return;
    if (benchmarkActive) return;

    let lastTick = performance.now();
    let lastPublish = lastTick;
    let frameId = 0;

    const loop = (now: number) => {
      const delta = now - lastTick;
      lastTick = now;

      if (!sessionRef.current.awaitingAutoCheckChoice) {
        timerMsRef.current = Math.max(0, timerMsRef.current - delta);
        elapsedMsRef.current += delta;
      }

      if (
        timerMsRef.current <= 0 &&
        !sessionRef.current.awaitingAutoCheckChoice
      ) {
        setSession((current) => {
          if (current.phase !== "playing") return current;
          if (current.awaitingAutoCheckChoice) return current;
          if (playerRef.current.walletAutoChecks > 0) {
            return { ...current, timerMs: 0, awaitingAutoCheckChoice: true };
          }
          const timedOut = tickTimer({ ...current, timerMs: 0 }, 0);
          return timedOut.phase === "game_over"
            ? { ...timedOut, elapsedMs: elapsedMsRef.current }
            : timedOut;
        });
      }

      if (
        now - lastPublish >= TIMER_UI_PUBLISH_MS &&
        !sessionRef.current.awaitingAutoCheckChoice
      ) {
        lastPublish = now;
        gameTimerStore.set(timerMsRef.current, elapsedMsRef.current);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase, benchmarkActive, setSession]);
}
