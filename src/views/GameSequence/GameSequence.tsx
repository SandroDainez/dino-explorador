import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { GameLayout } from '../../components/GameLayout';
import { PhaseComplete } from '../../components/PhaseComplete';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { starsForAttempts } from '../../game/journey';
import styles from './GameSequence.module.css';

type Dot = 'red' | 'blue' | 'yellow' | 'green';

interface Round {
  shown: Dot[];
  answer: Dot;
  options: Dot[];
}

const COLORS: Record<Dot, string> = {
  red: '#E53935',
  blue: '#1E88E5',
  yellow: '#FDD835',
  green: '#43A047',
};

const ROUNDS: Round[] = [
  { shown: ['red', 'blue', 'red'], answer: 'blue', options: ['blue', 'red', 'yellow'] },
  { shown: ['yellow', 'yellow', 'green'], answer: 'yellow', options: ['green', 'yellow', 'blue'] },
  { shown: ['green', 'green', 'red'], answer: 'green', options: ['red', 'blue', 'green'] },
  { shown: ['blue', 'yellow', 'blue'], answer: 'yellow', options: ['yellow', 'blue', 'red'] },
  { shown: ['red', 'red', 'blue'], answer: 'red', options: ['blue', 'yellow', 'red'] },
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildRounds(): Round[] {
  return ROUNDS.map((round) => ({ ...round, options: shuffle(round.options) }));
}

function DotFace({ color, mystery = false }: { color?: Dot; mystery?: boolean }) {
  return (
    <span
      className={`${styles.dot} ${mystery ? styles.mystery : ''}`}
      style={color ? { background: COLORS[color] } : undefined}
    >
      {mystery ? '?' : ''}
    </span>
  );
}

export const GameSequence: React.FC = () => {
  const { dino, completeWorld } = useGame();
  const { playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const [rounds, setRounds] = useState<Round[]>(buildRounds);
  const [step, setStep] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [emotion, setEmotion] = useState<'idle' | 'celebrate' | 'sad'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [wrong, setWrong] = useState<Dot | null>(null);

  const totalQuestions = rounds.length;
  const round = rounds[step];
  const starsForRun = starsForAttempts(attempts, totalQuestions);
  const instructionText = gameState === 'victory'
    ? `Muito bem! Você completou todas as sequências! Você ganhou ${starsForRun} estrelas!`
    : 'Qual bolinha vem depois?';

  const choose = (color: Dot) => {
    if (!round || locked || gameState === 'victory' || wrong === color) return;
    setAttempts((value) => value + 1);
    if (color !== round.answer) {
      playError();
      setEmotion('sad');
      setWrong(color);
      window.setTimeout(() => setEmotion('idle'), 700);
      return;
    }

    playPop();
    playSuccess();
    setLocked(true);
    setEmotion('celebrate');
    window.setTimeout(() => {
      setLocked(false);
      setWrong(null);
      setEmotion('idle');
      if (step < totalQuestions - 1) setStep((value) => value + 1);
      else {
        setGameState('victory');
        playVictory();
        completeWorld('sequence', starsForAttempts(attempts + 1, totalQuestions));
      }
    }, 900);
  };

  const replay = () => {
    setRounds(buildRounds());
    setStep(0);
    setGameState('playing');
    setEmotion('idle');
    setAttempts(0);
    setLocked(false);
    setWrong(null);
  };

  return (
    <GameLayout
      title="Trilha da Sequência"
      instructionText={instructionText}
      starsEarned={gameState === 'victory' ? starsForRun : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={gameState === 'victory'} />
      {gameState === 'playing' && round ? (
        <div className={styles.stage}>
          <DinoAvatar type={dino.type} color={dino.color} accessory={dino.accessory} animation={emotion} size={130} />
          <div className={styles.board}>
            <div className={styles.pattern}>
              {round.shown.map((color, index) => (
                <DotFace key={`${color}-${index}`} color={color} />
              ))}
              <DotFace mystery />
            </div>
            <div className={styles.options}>
              {round.options.map((color) => (
                <button
                  key={color}
                  id={color === round.answer ? 'seq-correct' : `seq-${color}`}
                  className={`${styles.choice} ${wrong === color ? styles.wrong : ''}`}
                  onClick={() => choose(color)}
                  onMouseEnter={playHover}
                  disabled={locked || wrong === color}
                >
                  <DotFace color={color} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <PhaseComplete
          worldId="sequence"
          badge="🔴"
          title="Sequência certa!"
          message="Você descobriu o que vinha depois em cada trilha."
          stars={starsForRun}
          onReplay={replay}
          replayId="btn-victory-sequence-replay"
          mapId="btn-victory-sequence-map"
        />
      )}
    </GameLayout>
  );
};
