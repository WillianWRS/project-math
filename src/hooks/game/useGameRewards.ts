import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { markBeatRecord } from "../../engine/game-state-machine";
import { scoreToCoins } from "../../engine/rewards";
import type { GameSession } from "../../engine/types";
import { ensureDailyFresh } from "../../platform/daily-reset";
import {
  loadTopScores,
  saveTopScore,
  type PlayerData,
  type ScoreRecord,
} from "../../platform/storage";
import { playSfx } from "../../platform/audio-service";

const DAILY_GOAL_SCORE = 500;
const DAILY_GOAL_XP_REWARD = 200;
const DAILY_GOAL_COINS_REWARD = 10;

export interface PostGameRewards {
  xpGained: number;
  coinsGained: number;
  goalCompleted: boolean;
}

const EMPTY_REWARDS: PostGameRewards = {
  xpGained: 0,
  coinsGained: 0,
  goalCompleted: false,
};

export interface GameRewardsOptions {
  session: GameSession;
  setSession: (action: SetStateAction<GameSession>) => void;
  benchmarkSessionRef: React.MutableRefObject<boolean>;
  commitPlayer: (updater: (current: PlayerData) => PlayerData) => PlayerData;
  soundEnabledRef: React.MutableRefObject<boolean>;
}

export interface GameRewards {
  lastGameRewards: PostGameRewards;
  topScores: ScoreRecord[];
  /** Reseta os guards de "já processei o game over" (chamado ao iniciar/sair). */
  resetRewardTracking: () => void;
  /** Zera o painel de recompensas exibido (chamado ao iniciar uma nova partida). */
  clearLastGameRewards: () => void;
}

/**
 * Concentra o que acontece no fim de jogo: cálculo de XP/moedas, meta diária,
 * persistência do top score, flag de recorde e SFX de game over/record.
 * Um guard por ref evita processar o mesmo game over mais de uma vez.
 */
export function useGameRewards({
  session,
  setSession,
  benchmarkSessionRef,
  commitPlayer,
  soundEnabledRef,
}: GameRewardsOptions): GameRewards {
  const [topScores, setTopScores] = useState<ScoreRecord[]>(() => loadTopScores());
  const [lastGameRewards, setLastGameRewards] = useState<PostGameRewards>(EMPTY_REWARDS);
  const gameOverFxHandledRef = useRef(false);
  const lastPersistedScoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (session.phase !== "game_over") return;
    if (benchmarkSessionRef.current) return;
    if (
      gameOverFxHandledRef.current &&
      lastPersistedScoreRef.current === session.score
    )
      return;

    gameOverFxHandledRef.current = true;
    lastPersistedScoreRef.current = session.score;

    let coinsGained = scoreToCoins(session.score);
    let goalCompleted = false;
    let xpGained = session.score;

    commitPlayer((current) => {
      const fresh = ensureDailyFresh(current);
      const dailyScore = fresh.daily.scoreAccumulated + session.score;
      goalCompleted = !fresh.daily.goalClaimed && dailyScore >= DAILY_GOAL_SCORE;
      if (goalCompleted) {
        xpGained += DAILY_GOAL_XP_REWARD;
        coinsGained += DAILY_GOAL_COINS_REWARD;
      }

      return {
        ...fresh,
        xp: fresh.xp + xpGained,
        coins: fresh.coins + coinsGained,
        walletAutoChecks: fresh.walletAutoChecks,
        daily: {
          ...fresh.daily,
          scoreAccumulated: dailyScore,
          goalClaimed: fresh.daily.goalClaimed || goalCompleted,
        },
      };
    });

    setLastGameRewards({ xpGained, coinsGained, goalCompleted });

    const result = saveTopScore(session.score, session.elapsedMs);
    setTopScores(result.scores);
    setSession((current) =>
      current.phase === "game_over" && current.beatRecord === result.isTop1
        ? current
        : markBeatRecord(current, result.isTop1),
    );
    playSfx(result.isTop1 ? "record" : "gameOver", soundEnabledRef.current);
  }, [
    session.phase,
    session.score,
    session.elapsedMs,
    benchmarkSessionRef,
    commitPlayer,
    setSession,
    soundEnabledRef,
  ]);

  const resetRewardTracking = useCallback(() => {
    gameOverFxHandledRef.current = false;
    lastPersistedScoreRef.current = null;
  }, []);

  const clearLastGameRewards = useCallback(() => {
    setLastGameRewards(EMPTY_REWARDS);
  }, []);

  return { lastGameRewards, topScores, resetRewardTracking, clearLastGameRewards };
}
