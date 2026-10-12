import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { GameLayout } from '../../components/GameLayout';
import { PhaseComplete } from '../../components/PhaseComplete';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { starsForAttempts, starsSpoken } from '../../game/journey';
import styles from './GameSizes.module.css';

type ThingId = 'egg' | 'leaf' | 'print' | 'rock' | 'star';

interface Round {
  id: ThingId;
  name: string;
  article: 'no' | 'na';
  ask: 'maior' | 'menor';
  bigOnLeft: boolean;
}

const ROUNDS: Omit<Round, 'bigOnLeft'>[] = [
  { id: 'egg', name: 'ovo', article: 'no', ask: 'maior' },
  { id: 'leaf', name: 'folha', article: 'na', ask: 'menor' },
  { id: 'print', name: 'pegada', article: 'na', ask: 'maior' },
  { id: 'rock', name: 'pedra', article: 'na', ask: 'menor' },
  { id: 'star', name: 'estrela', article: 'na', ask: 'maior' },
];

function buildRounds(): Round[] {
  return ROUNDS.map((round) => ({ ...round, bigOnLeft: Math.random() < 0.5 }));
}

function ThingArt({ id, big }: { id: ThingId; big: boolean }) {
  const size = big ? 132 : 68;
  if (id === 'egg') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 120">
        <ellipse cx="50" cy="68" rx="34" ry="44" fill="#FFF8E1" stroke="#F9A825" strokeWidth="5" />
        <ellipse cx="38" cy="52" rx="8" ry="12" fill="#FFFDE7" opacity="0.8" />
      </svg>
    );
  }
  if (id === 'leaf') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M50 88 C20 60 18 24 50 12 C82 24 80 60 50 88 Z" fill="#66BB6A" stroke="#2E7D32" strokeWidth="5" />
        <path d="M50 84 L50 20" stroke="#2E7D32" strokeWidth="3" fill="none" />
      </svg>
    );
  }
  if (id === 'print') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="58" rx="28" ry="34" fill="#8D6E63" />
        <circle cx="28" cy="28" r="8" fill="#8D6E63" />
        <circle cx="50" cy="20" r="8" fill="#8D6E63" />
        <circle cx="72" cy="28" r="8" fill="#8D6E63" />
      </svg>
    );
  }
  if (id === 'rock') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M18 70 L30 38 L52 28 L78 42 L84 72 Z" fill="#90A4AE" stroke="#455A64" strokeWidth="5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,8 62,36 92,36 68,56 76,86 50,68 24,86 32,56 8,36 38,36" fill="#FDD835" stroke="#F9A825" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

export const GameSizes: React.FC = () => {
  const { dino, completeWorld } = useGame();
  const { playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const [rounds, setRounds] = useState<Round[]>(buildRounds);
  const [step, setStep] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [emotion, setEmotion] = useState<'idle' | 'celebrate' | 'sad'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [wrongSide, setWrongSide] = useState<'left' | 'right' | null>(null);

  const totalQuestions = rounds.length;
  const round = rounds[step];
  const starsForRun = starsForAttempts(attempts, totalQuestions);
  const instructionText = gameState === 'victory'
    ? `Muito bem! Você comparou todos os tamanhos! Você ganhou ${starsSpoken(starsForRun)}!`
    : round
      ? `Toque ${round.article} ${round.name} ${round.ask}!`
      : '';

  const finishRound = (correct: boolean, side: 'left' | 'right') => {
    if (gameState === 'victory' || locked || !round) return;
    setAttempts((value) => value + 1);
    if (!correct) {
      playError();
      setEmotion('sad');
      setWrongSide(side);
      window.setTimeout(() => setEmotion('idle'), 700);
      return;
    }

    playPop();
    playSuccess();
    setLocked(true);
    setEmotion('celebrate');
    window.setTimeout(() => {
      setLocked(false);
      setWrongSide(null);
      setEmotion('idle');
      if (step < totalQuestions - 1) setStep((value) => value + 1);
      else {
        setGameState('victory');
        playVictory();
        completeWorld('sizes', starsForAttempts(attempts + 1, totalQuestions));
      }
    }, 900);
  };

  const choose = (side: 'left' | 'right') => {
    if (!round) return;
    const pickedBig = side === 'left' ? round.bigOnLeft : !round.bigOnLeft;
    const wantsBig = round.ask === 'maior';
    finishRound(pickedBig === wantsBig, side);
  };

  const replay = () => {
    setRounds(buildRounds());
    setStep(0);
    setGameState('playing');
    setEmotion('idle');
    setAttempts(0);
    setLocked(false);
    setWrongSide(null);
  };

  const sides: Array<'left' | 'right'> = ['left', 'right'];

  return (
    <GameLayout
      title="Ilha dos Tamanhos"
      instructionText={instructionText}
      starsEarned={gameState === 'victory' ? starsForRun : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={gameState === 'victory'} />
      {gameState === 'playing' && round ? (
        <div className={styles.stage}>
          <DinoAvatar type={dino.type} color={dino.color} accessory={dino.accessory} animation={emotion} size={140} />
          <div className={styles.pair}>
            {sides.map((side) => {
              const big = side === 'left' ? round.bigOnLeft : !round.bigOnLeft;
              const isCorrectSide = (big && round.ask === 'maior') || (!big && round.ask === 'menor');
              return (
                <button
                  key={side}
                  id={isCorrectSide ? 'size-correct' : 'size-other'}
                  className={`${styles.card} ${wrongSide === side ? styles.wrong : ''}`}
                  onClick={() => choose(side)}
                  onMouseEnter={playHover}
                  disabled={locked || wrongSide === side}
                >
                  <ThingArt id={round.id} big={big} />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <PhaseComplete
          worldId="sizes"
          badge="🥚"
          title="Que olhos!"
          message="Você viu direitinho o que era maior e o que era menor."
          stars={starsForRun}
          onReplay={replay}
          replayId="btn-victory-sizes-replay"
          mapId="btn-victory-sizes-map"
        />
      )}
    </GameLayout>
  );
};
