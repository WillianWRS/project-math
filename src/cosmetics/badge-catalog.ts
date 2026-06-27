import type { BadgeVariant } from '../platform/storage'

export interface BadgeCatalogEntry {
  id: string
  name: string
  priceCoins: number
  badgeId: BadgeVariant
}

export const BADGE_CATALOG: BadgeCatalogEntry[] = [
  { id: 'default-ring', name: 'Normal', priceCoins: 0, badgeId: 'default-ring' },
  { id: 'double-ring', name: 'Seta', priceCoins: 130, badgeId: 'double-ring' },
  { id: 'shield', name: 'Espinho', priceCoins: 200, badgeId: 'shield' },
]
