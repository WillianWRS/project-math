import type { BackgroundTheme } from '../platform/storage'

export interface ThemeCatalogEntry {
  id: string
  name: string
  priceCoins: number
  previewClass: string
  equippableThemeId?: BackgroundTheme
}

export const THEME_CATALOG: ThemeCatalogEntry[] = [
  { id: 'default', name: 'Padrão', priceCoins: 0, previewClass: 'settings-bg-preview--default', equippableThemeId: 'default' },
  { id: 'water', name: 'Água', priceCoins: 0, previewClass: 'settings-bg-preview--water', equippableThemeId: 'water' },
  { id: 'sunset', name: 'Sunset', priceCoins: 250, previewClass: 'shop-theme-preview--locked' },
  { id: 'forest', name: 'Forest', priceCoins: 300, previewClass: 'shop-theme-preview--locked' },
  { id: 'violet', name: 'Violet', priceCoins: 300, previewClass: 'shop-theme-preview--locked' },
  { id: 'ember', name: 'Ember', priceCoins: 350, previewClass: 'shop-theme-preview--locked' },
  { id: 'neon', name: 'Neon', priceCoins: 400, previewClass: 'shop-theme-preview--locked' },
  { id: 'midnight', name: 'Midnight', priceCoins: 450, previewClass: 'shop-theme-preview--locked' },
  { id: 'retro', name: 'Retro', priceCoins: 420, previewClass: 'shop-theme-preview--locked' },
  { id: 'ice', name: 'Ice', priceCoins: 380, previewClass: 'shop-theme-preview--locked' },
  { id: 'aurora', name: 'Aurora', priceCoins: 500, previewClass: 'shop-theme-preview--locked' },
]
