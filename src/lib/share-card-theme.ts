import type { BackgroundTheme } from '../platform/storage'

export interface ShareCardThemeStyle {
  rootClass: 'share-card--default' | 'share-card--water'
  panelClass: 'share-card__panel--default' | 'share-card__panel--water'
  captureBackground: string
}

export function getShareCardThemeStyle(theme: BackgroundTheme): ShareCardThemeStyle {
  if (theme === 'water') {
    return {
      rootClass: 'share-card--water',
      panelClass: 'share-card__panel--water',
      captureBackground: '#6ec5eb',
    }
  }

  return {
    rootClass: 'share-card--default',
    panelClass: 'share-card__panel--default',
    captureBackground: '#141210',
  }
}
