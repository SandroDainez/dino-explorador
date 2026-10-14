import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { starsFor, victoryLine, withNextPhase } from '../../audio/lines';
import { useCorrectPraise, useWrongHint } from '../../hooks/useNarration';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { VictoryPanel } from '../../components/VictoryPanel';
import styles from './GamePositions.module.css';

type Direction = 'cima' | 'direita' | 'embaixo' | 'esquerda';

interface PositionQuestion {
  id: Direction;
  clip: string;
  text: string;
}

const QUESTIONS: PositionQuestion[] = [
  { id: 'cima', clip: 'posicao-cima', text: 'Toque em cima do ninho!' },
  { id: 'direita', clip: 'posicao-direita', text: 'Toque à direita do ninho!' },
  { id: 'embaixo', clip: 'posicao-embaixo', text: 'Toque embaixo do ninho!' },
  { id: 'esquerda', clip: 'posicao-esquerda', text: 'Toque à esquerda do ninho!' },
];

function buildQuestions(): PositionQuestion[] {
  return [...QUESTIONS].sort(() => Math.random() - 0.5);
}

export const GamePositions: React.FC = () => {
  const { dino, completeWorld, progress } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory } = useAudioEngine();
  const praise = useCorrectPraise();
  const hint = useWrongHint();

  const [questions, setQuestions] = useState<PositionQuestion[]>(buildQuestions);
  const [step, setStep] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongId, setWrongId] = useState<Direction | null>(null);
  const [solved, setSolved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalQuestions = questions.length;
  const current = questions[step];
  const starsEarned = gameState === 'victory' ? starsFor(totalAttempts, totalQuestions) : 0;
  const instructionText = gameState === 'victory'
    ? withNextPhase('positions', victoryLine('Muito bem! Você encontrou todos os lugares!', starsEarned), progress.stars)
    : current?.text ?? '';
  const narrationId = gameState === 'victory'
    ? `vitoria-posicoes-${starsEarned}`
    : current?.clip ?? null;

  const finish = (attempts: number) => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();
    completeWorld('positions', starsFor(attempts, totalQuestions));
  };

  const handlePick = (id: Direction) => {
    if (!current || solved || gameState === 'victory') return;
    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (id === current.id) {
      playSuccess();
      setSolved(true);
      setWrongId(null);
      praise(() => {
        setSolved(false);
        if (step < totalQuestions - 1) setStep((prev) => prev + 1);
        else finish(nextAttempts);
      });
      return;
    }

    playError();
    hint();
    setWrongId(id);
    window.setTimeout(() => setWrongId(null), 700);
  };

  const handlePlayAgain = () => {
    playClick();
    setQuestions(buildQuestions());
    setStep(0);
    setGameState('playing');
    setTotalAttempts(0);
    setWrongId(null);
    setSolved(false);
    setShowConfetti(false);
  };

  return (
    <GameLayout
      title="Ninho das Posições"
      instructionText={instructionText}
      narrationId={narrationId}
      starsEarned={starsEarned}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />
      {gameState === 'playing' && current ? (
        <div className={styles.gameContainer}>
          <div className={styles.board}>
            {QUESTIONS.map((spot) => (
              <button
                key={spot.id}
                id={`pos-${spot.id}`}
                className={`${styles.spot} ${styles[spot.id]} ${wrongId === spot.id ? styles.wrong : ''} ${solved && spot.id === current.id ? styles.correct : ''}`}
                onClick={() => handlePick(spot.id)}
                onMouseEnter={playHover}
                disabled={solved}
                aria-label={spot.text}
              >
                <span className={styles.gem} />
              </button>
            ))}
            <div className={styles.nest} aria-hidden="true">
              <svg width="120" height="70" viewBox="0 0 120 70">
                <ellipse cx="60" cy="40" rx="52" ry="22" fill="#8D6E63" stroke="#5D4037" strokeWidth="4" />
                <ellipse cx="60" cy="34" rx="36" ry="12" fill="#5D4037" />
                <ellipse cx="48" cy="30" rx="10" ry="13" fill="#FFF9C4" stroke="#37474F" />
                <ellipse cx="68" cy="28" rx="10" ry="13" fill="#FFCDD2" stroke="#37474F" />
              </svg>
            </div>
          </div>
          <DinoAvatar type={dino.type} color={dino.color} accessory={dino.accessory} animation={solved ? 'celebrate' : wrongId ? 'sad' : 'idle'} size={132} />
        </div>
      ) : (
        <VictoryPanel
          badge="🪺"
          title="Lugar certo!"
          text="Você encontrou o que estava em cima, embaixo e dos lados do ninho!"
          stars={starsEarned}
          worldId="positions"
          replayId="btn-victory-positions-replay"
          mapId="btn-victory-positions-map"
          onReplay={handlePlayAgain}
        />
      )}
    </GameLayout>
  );
};
