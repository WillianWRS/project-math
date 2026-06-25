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
  { id: 'sunset', name: 'Sunset', priceCoins: 250, previewClass: 'settings-bg-preview--sunset', equippableThemeId: 'sunset' },
  { id: 'forest', name: 'Forest', priceCoins: 300, previewClass: 'settings-bg-preview--forest', equippableThemeId: 'forest' },
  { id: 'violet', name: 'Violet', priceCoins: 300, previewClass: 'settings-bg-preview--violet', equippableThemeId: 'violet' },
  { id: 'ember', name: 'Ember', priceCoins: 350, previewClass: 'settings-bg-preview--ember', equippableThemeId: 'ember' },
  { id: 'neon', name: 'Neon', priceCoins: 400, previewClass: 'settings-bg-preview--neon', equippableThemeId: 'neon' },
  { id: 'midnight', name: 'Midnight', priceCoins: 450, previewClass: 'settings-bg-preview--midnight', equippableThemeId: 'midnight' },
  { id: 'retro', name: 'Retro', priceCoins: 420, previewClass: 'settings-bg-preview--retro', equippableThemeId: 'retro' },
  { id: 'ice', name: 'Ice', priceCoins: 380, previewClass: 'settings-bg-preview--ice', equippableThemeId: 'ice' },
  { id: 'aurora', name: 'Aurora', priceCoins: 500, previewClass: 'settings-bg-preview--aurora', equippableThemeId: 'aurora' },
]

export function getThemePurchasePrice(priceCoins: number, godModeEnabled: boolean): number {
  if (!godModeEnabled || priceCoins <= 0) return priceCoins
  return 1
}
