/** Pré-carrega modais raros (lazy). Menu modals vão no bundle principal. */
export function preloadGameplayModals() {
  void import('../components/modals/RewardedAutoCheckModal')
  void import('../components/modals/AutoCheckTimeoutModal')
}
