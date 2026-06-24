import { describe, expect, it } from 'vitest'
import { clipsForTier, WRITE_SFX_IDS } from './audio-types'
import type { SfxManifest } from './audio-types'

const manifest = {
  mode: 'files',
  sprite: '/audio/sfx-sprite.mp3',
  clips: {
    click: { src: '/audio/click.mp3', tier: 'critical', volume: 1 },
    gameStart: { src: '/audio/game-start.mp3', tier: 'gameplay', volume: 1 },
    gameOver: { src: '/audio/game-over.mp3', tier: 'idle', volume: 1 },
    write1: { src: '/audio/write-1.mp3', tier: 'critical', volume: 1, pool: 'write' },
  },
} as SfxManifest

describe('audio manifest tiers', () => {
  it('groups clips by preload tier', () => {
    expect(clipsForTier(manifest, 'critical')).toEqual(['click', 'write1'])
    expect(clipsForTier(manifest, 'gameplay')).toEqual(['gameStart'])
    expect(clipsForTier(manifest, 'idle')).toEqual(['gameOver'])
  })

  it('keeps seven write variations', () => {
    expect(WRITE_SFX_IDS).toHaveLength(7)
  })
})
