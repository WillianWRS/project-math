/** Toca SFX depois do paint do modal para não competir com a abertura visual. */
export function playUiClickAfterPaint(play: () => void) {
  requestAnimationFrame(() => {
    play()
  })
}
