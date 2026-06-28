import { isIOS } from '../platform/device'
import { unlockAudioSync } from '../platform/audio-service'

/**
 * Toca SFX depois do paint do modal para não competir com a abertura visual.
 * No iOS/Safari o som precisa disparar no turno síncrono do gesto — sem rAF.
 */
export function playUiClickAfterPaint(play: () => void) {
  if (isIOS()) {
    unlockAudioSync()
    play()
    return
  }

  requestAnimationFrame(() => {
    play()
  })
}

/** Unlock síncrono no pointerdown — use em botões críticos no iOS antes do onClick. */
export function primeAudioOnPointerDown(): void {
  if (isIOS()) {
    unlockAudioSync()
  }
}
