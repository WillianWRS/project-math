import { describe, expect, it } from 'vitest'
import { isSceneAmbientDecorPaused, isSceneModalDecorPaused } from '../../src/lib/scene-decor-pause'

describe('scene decor pause', () => {
  it('pauses ambient decor when a modal is open', () => {
    expect(
      isSceneAmbientDecorPaused({ anyModalOpen: true, presentation: 'menu' }),
    ).toBe(true)
  })

  it('pauses ambient decor during in-game', () => {
    expect(
      isSceneAmbientDecorPaused({ anyModalOpen: false, presentation: 'in-game' }),
    ).toBe(true)
  })

  it('keeps ambient decor on menu without modal', () => {
    expect(
      isSceneAmbientDecorPaused({ anyModalOpen: false, presentation: 'menu' }),
    ).toBe(false)
  })

  it('pauses modal-only decor only when a modal is open', () => {
    expect(isSceneModalDecorPaused({ anyModalOpen: true })).toBe(true)
    expect(isSceneModalDecorPaused({ anyModalOpen: false })).toBe(false)
  })
})
