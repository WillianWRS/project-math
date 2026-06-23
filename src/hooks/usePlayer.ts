import { useCallback, useEffect, useRef, useState } from 'react'
import { SimulatedRewardedAds } from '../platform/ads'
import { ensureDailyFresh } from '../platform/daily-reset'
import { loadPlayerData, savePlayerData, type BackgroundTheme, type PlayerData } from '../platform/storage'

export const DISPLAY_NAME_MAX_LENGTH = 20

export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim().slice(0, DISPLAY_NAME_MAX_LENGTH)
  if (trimmed.length < 2) return 'Jogador'
  return trimmed.replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'Jogador'
}

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerData>(() => ensureDailyFresh(loadPlayerData()))
  const playerRef = useRef(player)

  useEffect(() => {
    playerRef.current = player
  }, [player])

  const commitPlayer = useCallback((updater: (current: PlayerData) => PlayerData): PlayerData => {
    let nextPlayer = playerRef.current
    setPlayer((current) => {
      nextPlayer = ensureDailyFresh(updater(ensureDailyFresh(current)))
      playerRef.current = nextPlayer
      savePlayerData(nextPlayer)
      return nextPlayer
    })
    return nextPlayer
  }, [])

  const updateDisplayName = useCallback((rawName: string) => {
    const sanitized = sanitizeDisplayName(rawName)
    commitPlayer((current) => ({ ...current, displayName: sanitized }))
  }, [commitPlayer])

  const grantAutoCheck = useCallback((amount = 1) => {
    if (amount <= 0) return
    commitPlayer((current) => ({
      ...current,
      walletAutoChecks: current.walletAutoChecks + amount,
    }))
  }, [commitPlayer])

  const spendAutoCheck = useCallback((): boolean => {
    const fresh = ensureDailyFresh(playerRef.current)
    if (fresh.walletAutoChecks <= 0) {
      return false
    }

    const nextPlayer: PlayerData = { ...fresh, walletAutoChecks: fresh.walletAutoChecks - 1 }
    playerRef.current = nextPlayer
    setPlayer(nextPlayer)
    savePlayerData(nextPlayer)
    return true
  }, [])

  const setEquippedTheme = useCallback((theme: BackgroundTheme) => {
    commitPlayer((current) => {
      if (!current.ownedThemeIds.includes(theme)) return current
      return { ...current, equippedThemeId: theme }
    })
  }, [commitPlayer])

  const rewardedAdsRemaining = Math.max(0, 5 - player.daily.rewardedAdsWatched)

  const watchSimulatedAd = useCallback(async () => {
    const adapter = new SimulatedRewardedAds({
      getRemainingToday: () => Math.max(0, 5 - ensureDailyFresh(loadPlayerData()).daily.rewardedAdsWatched),
      onReward: () => {
        commitPlayer((current) => ({
          ...current,
          walletAutoChecks: current.walletAutoChecks + 1,
          daily: {
            ...current.daily,
            rewardedAdsWatched: Math.min(5, current.daily.rewardedAdsWatched + 1),
          },
        }))
      },
    })
    return adapter.showRewardedAutoCheck()
  }, [commitPlayer])

  return {
    player,
    updateDisplayName,
    grantAutoCheck,
    spendAutoCheck,
    setEquippedTheme,
    rewardedAdsRemaining,
    watchSimulatedAd,
    commitPlayer,
  }
}
