import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Home } from './views/Home/Home';
import { WorldMap } from './views/WorldMap/WorldMap';
import { GameColors } from './views/GameColors/GameColors';
import { GameShapes } from './views/GameShapes/GameShapes';
import { GameNumbers } from './views/GameNumbers/GameNumbers';
import { GameLetters } from './views/GameLetters/GameLetters';
import { GameAnimals } from './views/GameAnimals/GameAnimals';
import { GameCounting } from './views/GameCounting/GameCounting';
import { GameSizes } from './views/GameSizes/GameSizes';
import { GameSequence } from './views/GameSequence/GameSequence';
import { GamePositions } from './views/GamePositions/GamePositions';

const GameRouter: React.FC = () => {
  const { currentView } = useGame();

  switch (currentView) {
    case 'home':
      return <Home />;
    case 'map':
      return <WorldMap />;
    case 'colors':
      return <GameColors />;
    case 'shapes':
      return <GameShapes />;
    case 'numbers':
      return <GameNumbers />;
    case 'letters':
      return <GameLetters />;
    case 'animals':
      return <GameAnimals />;
    case 'counting':
      return <GameCounting />;
    case 'sizes':
      return <GameSizes />;
    case 'sequence':
      return <GameSequence />;
    case 'positions':
      return <GamePositions />;
    default:
      return <Home />;
  }
};

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
