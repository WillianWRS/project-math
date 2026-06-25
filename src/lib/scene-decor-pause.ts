export type ScenePresentation = 'menu' | 'opening' | 'in-game' | 'theme-test' | 'closing'

export interface SceneDecorPauseInput {
  anyModalOpen: boolean
  presentation: ScenePresentation
}

/** Pausa camada de fundo (parallax, água) e decoração ambiente do campo de jogo. */
export function isSceneAmbientDecorPaused({ anyModalOpen, presentation }: SceneDecorPauseInput): boolean {
  return anyModalOpen || presentation === 'in-game'
}

/** Pausa decorações extras visíveis no menu (side cards, etc.) quando um modal cobre a cena. */
export function isSceneModalDecorPaused({ anyModalOpen }: Pick<SceneDecorPauseInput, 'anyModalOpen'>): boolean {
  return anyModalOpen
}

export const SCENE_BG_MENU = { x: 22, y: -12, scale: 1.04, opacity: 0.9 } as const
export const SCENE_BG_INGAME = { x: 0, y: 0, scale: 1, opacity: 1 } as const
export const SCENE_BG_STATIC = { x: 0, y: 0, scale: 1, opacity: 1 } as const
