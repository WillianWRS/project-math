import type { BackgroundTheme } from '../platform/storage'

export interface ShareCardThemeStyle {
  rootClass: 'share-card--default' | 'share-card--water' | 'share-card--sunset'
  panelClass: 'share-card__panel--default' | 'share-card__panel--water' | 'share-card__panel--sunset'
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

  if (theme === 'sunset') {
    return {
      rootClass: 'share-card--sunset',
      panelClass: 'share-card__panel--sunset',
      captureBackground: '#d45b7a',
    }
  }

  return {
    rootClass: 'share-card--default',
    panelClass: 'share-card__panel--default',
    captureBackground: '#141210',
  }
}
