import { GameScreen } from './components/game/GameScreen'
import { GameProvider } from './context/GameContext'

function App() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  )
}

export default App
