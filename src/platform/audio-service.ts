import {
  playClip,
  playRandomWriteClip,
  preloadAudioTier,
  preloadAudioTierIdle,
  unlockAudioContext,
  unlockAudioContextSync,
} from './audio-engine'
import type { SfxId } from './audio-types'

export type { SfxId } from './audio-types'

export function unlockAudio(): Promise<void> {
  return unlockAudioContext()
}

export function unlockAudioSync(): void {
  unlockAudioContextSync()
}

/** @deprecated Prefer tiered preload helpers below. */
export function preloadSfx(): void {
  void preloadAudioTier('critical')
  preloadAudioTierIdle('gameplay')
  preloadAudioTierIdle('idle')
}

export function preloadAudioCritical(): Promise<void> {
  return preloadAudioTier('critical')
}

export function preloadAudioGameplay(): Promise<void> {
  return preloadAudioTier('gameplay')
}

export function preloadAudioIdle(): void {
  preloadAudioTierIdle('idle')
}

export function playSfx(id: SfxId, enabled: boolean): void {
  playClip(id, enabled)
}

export function playCorrectAnswerSfx(
  gameChangerActive: boolean,
  enabled: boolean,
  fromAutoCheck = false,
): void {
  if (!enabled) return
  if (fromAutoCheck) {
    playSfx('autoCheck', enabled)
    return
  }
  if (gameChangerActive) {
    playSfx('gameChanger', enabled)
    return
  }
  playSfx('success', enabled)
}

export function playRandomWriteSfx(enabled: boolean): void {
  playRandomWriteClip(enabled)
}
