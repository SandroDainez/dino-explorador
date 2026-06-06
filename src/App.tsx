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
    default:
      return <Home />;
  }
};

function App() {
  React.useEffect(() => {
    const unlockSpeech = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('Speech unlock failed:', e);
        }
        window.removeEventListener('click', unlockSpeech);
        window.removeEventListener('touchstart', unlockSpeech);
      }
    };
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.addEventListener('click', unlockSpeech);
      window.addEventListener('touchstart', unlockSpeech);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', unlockSpeech);
        window.removeEventListener('touchstart', unlockSpeech);
      }
    };
  }, []);

  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
