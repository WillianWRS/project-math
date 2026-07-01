import { PlayerModal } from '../modals/PlayerModal'
import { AchievementsModal } from '../modals/AchievementsModal'
import { ShopModal } from '../modals/ShopModal'
import { SettingsModal } from '../modals/SettingsModal'
import { lazy, memo, Suspense } from 'react'
import { Modal } from '../ui/Modal'
import type { BackgroundTheme, BadgeVariant, KeypadStyleId, PlayerData, ScoreRecord, TagEffectId } from '../../platform/storage'

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
  achievementsOpen: boolean
  timeoutModalOpen: boolean
  exitConfirmOpen: boolean
  player: PlayerData
  topScores: ScoreRecord[]
  godModeEnabled: boolean
  showGodModeToggle: boolean
  soundEnabled: boolean
  devModeEnabled: boolean
  rewardedAdsWatched: number
  onClosePlayer: () => void
  onCloseShop: () => void
  onCloseSettings: () => void
  onCloseRewarded: () => void
  onCloseAchievements: () => void
  onOpenRewardedFromPlayer: () => void
  onOpenAchievementsFromPlayer: () => void
  onOpenAvatarPicker: () => void
  avatarBorderLevel: 1 | 2 | 3 | 4 | 5
  onSaveDisplayName: (name: string) => void
  onBuyTheme: (theme: BackgroundTheme, priceCoins: number) => boolean
  onEquipBadge: (badge: BadgeVariant) => void
  onBuyBadge: (badge: BadgeVariant, priceCoins: number) => boolean
  onEquipTagEffect: (effect: TagEffectId) => void
  onBuyTagEffect: (effect: TagEffectId, priceCoins: number) => boolean
  onEquipKeypadStyle: (style: KeypadStyleId) => void
  onBuyKeypadStyle: (style: KeypadStyleId, priceCoins: number) => boolean
  onBuyAutoCheck: (priceDiamonds: number, amount: number) => boolean
  onSoundChange: (enabled: boolean) => void
  onDevModeChange: (enabled: boolean) => void
  onGodModeChange: (enabled: boolean) => void
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
  onWatchRewardedAd: () => Promise<'completed' | 'dismissed' | 'limit'>
  onUseAutoCheckAtTimeout: () => void
  onDeclineAutoCheckAtTimeout: () => void
  onCloseExitConfirm: () => void
  onConfirmExit: () => void
  onResetAchievements?: () => void
}

function GameModalLayerInner({
  playerOpen,
  shopOpen,
  settingsOpen,
  rewardedOpen,
  achievementsOpen,
  timeoutModalOpen,
  exitConfirmOpen,
  player,
  topScores,
  godModeEnabled,
  showGodModeToggle,
  soundEnabled,
  devModeEnabled,
  rewardedAdsWatched,
  onClosePlayer,
  onCloseShop,
  onCloseSettings,
  onCloseRewarded,
  onCloseAchievements,
  onOpenRewardedFromPlayer,
  onOpenAchievementsFromPlayer,
  onOpenAvatarPicker,
  avatarBorderLevel,
  onSaveDisplayName,
  onBuyTheme,
  onEquipBadge,
  onBuyBadge,
  onEquipTagEffect,
  onBuyTagEffect,
  onEquipKeypadStyle,
  onBuyKeypadStyle,
  onBuyAutoCheck,
  onSoundChange,
  onDevModeChange,
  onGodModeChange,
  onBackgroundThemeChange,
  onWatchRewardedAd,
  onUseAutoCheckAtTimeout,
  onDeclineAutoCheckAtTimeout,
  onCloseExitConfirm,
  onConfirmExit,
  onResetAchievements,
}: GameModalLayerProps) {
  return (
    <>
      <PlayerModal
        open={playerOpen}
        onClose={onClosePlayer}
        player={player}
        topScores={topScores}
        avatarBorderLevel={avatarBorderLevel}
        onSaveName={onSaveDisplayName}
        onOpenAvatarPicker={onOpenAvatarPicker}
        onOpenRewardedModal={onOpenRewardedFromPlayer}
        onOpenAchievements={onOpenAchievementsFromPlayer}
      />

      <AchievementsModal open={achievementsOpen} player={player} onClose={onCloseAchievements} />

      <ShopModal
        open={shopOpen}
        onClose={onCloseShop}
        player={player}
        godModeEnabled={godModeEnabled}
        onBuyTheme={onBuyTheme}
        onEquipTheme={onBackgroundThemeChange}
        onBuyBadge={onBuyBadge}
        onEquipBadge={onEquipBadge}
        onBuyTagEffect={onBuyTagEffect}
        onEquipTagEffect={onEquipTagEffect}
        onBuyKeypadStyle={onBuyKeypadStyle}
        onEquipKeypadStyle={onEquipKeypadStyle}
        onBuyAutoCheck={onBuyAutoCheck}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={onCloseSettings}
        soundEnabled={soundEnabled}
        onSoundChange={onSoundChange}
        devModeEnabled={devModeEnabled}
        onDevModeChange={onDevModeChange}
        godModeEnabled={godModeEnabled}
        onGodModeChange={onGodModeChange}
        showGodModeToggle={showGodModeToggle}
        onResetAchievements={onResetAchievements}
      />

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

      <Modal open={exitConfirmOpen} title="Sair do jogo?" onClose={onCloseExitConfirm}>
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
    </>
  )
}

export const GameModalLayer = memo(GameModalLayerInner)
