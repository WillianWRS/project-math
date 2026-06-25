export function isIPhone(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPod/i.test(navigator.userAgent)
}
