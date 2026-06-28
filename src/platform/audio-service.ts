import {
  installAudioLifecycleHooks,
  isAudioUnlocked,
  isMenuAudioReady,
  playClip,
  playRandomWriteClip,
  prefetchMenuAudioBytes,
  prepareMenuAudio,
  preloadAudioTierIdle,
  unlockAudioFromUserGesture,
  unlockAudioContextSync,
} from './audio-engine'
import type { SfxId } from './audio-types'

export type { SfxId } from './audio-types'

export {
  installAudioLifecycleHooks,
  isAudioUnlocked,
  isMenuAudioReady,
  unlockAudioFromUserGesture,
}

export function unlockAudioSync(): void {
  unlockAudioContextSync()
}

export function preloadAudioIdle(): void {
  preloadAudioTierIdle('idle')
}

export function prefetchMenuAudio(): Promise<void> {
  return prefetchMenuAudioBytes()
}

export function hydrateMenuAudio(): Promise<boolean> {
  return prepareMenuAudio()
}

export function playSfx(id: SfxId, enabled: boolean): void {
  unlockAudioContextSync()
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
  unlockAudioContextSync()
  playRandomWriteClip(enabled)
}
