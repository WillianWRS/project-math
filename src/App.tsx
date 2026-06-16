import { GameScreen } from './components/game/GameScreen'
import { useGame } from './hooks/useGame'

function App() {
  const game = useGame()

  return (
    <GameScreen
      session={game.session}
      highScore={game.highScore}
      soundEnabled={game.soundEnabled}
      backgroundTheme={game.backgroundTheme}
      onStart={game.onStart}
      onReturnToMenu={game.onReturnToMenu}
      onConfirm={game.onConfirm}
      onInputChange={game.onInputChange}
      onSoundChange={game.toggleSound}
      onBackgroundThemeChange={game.setBackgroundTheme}
    />
  )
}

export default App
