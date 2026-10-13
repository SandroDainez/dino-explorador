import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { starsFor, victoryLine, withNextPhase } from '../../audio/lines';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { VictoryPanel } from '../../components/VictoryPanel';
import styles from './GameSequence.module.css';

type Ball = 'red' | 'blue' | 'yellow' | 'green';

interface SequenceQuestion {
  shown: Ball[];
  answer: Ball;
  options: Ball[];
}

const COLORS: Record<Ball, string> = {
  red: '#E53935',
  blue: '#1E88E5',
  yellow: '#FBC02D',
  green: '#43A047',
};

const PATTERNS: SequenceQuestion[] = [
  { shown: ['red', 'blue', 'red', 'blue'], answer: 'red', options: ['red', 'yellow', 'green'] },
  { shown: ['yellow', 'yellow', 'yellow'], answer: 'yellow', options: ['yellow', 'blue', 'red'] },
  { shown: ['green', 'green', 'blue', 'green', 'green'], answer: 'blue', options: ['blue', 'red', 'yellow'] },
  { shown: ['blue', 'red', 'blue', 'red'], answer: 'blue', options: ['blue', 'green', 'yellow'] },
  { shown: ['red', 'red', 'green', 'red', 'red'], answer: 'green', options: ['green', 'blue', 'yellow'] },
];

function buildQuestions(): SequenceQuestion[] {
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
  return shuffle(PATTERNS).map((question) => ({
    ...question,
    options: shuffle(question.options),
  }));
}

export const GameSequence: React.FC = () => {
  const { dino, completeWorld } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory } = useAudioEngine();

  const [questions, setQuestions] = useState<SequenceQuestion[]>(buildQuestions);
  const [step, setStep] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongBall, setWrongBall] = useState<Ball | null>(null);
  const [solved, setSolved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalQuestions = questions.length;
  const current = questions[step];
  const starsEarned = gameState === 'victory' ? starsFor(totalAttempts, totalQuestions) : 0;
  const instructionText = gameState === 'victory'
    ? withNextPhase('sequence', victoryLine('Muito bem! Você completou todas as sequências!', starsEarned))
    : 'Qual bolinha vem depois?';
  const narrationId = gameState === 'victory' ? `vitoria-sequencia-${starsEarned}` : 'sequencia';

  const finish = (attempts: number) => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();
    completeWorld('sequence', starsFor(attempts, totalQuestions));
  };

  const handlePick = (ball: Ball) => {
    if (!current || solved || gameState === 'victory') return;
    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (ball === current.answer) {
      playSuccess();
      setSolved(true);
      setWrongBall(null);
      window.setTimeout(() => {
        setSolved(false);
        if (step < totalQuestions - 1) setStep((prev) => prev + 1);
        else finish(nextAttempts);
      }, 900);
      return;
    }

    playError();
    setWrongBall(ball);
    window.setTimeout(() => setWrongBall(null), 700);
  };

  const handlePlayAgain = () => {
    playClick();
    setQuestions(buildQuestions());
    setStep(0);
    setGameState('playing');
    setTotalAttempts(0);
    setWrongBall(null);
    setSolved(false);
    setShowConfetti(false);
  };

  return (
    <GameLayout
      title="Trilha da Sequência"
      instructionText={instructionText}
      narrationId={narrationId}
      starsEarned={starsEarned}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />
      {gameState === 'playing' && current ? (
        <div className={styles.gameContainer}>
          <div className={styles.row}>
            {current.shown.map((ball, index) => (
              <span key={`${ball}-${index}`} className={styles.ball} style={{ background: COLORS[ball] }} />
            ))}
            {solved ? (
              <span className={styles.ball} style={{ background: COLORS[current.answer] }} />
            ) : (
              <span className={`${styles.ball} ${styles.mystery}`}>?</span>
            )}
          </div>
          <div className={styles.options}>
            {current.options.map((ball) => (
              <button
                key={ball}
                id={`seq-${ball}`}
                className={`${styles.option} ${wrongBall === ball ? styles.wrong : ''} ${solved && ball === current.answer ? styles.correct : ''}`}
                style={{ background: COLORS[ball] }}
                onClick={() => handlePick(ball)}
                onMouseEnter={playHover}
                disabled={solved || wrongBall === ball}
                aria-label={ball}
              />
            ))}
          </div>
          <DinoAvatar type={dino.type} color={dino.color} accessory={dino.accessory} animation={solved ? 'celebrate' : wrongBall ? 'sad' : 'idle'} size={110} />
        </div>
      ) : (
        <VictoryPanel
          badge="🔴"
          title="Sequência certa!"
          text="Você descobriu qual bolinha vinha depois. O caminho ficou completo!"
          stars={starsEarned}
          worldId="sequence"
          replayId="btn-victory-sequence-replay"
          mapId="btn-victory-sequence-map"
          onReplay={handlePlayAgain}
        />
      )}
    </GameLayout>
  );
};
