import { GameScreen } from './components/game/GameScreen'
import { useGame } from './hooks/useGame'

function App() {
  const game = useGame()

  return (
    <GameScreen
      session={game.session}
      inputValue={game.inputValue}
      topScores={game.topScores}
      player={game.player}
      lastGameRewards={game.lastGameRewards}
      benchmarkMode={game.benchmarkMode}
      perfectAnswerToken={game.perfectAnswerToken}
      benchmarkMetrics={game.benchmarkMetrics}
      benchmarkVirtualKeypadPress={game.benchmarkVirtualKeypadPress}
      soundEnabled={game.soundEnabled}
      menuAudioReady={game.menuAudioReady}
      menuAudioPrefetchComplete={game.menuAudioPrefetchComplete}
      devModeEnabled={game.devModeEnabled}
      godModeEnabled={game.godModeEnabled}
      showGodModeToggle={game.showGodModeToggle}
      backgroundTheme={game.backgroundTheme}
      onStart={game.onStart}
      onStartBenchmarkSession={game.onStartBenchmarkSession}
      onReturnToMenu={game.onReturnToMenu}
      onConfirm={game.onConfirm}
      onAutoCorrect={game.onAutoCorrect}
      onUseAutoCheckAtTimeout={game.onUseAutoCheckAtTimeout}
      onDeclineAutoCheckAtTimeout={game.onDeclineAutoCheckAtTimeout}
      onInputChange={game.onInputChange}
      onSoundChange={game.toggleSound}
      onDevModeChange={game.toggleDevMode}
      onGodModeChange={game.toggleGodMode}
      onBackgroundThemeChange={game.setBackgroundTheme}
      onBuyTheme={game.buyTheme}
      onEquipBadge={game.setEquippedBadge}
      onBuyBadge={game.purchaseBadge}
      onSaveDisplayName={game.updateDisplayName}
      onSaveAvatarPhoto={game.updateAvatarPhoto}
      onWatchRewardedAd={game.watchSimulatedAd}
      rewardedAdsWatched={game.player.daily.rewardedAdsWatched}
      onPlayClick={game.playClick}
      onPlayGameStart={game.playGameStart}
      onPlayWriteKey={game.playWriteKey}
      onPlayEraseKey={game.playEraseKey}
      onPlayGoToMenu={game.playGoToMenu}
      onCompleteTutorial={game.completeTutorial}
    />
  )
}

export default App
