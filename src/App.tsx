import { GameScreen } from './components/game/GameScreen'
import { useGame } from './hooks/useGame'

function App() {
  const game = useGame()

  return (
    <GameScreen
      session={game.session}
      topScores={game.topScores}
      player={game.player}
      lastGameRewards={game.lastGameRewards}
      benchmarkMode={game.benchmarkMode}
      benchmarkMetrics={game.benchmarkMetrics}
      benchmarkVirtualKeypadPress={game.benchmarkVirtualKeypadPress}
      soundEnabled={game.soundEnabled}
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
      onBackgroundThemeChange={game.setBackgroundTheme}
      onSaveDisplayName={game.updateDisplayName}
      onWatchRewardedAd={game.watchSimulatedAd}
      rewardedAdsWatched={game.player.daily.rewardedAdsWatched}
      onPlayClick={game.playClick}
      onPlayGameStart={game.playGameStart}
      onPlayWriteKey={game.playWriteKey}
      onPlayEraseKey={game.playEraseKey}
      onPlayGoToMenu={game.playGoToMenu}
    />
  )
}

export default App
