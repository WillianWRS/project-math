import { BADGE_CATALOG } from '../cosmetics/badge-catalog'
import { KEYPAD_STYLE_CATALOG } from '../cosmetics/keypad-style-catalog'
import { TAG_EFFECT_CATALOG } from '../cosmetics/tag-effect-catalog'
import { THEME_CATALOG } from '../cosmetics/theme-catalog'
import type { PlayerData } from '../platform/storage'

export const SHOP_CATEGORY_COUNT = 4

export const PAID_SHOP_ITEM_COUNT =
  THEME_CATALOG.filter((entry) => entry.priceCoins > 0 && entry.equippableThemeId).length +
  BADGE_CATALOG.filter((entry) => entry.priceCoins > 0).length +
  TAG_EFFECT_CATALOG.filter((entry) => entry.priceCoins > 0).length +
  KEYPAD_STYLE_CATALOG.filter((entry) => entry.priceCoins > 0).length

export function getPaidThemeIds(): string[] {
  return THEME_CATALOG.filter(
    (entry) => entry.priceCoins > 0 && entry.equippableThemeId,
  ).map((entry) => entry.equippableThemeId!)
}

export function getPaidBadgeIds(): string[] {
  return BADGE_CATALOG.filter((entry) => entry.priceCoins > 0).map((entry) => entry.badgeId)
}

export function getPaidTagEffectIds(): string[] {
  return TAG_EFFECT_CATALOG.filter((entry) => entry.priceCoins > 0).map((entry) => entry.effectId)
}

export function getPaidKeypadStyleIds(): string[] {
  return KEYPAD_STYLE_CATALOG.filter((entry) => entry.priceCoins > 0).map((entry) => entry.styleId)
}

export function countOwnedPaidThemes(player: PlayerData): number {
  const paidIds = new Set(getPaidThemeIds())
  return player.ownedThemeIds.filter((id) => paidIds.has(id)).length
}

export function countOwnedPaidBadges(player: PlayerData): number {
  const paidIds = new Set(getPaidBadgeIds())
  return player.ownedBadgeIds.filter((id) => paidIds.has(id)).length
}

export function countOwnedPaidTagEffects(player: PlayerData): number {
  const paidIds = new Set(getPaidTagEffectIds())
  return player.ownedTagEffectIds.filter((id) => paidIds.has(id)).length
}

export function countOwnedPaidKeypadStyles(player: PlayerData): number {
  const paidIds = new Set(getPaidKeypadStyleIds())
  return player.ownedKeypadStyleIds.filter((id) => paidIds.has(id)).length
}

export function countOwnedPaidShopItems(player: PlayerData): number {
  return (
    countOwnedPaidThemes(player) +
    countOwnedPaidBadges(player) +
    countOwnedPaidTagEffects(player) +
    countOwnedPaidKeypadStyles(player)
  )
}

export function hasOwnedPaidTheme(player: PlayerData): boolean {
  return countOwnedPaidThemes(player) > 0
}

export function hasOwnedPaidBadge(player: PlayerData): boolean {
  return countOwnedPaidBadges(player) > 0
}

export function hasOwnedPaidTagEffect(player: PlayerData): boolean {
  return countOwnedPaidTagEffects(player) > 0
}

export function hasOwnedPaidKeypadStyle(player: PlayerData): boolean {
  return countOwnedPaidKeypadStyles(player) > 0
}

export function countShopCategoriesCompleted(player: PlayerData): number {
  let count = 0
  if (hasOwnedPaidTheme(player)) count += 1
  if (hasOwnedPaidBadge(player)) count += 1
  if (hasOwnedPaidTagEffect(player)) count += 1
  if (hasOwnedPaidKeypadStyle(player)) count += 1
  return count
}
