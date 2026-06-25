import { PlayerModal } from '../modals/PlayerModal'
import { ShopModal } from '../modals/ShopModal'
import { SettingsModal } from '../modals/SettingsModal'
import { lazy, memo, Suspense } from 'react'
import { Modal } from '../ui/Modal'
import type { BackgroundTheme, PlayerData, ScoreRecord } from '../../platform/storage'

const RewardedAutoCheckModal = lazy(() =>
  import('../modals/RewardedAutoCheckModal').then((m) => ({ default: m.RewardedAutoCheckModal })),
)
const AutoCheckTimeoutModal = lazy(() =>
  import('../modals/AutoCheckTimeoutModal').then((m) => ({ default: m.AutoCheckTimeoutModal })),
)

export interface GameModalLayerProps {
  playerOpen: boolean
  shopOpen: boolean
  settingsOpen: boolean
  rewardedOpen: boolean
  timeoutModalOpen: boolean
  exitConfirmOpen: boolean
  player: PlayerData
  topScores: ScoreRecord[]
  godModeEnabled: boolean
  showGodModeToggle: boolean
  soundEnabled: boolean
  devModeEnabled: boolean
  backgroundTheme: BackgroundTheme
  settingsThemeIds: BackgroundTheme[]
  rewardedAdsWatched: number
  onClosePlayer: () => void
  onCloseShop: () => void
  onCloseSettings: () => void
  onCloseRewarded: () => void
  onOpenRewardedFromPlayer: () => void
  onSaveDisplayName: (name: string) => void
  onBuyTheme: (theme: BackgroundTheme, priceCoins: number) => boolean
  onSoundChange: (enabled: boolean) => void
  onDevModeChange: (enabled: boolean) => void
  onGodModeChange: (enabled: boolean) => void
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
  onWatchRewardedAd: () => Promise<'completed' | 'dismissed' | 'limit'>
  onUseAutoCheckAtTimeout: () => void
  onDeclineAutoCheckAtTimeout: () => void
  onCloseExitConfirm: () => void
  onConfirmExit: () => void
}

function GameModalLayerInner({
  playerOpen,
  shopOpen,
  settingsOpen,
  rewardedOpen,
  timeoutModalOpen,
  exitConfirmOpen,
  player,
  topScores,
  godModeEnabled,
  showGodModeToggle,
  soundEnabled,
  devModeEnabled,
  backgroundTheme,
  settingsThemeIds,
  rewardedAdsWatched,
  onClosePlayer,
  onCloseShop,
  onCloseSettings,
  onCloseRewarded,
  onOpenRewardedFromPlayer,
  onSaveDisplayName,
  onBuyTheme,
  onSoundChange,
  onDevModeChange,
  onGodModeChange,
  onBackgroundThemeChange,
  onWatchRewardedAd,
  onUseAutoCheckAtTimeout,
  onDeclineAutoCheckAtTimeout,
  onCloseExitConfirm,
  onConfirmExit,
}: GameModalLayerProps) {
  return (
    <>
      {playerOpen && (
        <PlayerModal
          open
          onClose={onClosePlayer}
          player={player}
          topScores={topScores}
          onSaveName={onSaveDisplayName}
          onOpenRewardedModal={onOpenRewardedFromPlayer}
        />
      )}

      {shopOpen && (
        <ShopModal
          open
          onClose={onCloseShop}
          player={player}
          godModeEnabled={godModeEnabled}
          onBuyTheme={onBuyTheme}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          open
          onClose={onCloseSettings}
          soundEnabled={soundEnabled}
          onSoundChange={onSoundChange}
          devModeEnabled={devModeEnabled}
          onDevModeChange={onDevModeChange}
          godModeEnabled={godModeEnabled}
          onGodModeChange={onGodModeChange}
          showGodModeToggle={showGodModeToggle}
          backgroundTheme={backgroundTheme}
          ownedThemeIds={settingsThemeIds}
          onBackgroundThemeChange={onBackgroundThemeChange}
        />
      )}

      {rewardedOpen && (
        <Suspense fallback={null}>
          <RewardedAutoCheckModal
            open
            onClose={onCloseRewarded}
            watchedToday={rewardedAdsWatched}
            onWatchAd={onWatchRewardedAd}
          />
        </Suspense>
      )}

      {timeoutModalOpen && (
        <Suspense fallback={null}>
          <AutoCheckTimeoutModal
            open
            walletAutoChecks={player.walletAutoChecks}
            onUse={onUseAutoCheckAtTimeout}
            onDecline={onDeclineAutoCheckAtTimeout}
          />
        </Suspense>
      )}

      {exitConfirmOpen && (
        <Modal open title="Sair do jogo?" onClose={onCloseExitConfirm}>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-200">
              Deseja sair mesmo ou continuar no menu?
            </p>
            <button
              type="button"
              onClick={onConfirmExit}
              className="game-btn-push game-btn-push-amber w-full rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-amber-950"
            >
              Sair
            </button>
            <button
              type="button"
              onClick={onCloseExitConfirm}
              className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
            >
              Continuar
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export const GameModalLayer = memo(GameModalLayerInner)
