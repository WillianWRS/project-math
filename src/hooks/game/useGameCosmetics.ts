import { useCallback, useState } from "react";
import {
  getThemePurchasePrice,
  THEME_CATALOG,
} from "../../cosmetics/theme-catalog";
import {
  loadDevModeEnabled,
  loadGodModeEnabled,
  saveDevModeEnabled,
  saveGodModeEnabled,
  type BackgroundTheme,
  type PlayerData,
} from "../../platform/storage";

const TUTORIAL_REWARD_XP = 200;
const TUTORIAL_REWARD_COINS = 200;

export interface TutorialCompletionResult {
  rewardsGranted: boolean;
  xpGained: number;
  coinsGained: number;
}

export interface GameCosmeticsOptions {
  commitPlayer: (updater: (current: PlayerData) => PlayerData) => PlayerData;
  setEquippedTheme: (theme: BackgroundTheme) => void;
  purchaseTheme: (theme: BackgroundTheme, priceCoins: number) => boolean;
}

export interface GameCosmetics {
  devModeEnabled: boolean;
  godModeEnabled: boolean;
  toggleDevMode: (enabled: boolean) => void;
  toggleGodMode: (enabled: boolean) => void;
  setBackgroundTheme: (theme: BackgroundTheme) => void;
  buyTheme: (theme: BackgroundTheme, priceCoins: number) => boolean;
  completeTutorial: () => TutorialCompletionResult;
}

/**
 * Configurações de meta-jogo do jogador: flags de dev/god mode (persistidas),
 * equipar/comprar tema (respeitando o god mode) e a conclusão do tutorial com recompensa.
 */
export function useGameCosmetics({
  commitPlayer,
  setEquippedTheme,
  purchaseTheme,
}: GameCosmeticsOptions): GameCosmetics {
  const [devModeEnabled, setDevModeEnabled] = useState(() => loadDevModeEnabled());
  const [godModeEnabled, setGodModeEnabled] = useState(() => loadGodModeEnabled());

  const toggleDevMode = useCallback((enabled: boolean) => {
    setDevModeEnabled(enabled);
    saveDevModeEnabled(enabled);
  }, []);

  const toggleGodMode = useCallback(
    (enabled: boolean) => {
      setGodModeEnabled(enabled);
      saveGodModeEnabled(enabled);
      if (!enabled) {
        commitPlayer((current) => {
          const themeFallback = current.ownedThemeIds[0] ?? "default";
          const badgeFallback = current.ownedBadgeIds[0] ?? "default-ring";
          if (
            current.ownedThemeIds.includes(current.equippedThemeId) &&
            current.ownedBadgeIds.includes(current.equippedBadgeId)
          ) {
            return current;
          }
          return {
            ...current,
            equippedThemeId: themeFallback,
            equippedBadgeId: badgeFallback,
          };
        });
      }
    },
    [commitPlayer],
  );

  const setBackgroundTheme = useCallback(
    (theme: BackgroundTheme) => {
      if (!godModeEnabled) {
        setEquippedTheme(theme);
        return;
      }

      const availableThemeIds = THEME_CATALOG.flatMap((entry) =>
        entry.equippableThemeId === undefined ? [] : [entry.equippableThemeId],
      );
      if (!availableThemeIds.includes(theme)) return;
      commitPlayer((current) => ({ ...current, equippedThemeId: theme }));
    },
    [commitPlayer, godModeEnabled, setEquippedTheme],
  );

  const buyTheme = useCallback(
    (theme: BackgroundTheme, priceCoins: number): boolean => {
      return purchaseTheme(
        theme,
        getThemePurchasePrice(priceCoins, godModeEnabled),
      );
    },
    [godModeEnabled, purchaseTheme],
  );

  const completeTutorial = useCallback((): TutorialCompletionResult => {
    let rewardsGranted = false;
    let xpGained = 0;
    let coinsGained = 0;

    commitPlayer((current) => {
      rewardsGranted = !current.tutorial.rewardsClaimed;
      xpGained = rewardsGranted ? TUTORIAL_REWARD_XP : 0;
      coinsGained = rewardsGranted ? TUTORIAL_REWARD_COINS : 0;

      return {
        ...current,
        xp: current.xp + xpGained,
        coins: current.coins + coinsGained,
        tutorial: {
          completed: true,
          rewardsClaimed: true,
        },
      };
    });

    return { rewardsGranted, xpGained, coinsGained };
  }, [commitPlayer]);

  return {
    devModeEnabled,
    godModeEnabled,
    toggleDevMode,
    toggleGodMode,
    setBackgroundTheme,
    buyTheme,
    completeTutorial,
  };
}
