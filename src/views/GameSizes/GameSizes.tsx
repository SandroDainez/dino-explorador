import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { starsFor, victoryLine, withNextPhase } from '../../audio/lines';
import { useCorrectPraise, useWrongHint } from '../../hooks/useNarration';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { VictoryPanel } from '../../components/VictoryPanel';
import styles from './GameSizes.module.css';

type SizeItem = 'ovo' | 'folha' | 'pegada' | 'pedra' | 'estrela';

interface SizeQuestion {
  item: SizeItem;
  pick: 'maior' | 'menor';
  clip: string;
  text: string;
  bigSide: 'left' | 'right';
}

const PROMPTS: Omit<SizeQuestion, 'bigSide'>[] = [
  { item: 'ovo', pick: 'maior', clip: 'tamanho-ovo-maior', text: 'Toque no ovo maior!' },
  { item: 'folha', pick: 'menor', clip: 'tamanho-folha-menor', text: 'Toque na folha menor!' },
  { item: 'pegada', pick: 'maior', clip: 'tamanho-pegada-maior', text: 'Toque na pegada maior!' },
  { item: 'pedra', pick: 'menor', clip: 'tamanho-pedra-menor', text: 'Toque na pedra menor!' },
  { item: 'estrela', pick: 'maior', clip: 'tamanho-estrela-maior', text: 'Toque na estrela maior!' },
];

function buildQuestions(): SizeQuestion[] {
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
  return shuffle(PROMPTS).map((prompt) => ({
    ...prompt,
    bigSide: Math.random() < 0.5 ? 'left' : 'right',
  }));
}

function ItemArt({ item, large }: { item: SizeItem; large: boolean }) {
  const size = large ? 132 : 72;
  if (item === 'ovo') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="58" rx="28" ry="36" fill="#FFF9C4" stroke="#F9A825" strokeWidth="4" />
        <circle cx="40" cy="48" r="5" fill="white" opacity="0.8" />
      </svg>
    );
  }
  if (item === 'folha') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M50 82 C20 60, 18 28, 50 16 C82 28, 80 60, 50 82 Z" fill="#66BB6A" stroke="#2E7D32" strokeWidth="4" />
        <path d="M50 78 L50 24" stroke="#1B5E20" strokeWidth="3" fill="none" />
      </svg>
    );
  }
  if (item === 'pegada') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="62" rx="22" ry="26" fill="#8D6E63" />
        <circle cx="28" cy="36" r="8" fill="#8D6E63" />
        <circle cx="42" cy="26" r="7" fill="#8D6E63" />
        <circle cx="58" cy="26" r="7" fill="#8D6E63" />
        <circle cx="72" cy="36" r="8" fill="#8D6E63" />
      </svg>
    );
  }
  if (item === 'pedra') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M22 68 L30 40 L48 28 L74 36 L84 62 L70 80 L34 82 Z" fill="#90A4AE" stroke="#455A64" strokeWidth="4" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,8 61,36 92,36 67,54 76,84 50,66 24,84 33,54 8,36 39,36" fill="#FFD54F" stroke="#F9A825" strokeWidth="4" />
    </svg>
  );
}

export const GameSizes: React.FC = () => {
  const { dino, completeWorld, progress } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory } = useAudioEngine();
  const praise = useCorrectPraise();
  const hint = useWrongHint();

  const [questions, setQuestions] = useState<SizeQuestion[]>(buildQuestions);
  const [step, setStep] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongSide, setWrongSide] = useState<'left' | 'right' | null>(null);
  const [pickedSide, setPickedSide] = useState<'left' | 'right' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [locked, setLocked] = useState(false);

  const totalQuestions = questions.length;
  const current = questions[step];
  const starsEarned = gameState === 'victory' ? starsFor(totalAttempts, totalQuestions) : 0;
  const instructionText = gameState === 'victory'
    ? withNextPhase('sizes', victoryLine('Muito bem! Você comparou todos os tamanhos!', starsEarned), progress.stars)
    : current?.text ?? '';
  const narrationId = gameState === 'victory'
    ? `vitoria-tamanhos-${starsEarned}`
    : current?.clip ?? null;

  const finish = (attempts: number) => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();
    completeWorld('sizes', starsFor(attempts, totalQuestions));
  };

  const handlePick = (side: 'left' | 'right') => {
    if (!current || locked || gameState === 'victory') return;
    const correctSide = current.pick === 'maior'
      ? current.bigSide
      : current.bigSide === 'left' ? 'right' : 'left';
    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (side === correctSide) {
      playSuccess();
      setPickedSide(side);
      setLocked(true);
      setWrongSide(null);
      praise(() => {
        setPickedSide(null);
        setLocked(false);
        if (step < totalQuestions - 1) setStep((prev) => prev + 1);
        else finish(nextAttempts);
      });
      return;
    }

    playError();
    hint();
    setWrongSide(side);
    window.setTimeout(() => setWrongSide(null), 700);
  };

  const handlePlayAgain = () => {
    playClick();
    setQuestions(buildQuestions());
    setStep(0);
    setGameState('playing');
    setTotalAttempts(0);
    setWrongSide(null);
    setPickedSide(null);
    setShowConfetti(false);
    setLocked(false);
  };

  const renderChoice = (side: 'left' | 'right') => {
    if (!current) return null;
    const large = current.bigSide === side;
    const isWrong = wrongSide === side;
    const isRight = pickedSide === side;
    return (
      <button
        id={`size-${side}`}
        className={`${styles.choice} ${isWrong ? styles.wrong : ''} ${isRight ? styles.correct : ''}`}
        onClick={() => handlePick(side)}
        onMouseEnter={playHover}
        disabled={locked}
      >
        <ItemArt item={current.item} large={large} />
      </button>
    );
  };

  return (
    <GameLayout
      title="Clareira dos Tamanhos"
      instructionText={instructionText}
      narrationId={narrationId}
      starsEarned={starsEarned}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />
      {gameState === 'playing' && current ? (
        <div className={styles.gameContainer}>
          <div className={styles.pair}>
            {renderChoice('left')}
            {renderChoice('right')}
          </div>
          <DinoAvatar type={dino.type} color={dino.color} accessory={dino.accessory} animation={pickedSide ? 'celebrate' : wrongSide ? 'sad' : 'idle'} size={110} />
        </div>
      ) : (
        <VictoryPanel
          badge="📏"
          title="Que olhar!"
          text="Você comparou os tamanhos com muito cuidado. O Dino está orgulhoso!"
          stars={starsEarned}
          worldId="sizes"
          replayId="btn-victory-sizes-replay"
          mapId="btn-victory-sizes-map"
          onReplay={handlePlayAgain}
        />
      )}
    </GameLayout>
  );
};
