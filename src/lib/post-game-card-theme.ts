import type { BackgroundTheme } from '../platform/storage'

export interface ShareCardThemeStyle {
  rootClass: `share-card--${BackgroundTheme}`
  panelClass: `share-card__panel--${BackgroundTheme}`
  captureBackground: string
}

const CAPTURE_BACKGROUND: Record<BackgroundTheme, string> = {
  default: '#141210',
  water: '#6ec5eb',
  sunset: '#d45b7a',
  forest: '#2d5a3d',
  violet: '#4c1d95',
  ember: '#16101c',
  neon: '#0d1f4a',
  midnight: '#122a45',
  retro: '#1f1810',
  ice: '#bae6fd',
  aurora: '#d1fae5',
}

export const LIGHT_POST_GAME_CARD_THEMES: readonly BackgroundTheme[] = [
  'water',
  'sunset',
  'forest',
  'ice',
  'aurora',
]

export function isLightPostGameCardTheme(theme: BackgroundTheme): boolean {
  return LIGHT_POST_GAME_CARD_THEMES.includes(theme)
}

export function getGameOverCardThemeClass(theme: BackgroundTheme): string {
  return `game-over-card--${theme}`
}

export function getShareCardThemeStyle(theme: BackgroundTheme): ShareCardThemeStyle {
  return {
    rootClass: `share-card--${theme}`,
    panelClass: `share-card__panel--${theme}`,
    captureBackground: CAPTURE_BACKGROUND[theme],
  }
}
