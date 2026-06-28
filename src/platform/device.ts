/** iPhone, iPod e iPad (inclui iPadOS com UA de Mac + touch). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  if (/iPhone|iPod|iPad/i.test(ua)) return true

  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** @deprecated Prefer `isIOS()` — mesmas restrições de áudio valem para iPad. */
export function isIPhone(): boolean {
  return isIOS()
}
