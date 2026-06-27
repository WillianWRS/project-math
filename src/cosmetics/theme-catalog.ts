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
  { id: 'sunset', name: 'Pôr do sol', priceCoins: 160, previewClass: 'settings-bg-preview--sunset', equippableThemeId: 'sunset' },
  { id: 'forest', name: 'Floresta', priceCoins: 190, previewClass: 'settings-bg-preview--forest', equippableThemeId: 'forest' },
  { id: 'violet', name: 'Violeta', priceCoins: 190, previewClass: 'settings-bg-preview--violet', equippableThemeId: 'violet' },
  { id: 'ember', name: 'Brasa', priceCoins: 220, previewClass: 'settings-bg-preview--ember', equippableThemeId: 'ember' },
  { id: 'neon', name: 'Neon', priceCoins: 240, previewClass: 'settings-bg-preview--neon', equippableThemeId: 'neon' },
  { id: 'midnight', name: 'Meia-noite', priceCoins: 270, previewClass: 'settings-bg-preview--midnight', equippableThemeId: 'midnight' },
  { id: 'retro', name: 'Retro', priceCoins: 250, previewClass: 'settings-bg-preview--retro', equippableThemeId: 'retro' },
  { id: 'ice', name: 'Gelo', priceCoins: 230, previewClass: 'settings-bg-preview--ice', equippableThemeId: 'ice' },
  { id: 'aurora', name: 'Aurora', priceCoins: 320, previewClass: 'settings-bg-preview--aurora', equippableThemeId: 'aurora' },
]

export function getThemePurchasePrice(priceCoins: number, godModeEnabled: boolean): number {
  if (!godModeEnabled || priceCoins <= 0) return priceCoins
  return 1
}

const THEME_GPU_TIER: Record<BackgroundTheme, 'light' | 'heavy'> = {
  default: 'light',
  water: 'light',
  sunset: 'light',
  forest: 'light',
  midnight: 'light',
  ice: 'light',
  aurora: 'light',
  violet: 'heavy',
  ember: 'heavy',
  neon: 'heavy',
  retro: 'heavy',
}

export function getThemeGpuTier(theme: BackgroundTheme): 'light' | 'heavy' {
  return THEME_GPU_TIER[theme] ?? 'light'
}

export function getThemeDisplayName(theme: BackgroundTheme): string {
  return THEME_CATALOG.find((entry) => entry.equippableThemeId === theme)?.name ?? theme
}
