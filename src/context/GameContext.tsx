import React, { createContext, useContext, useState, useEffect } from 'react';

export type DinoType = 'trex' | 'triceratops' | 'pterodactyl';
export type DinoColor = 'green' | 'pink' | 'blue' | 'orange';
export type DinoAccessory = 'none' | 'hat' | 'glasses' | 'bowtie';

export interface DinoConfig {
  type: DinoType;
  color: DinoColor;
  accessory: DinoAccessory;
}

export type GameView = 'home' | 'map' | 'colors' | 'shapes' | 'numbers' | 'letters' | 'animals' | 'counting';

export interface GameProgress {
  stars: Record<string, number>;
  medals: string[];
  completedWorlds: string[];
}

interface GameContextType {
  dino: DinoConfig;
  progress: GameProgress;
  soundEnabled: boolean;
  speechEnabled: boolean;
  currentView: GameView;
  updateDinoConfig: (config: Partial<DinoConfig>) => void;
  completeWorld: (worldId: string, starsEarned: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setCurrentView: (view: GameView) => void;
  resetGame: () => void;
}

const defaultDino: DinoConfig = {
  type: 'trex',
  color: 'green',
  accessory: 'none',
};

const defaultProgress: GameProgress = {
  stars: {
    colors: 0,
    shapes: 0,
    numbers: 0,
    letters: 0,
    animals: 0,
    counting: 0,
  },
  medals: [],
  completedWorlds: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dino, setDino] = useState<DinoConfig>(() => {
    const saved = localStorage.getItem('dino_explorador_dino');
    return saved ? JSON.parse(saved) : defaultDino;
  });

  const [progress, setProgress] = useState<GameProgress>(() => {
    const saved = localStorage.getItem('dino_explorador_progress');
    return saved ? JSON.parse(saved) : defaultProgress;
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('dino_explorador_sound');
    return saved ? JSON.parse(saved) : true;
  });

  const [speechEnabled, setSpeechEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('dino_explorador_speech');
    return saved ? JSON.parse(saved) : true;
  });

  const [currentView, setCurrentViewState] = useState<GameView>('home');

  useEffect(() => {
    localStorage.setItem('dino_explorador_dino', JSON.stringify(dino));
  }, [dino]);

  useEffect(() => {
    localStorage.setItem('dino_explorador_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('dino_explorador_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('dino_explorador_speech', JSON.stringify(speechEnabled));
  }, [speechEnabled]);

  const updateDinoConfig = (config: Partial<DinoConfig>) => {
    setDino((prev) => ({ ...prev, ...config }));
  };

  const completeWorld = (worldId: string, starsEarned: number) => {
    setProgress((prev) => {
      const currentStars = prev.stars[worldId] || 0;
      const newStars = Math.max(currentStars, starsEarned);
      const stars = { ...prev.stars, [worldId]: newStars };

      const completedWorlds = prev.completedWorlds.includes(worldId)
        ? prev.completedWorlds
        : [...prev.completedWorlds, worldId];

      // Add a medal if they got 3 stars (or just completed it)
      const medalMap: Record<string, string> = {
        colors: 'Medalha das Cores',
        shapes: 'Medalha das Formas',
        numbers: 'Medalha dos Números',
        letters: 'Medalha das Letras',
        animals: 'Medalha dos Animais',
        counting: 'Medalha da Contagem',
      };
      
      const newMedal = medalMap[worldId];
      const medals = prev.medals.includes(newMedal)
        ? prev.medals
        : newStars >= 2 ? [...prev.medals, newMedal] : prev.medals;

      return { stars, medals, completedWorlds };
    });
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
  };

  const setSpeechEnabled = (enabled: boolean) => {
    setSpeechEnabledState(enabled);
  };

  const setCurrentView = (view: GameView) => {
    setCurrentViewState(view);
  };

  const resetGame = () => {
    setDino(defaultDino);
    setProgress(defaultProgress);
    setCurrentViewState('home');
  };

  return (
    <GameContext.Provider
      value={{
        dino,
        progress,
        soundEnabled,
        speechEnabled,
        currentView,
        updateDinoConfig,
        completeWorld,
        setSoundEnabled,
        setSpeechEnabled,
        setCurrentView,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame deve ser usado dentro de um GameProvider');
  }
  return context;
};
