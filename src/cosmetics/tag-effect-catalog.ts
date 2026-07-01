import type { TagEffectId } from '../platform/storage'

export interface TagEffectCatalogEntry {
  id: string
  name: string
  priceCoins: number
  effectId: TagEffectId
}

export const TAG_EFFECT_CATALOG: TagEffectCatalogEntry[] = [
  { id: 'none', name: 'Sem efeito', priceCoins: 0, effectId: 'none' },
  { id: 'color-flow', name: 'Fluxo', priceCoins: 125, effectId: 'color-flow' },
  { id: 'pulse-aura', name: 'Pulsar', priceCoins: 160, effectId: 'pulse-aura' },
]

export const DEFAULT_OWNED_TAG_EFFECT_IDS: TagEffectId[] = ['none']

export const ALL_TAG_EFFECT_IDS: TagEffectId[] = TAG_EFFECT_CATALOG.map((entry) => entry.effectId)
