import { useCallback, useEffect, useRef, useState } from 'react'
import { canStartChallenge, consumeChallengeAttempt } from '../challenges/challenge-helpers'
import { getChallengeDefinition } from '../challenges/challenge-catalog'
import { getNewlyUnlockedAchievementIds } from '../achievements/achievement-post-game'
import { resetAchievementProgress } from '../achievements/reset-achievement-progress'
import type { ChallengeModeId } from '../engine/types'
import { SimulatedRewardedAds } from '../platform/ads'
import { ensureDailyFresh } from '../platform/daily-reset'
import { applyAvatarPhotoSaved, applyShopAutoCheckPurchaseStats } from '../platform/player-lifetime-stats'
import { loadPlayerData, savePlayerData, type BackgroundTheme, type BadgeVariant, type KeypadStyleId, type PlayerData, type TagEffectId } from '../platform/storage'

export const DISPLAY_NAME_MAX_LENGTH = 20
const DAILY_REWARDED_ADS_LIMIT = 2

export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim().slice(0, DISPLAY_NAME_MAX_LENGTH)
  if (trimmed.length < 2) return 'Jogador'
  return trimmed.replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'Jogador'
}

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerData>(() => ensureDailyFresh(loadPlayerData()))
  const playerRef = useRef(player)
  const achievementUnlockListenerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    playerRef.current = player
  }, [player])

  const registerShopAchievementsListener = useCallback((listener: (() => void) | null) => {
    achievementUnlockListenerRef.current = listener
  }, [])

  const notifyAchievementUnlocks = useCallback((before: PlayerData, after: PlayerData) => {
    if (getNewlyUnlockedAchievementIds(before, after).length > 0) {
      achievementUnlockListenerRef.current?.()
    }
  }, [])

  const commitPlayer = useCallback((updater: (current: PlayerData) => PlayerData): PlayerData => {
    const current = ensureDailyFresh(playerRef.current)
    const nextPlayer = ensureDailyFresh(updater(current))
    playerRef.current = nextPlayer
    savePlayerData(nextPlayer)
    setPlayer(nextPlayer)
    return nextPlayer
  }, [])

  const updateDisplayName = useCallback((rawName: string) => {
    const sanitized = sanitizeDisplayName(rawName)
    commitPlayer((current) => ({ ...current, displayName: sanitized }))
  }, [commitPlayer])

  const updateAvatarPhoto = useCallback((avatarDataUrl: string | null) => {
    let before: PlayerData | null = null
    const after = commitPlayer((current) => {
      before = current
      let next: PlayerData = { ...current, avatarDataUrl }
      if (avatarDataUrl !== null) {
        next = applyAvatarPhotoSaved(next)
      }
      return next
    })
    if (before) {
      notifyAchievementUnlocks(before, after)
    }
  }, [commitPlayer, notifyAchievementUnlocks])

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

  const setEquippedBadge = useCallback((badge: BadgeVariant) => {
    commitPlayer((current) => {
      if (!current.ownedBadgeIds.includes(badge)) return current
      return { ...current, equippedBadgeId: badge }
    })
  }, [commitPlayer])

  const setEquippedTagEffect = useCallback((effect: TagEffectId) => {
    commitPlayer((current) => {
      if (!current.ownedTagEffectIds.includes(effect)) return current
      return { ...current, equippedTagEffectId: effect }
    })
  }, [commitPlayer])

  const setEquippedKeypadStyle = useCallback((style: KeypadStyleId) => {
    commitPlayer((current) => {
      if (!current.ownedKeypadStyleIds.includes(style)) return current
      return { ...current, equippedKeypadStyleId: style }
    })
  }, [commitPlayer])

  const purchaseTheme = useCallback((theme: BackgroundTheme, priceCoins: number): boolean => {
    if (priceCoins < 0) return false

    let purchased = false
    let before: PlayerData | null = null
    const after = commitPlayer((current) => {
      before = current
      if (current.ownedThemeIds.includes(theme)) return current
      if (current.coins < priceCoins) return current
      purchased = true
      return {
        ...current,
        coins: current.coins - priceCoins,
        ownedThemeIds: [...current.ownedThemeIds, theme],
      }
    })
    if (purchased && before) {
      notifyAchievementUnlocks(before, after)
    }
    return purchased
  }, [commitPlayer, notifyAchievementUnlocks])

  const purchaseBadge = useCallback((badge: BadgeVariant, priceCoins: number): boolean => {
    if (priceCoins < 0) return false

    let purchased = false
    let before: PlayerData | null = null
    const after = commitPlayer((current) => {
      before = current
      if (current.ownedBadgeIds.includes(badge)) return current
      if (current.coins < priceCoins) return current
      purchased = true
      return {
        ...current,
        coins: current.coins - priceCoins,
        ownedBadgeIds: [...current.ownedBadgeIds, badge],
      }
    })
    if (purchased && before) {
      notifyAchievementUnlocks(before, after)
    }
    return purchased
  }, [commitPlayer, notifyAchievementUnlocks])

  const purchaseTagEffect = useCallback((effect: TagEffectId, priceCoins: number): boolean => {
    if (priceCoins < 0) return false

    let purchased = false
    let before: PlayerData | null = null
    const after = commitPlayer((current) => {
      before = current
      if (current.ownedTagEffectIds.includes(effect)) return current
      if (current.coins < priceCoins) return current
      purchased = true
      return {
        ...current,
        coins: current.coins - priceCoins,
        ownedTagEffectIds: [...current.ownedTagEffectIds, effect],
      }
    })
    if (purchased && before) {
      notifyAchievementUnlocks(before, after)
    }
    return purchased
  }, [commitPlayer, notifyAchievementUnlocks])

  const purchaseKeypadStyle = useCallback((style: KeypadStyleId, priceCoins: number): boolean => {
    if (priceCoins < 0) return false

    let purchased = false
    let before: PlayerData | null = null
    const after = commitPlayer((current) => {
      before = current
      if (current.ownedKeypadStyleIds.includes(style)) return current
      if (current.coins < priceCoins) return current
      purchased = true
      return {
        ...current,
        coins: current.coins - priceCoins,
        ownedKeypadStyleIds: [...current.ownedKeypadStyleIds, style],
      }
    })
    if (purchased && before) {
      notifyAchievementUnlocks(before, after)
    }
    return purchased
  }, [commitPlayer, notifyAchievementUnlocks])

  const purchaseAutoCheckWithDiamonds = useCallback(
    (priceDiamonds: number, amount = 1): boolean => {
      if (priceDiamonds < 0 || amount <= 0) return false

      let purchased = false
      let before: PlayerData | null = null
      const after = commitPlayer((current) => {
        before = current
        if (current.diamonds < priceDiamonds) return current
        purchased = true
        return applyShopAutoCheckPurchaseStats({
          ...current,
          diamonds: current.diamonds - priceDiamonds,
          walletAutoChecks: current.walletAutoChecks + amount,
        })
      })
      if (purchased && before) {
        notifyAchievementUnlocks(before, after)
      }
      return purchased
    },
    [commitPlayer, notifyAchievementUnlocks],
  )

  const watchSimulatedAd = useCallback(async () => {
    const adapter = new SimulatedRewardedAds({
      getRemainingToday: () =>
        Math.max(0, DAILY_REWARDED_ADS_LIMIT - ensureDailyFresh(loadPlayerData()).daily.rewardedAdsWatched),
      onReward: () => {
        commitPlayer((current) => ({
          ...current,
          walletAutoChecks: current.walletAutoChecks + 1,
          daily: {
            ...current.daily,
            rewardedAdsWatched: Math.min(DAILY_REWARDED_ADS_LIMIT, current.daily.rewardedAdsWatched + 1),
          },
        }))
      },
    })
    return adapter.showRewardedAutoCheck()
  }, [commitPlayer])

  const rewardedAdsRemaining = Math.max(0, DAILY_REWARDED_ADS_LIMIT - player.daily.rewardedAdsWatched)

  const payChallengeEntry = useCallback((challengeId: ChallengeModeId): boolean => {
    let paid = false
    commitPlayer((current) => {
      const check = canStartChallenge(current, challengeId)
      if (!check.ok) return current
      const definition = getChallengeDefinition(challengeId)
      paid = true
      const withAttempt = consumeChallengeAttempt(current, challengeId)
      return {
        ...withAttempt,
        coins: withAttempt.coins - definition.entryCostCoins,
      }
    })
    return paid
  }, [commitPlayer])

  const resetAchievements = useCallback(() => {
    commitPlayer((current) => resetAchievementProgress(current))
  }, [commitPlayer])

  return {
    player,
    updateDisplayName,
    updateAvatarPhoto,
    grantAutoCheck,
    spendAutoCheck,
    setEquippedTheme,
    setEquippedBadge,
    setEquippedTagEffect,
    setEquippedKeypadStyle,
    purchaseTheme,
    purchaseBadge,
    purchaseTagEffect,
    purchaseKeypadStyle,
    purchaseAutoCheckWithDiamonds,
    rewardedAdsRemaining,
    watchSimulatedAd,
    payChallengeEntry,
    commitPlayer,
    registerShopAchievementsListener,
    notifyAchievementUnlocks,
    resetAchievements,
  }
}
