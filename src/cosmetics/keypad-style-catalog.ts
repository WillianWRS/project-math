import type { KeypadStyleId } from '../platform/storage'

export interface KeypadStyleCatalogEntry {
  id: string
  name: string
  priceCoins: number
  styleId: KeypadStyleId
}

export const KEYPAD_STYLE_CATALOG: KeypadStyleCatalogEntry[] = [
  { id: 'default', name: 'Padrão', priceCoins: 0, styleId: 'default' },
  { id: 'chamfer', name: 'Retangular', priceCoins: 135, styleId: 'chamfer' },
  { id: 'hex-point', name: 'Hexagonal', priceCoins: 170, styleId: 'hex-point' },
]

export const DEFAULT_OWNED_KEYPAD_STYLE_IDS: KeypadStyleId[] = ['default']

export const ALL_KEYPAD_STYLE_IDS: KeypadStyleId[] = KEYPAD_STYLE_CATALOG.map((entry) => entry.styleId)
