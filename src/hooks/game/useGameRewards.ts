import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { markBeatRecord } from "../../engine/game-state-machine";
import {
  TIMES_DIV_ROUNDS,
  challengeSessionElapsedLimitMs,
} from "../../engine/challenge-session";
import { scoreToCoins } from "../../engine/rewards";
import type { ChallengeModeId, GameSession } from "../../engine/types";
import { ensureDailyFresh } from "../../platform/daily-reset";
import { markChallengeCompletedToday } from "../../challenges/challenge-helpers";
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
const TIMES_DIV_ONLY_REWARD = 70;

export interface PostGameRewards {
  xpGained: number;
  coinsGained: number;
  goalCompleted: boolean;
  challengeMode: ChallengeModeId | null;
  challengeCompleted: boolean;
}

const EMPTY_REWARDS: PostGameRewards = {
  xpGained: 0,
  coinsGained: 0,
  goalCompleted: false,
  challengeMode: null,
  challengeCompleted: false,
};

export interface GameRewardsOptions {
  session: GameSession;
  setSession: (action: SetStateAction<GameSession>) => void;
  benchmarkSessionRef: React.MutableRefObject<boolean>;
  challengeSessionRef: React.MutableRefObject<ChallengeModeId | null>;
  commitPlayer: (updater: (current: PlayerData) => PlayerData) => PlayerData;
  soundEnabledRef: React.MutableRefObject<boolean>;
}

export interface GameRewards {
  lastGameRewards: PostGameRewards;
  topScores: ScoreRecord[];
  resetRewardTracking: () => void;
  clearLastGameRewards: () => void;
}

function computeChallengeRewards(session: GameSession, mode: ChallengeModeId): {
  xpGained: number;
  coinsGained: number;
  challengeCompleted: boolean;
} {
  switch (mode) {
    case "double-coins":
      return {
        xpGained: session.score,
        coinsGained: scoreToCoins(session.score) * 2,
        challengeCompleted: session.score >= 1000,
      };
    case "sixty-seconds":
      return {
        xpGained: session.score,
        coinsGained: scoreToCoins(session.score),
        challengeCompleted: true,
      };
    case "three-seconds":
      return {
        xpGained: session.score,
        coinsGained: session.challengeProgress?.bonusCoinsEarned ?? 0,
        challengeCompleted: (session.challengeProgress?.bonusCoinsEarned ?? 0) >= 75,
      };
    case "times-div-only": {
      const completed =
        (session.challengeProgress?.roundsCompleted ?? 0) >= TIMES_DIV_ROUNDS;
      return {
        xpGained: session.score,
        coinsGained: completed ? TIMES_DIV_ONLY_REWARD : 0,
        challengeCompleted: completed,
      };
    }
    default:
      return { xpGained: session.score, coinsGained: 0, challengeCompleted: false };
  }
}

export function useGameRewards({
  session,
  setSession,
  benchmarkSessionRef,
  challengeSessionRef,
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

    const challengeMode = challengeSessionRef.current;
    let coinsGained = 0;
    let goalCompleted = false;
    let xpGained = 0;
    let challengeCompleted = false;

    if (challengeMode) {
      const challengeRewards = computeChallengeRewards(session, challengeMode);
      xpGained = challengeRewards.xpGained;
      coinsGained = challengeRewards.coinsGained;
      challengeCompleted = challengeRewards.challengeCompleted;

      commitPlayer((current) => {
        let next = ensureDailyFresh(current)
        next = {
          ...next,
          xp: next.xp + xpGained,
          coins: next.coins + coinsGained,
        }
        if (challengeCompleted) {
          next = markChallengeCompletedToday(next, challengeMode)
        }
        return next
      });
    } else {
      coinsGained = scoreToCoins(session.score);
      xpGained = session.score;

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
    }

    setLastGameRewards({
      xpGained,
      coinsGained,
      goalCompleted,
      challengeMode,
      challengeCompleted,
    });

    if (!challengeMode) {
      const result = saveTopScore(session.score, session.elapsedMs);
      setTopScores(result.scores);
      setSession((current) =>
        current.phase === "game_over" && current.beatRecord === result.isTop1
          ? current
          : markBeatRecord(current, result.isTop1),
      );
      playSfx(result.isTop1 ? "record" : "gameOver", soundEnabledRef.current);
    } else {
      playSfx("gameOver", soundEnabledRef.current);
    }
  }, [
    session.phase,
    session.score,
    session.elapsedMs,
    session.challengeProgress,
    benchmarkSessionRef,
    challengeSessionRef,
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

export { challengeSessionElapsedLimitMs };
