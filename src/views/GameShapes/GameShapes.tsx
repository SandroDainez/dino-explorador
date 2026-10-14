import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { starsFor, starWords, withNextPhase } from '../../audio/lines';
import { useCorrectPraise, useWrongHint } from '../../hooks/useNarration';
import { GameLayout } from '../../components/GameLayout';
import { VictoryActions } from '../../components/VictoryPanel';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import styles from './GameShapes.module.css';

interface ShapeOption {
  id: 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart' | 'oval';
  name: string;
  clip: string;
  color: string;
  svg: (color: string) => React.ReactNode;
}

const SHAPES: ShapeOption[] = [
  {
    id: 'circle',
    name: 'Círculo',
    clip: 'forma-circulo',
    color: 'var(--color-pink)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill={color} stroke="white" strokeWidth="4" />
      </svg>
    ),
  },
  {
    id: 'square',
    name: 'Quadrado',
    clip: 'forma-quadrado',
    color: 'var(--color-blue)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <rect x="15" y="15" width="70" height="70" rx="8" fill={color} stroke="white" strokeWidth="4" />
      </svg>
    ),
  },
  {
    id: 'triangle',
    name: 'Triângulo',
    clip: 'forma-triangulo',
    color: 'var(--color-green)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <polygon points="50,15 15,80 85,80" fill={color} stroke="white" strokeWidth="4" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    name: 'Retângulo',
    clip: 'forma-retangulo',
    color: 'var(--color-orange)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <rect x="10" y="25" width="80" height="50" rx="8" fill={color} stroke="white" strokeWidth="4" />
      </svg>
    ),
  },
  {
    id: 'star',
    name: 'Estrela',
    clip: 'forma-estrela',
    color: 'var(--color-yellow)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <polygon
          points="50,10 63,35 90,35 68,54 76,80 50,65 24,80 32,54 10,35 37,35"
          fill={color}
          stroke="white"
          strokeWidth="4"
        />
      </svg>
    ),
  },
  {
    id: 'heart',
    name: 'Coração',
    clip: 'forma-coracao',
    color: 'var(--color-red)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <path
          d="M50 82 C18 58, 8 40, 24 26 C36 16, 46 24, 50 34 C54 24, 64 16, 76 26 C92 40, 82 58, 50 82 Z"
          fill={color}
          stroke="white"
          strokeWidth="4"
        />
      </svg>
    ),
  },
  {
    id: 'oval',
    name: 'Oval',
    clip: 'forma-oval',
    color: 'var(--color-purple)',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" rx="38" ry="24" fill={color} stroke="white" strokeWidth="4" />
      </svg>
    ),
  },
];

interface Question {
  targetShape: ShapeOption;
  options: ShapeOption[];
}

function buildShapeQuestions(): Question[] {
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
  return shuffle(SHAPES).slice(0, 5).map((targetShape) => {
    const pool = SHAPES.filter((shape) => shape.id !== targetShape.id);
    const randomOthers = shuffle(pool).slice(0, 2);
    return { targetShape, options: shuffle([targetShape, ...randomOthers]) };
  });
}

export const GameShapes: React.FC = () => {
  const { dino, completeWorld, progress } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const praise = useCorrectPraise();
  const hint = useWrongHint();

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(buildShapeQuestions);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [dinoEmotion, setDinoEmotion] = useState<'idle' | 'walk' | 'celebrate' | 'sad'>('idle');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bridgeState, setBridgeState] = useState<boolean[]>([false, false, false, false, false]);
  const [animatingShape, setAnimatingShape] = useState<string | null>(null);

  const totalQuestions = 5;

  const currentQuestion = questions[step];
  
  const starsForRun = starsFor(totalAttempts);
  const instructionText = gameState === 'victory'
    ? withNextPhase('shapes', `Incrível! Você consertou a ponte inteira! O Dino conseguiu atravessar para o templo e ganhou ${starWords(starsForRun)}!`, progress.stars)
    : currentQuestion
      ? `Dino precisa da pedra em forma de ${currentQuestion.targetShape.name} para consertar a ponte! Qual é ela?`
      : '';
  const narrationId = gameState === 'victory'
    ? `vitoria-formas-${starsForRun}`
    : currentQuestion?.targetShape.clip ?? null;

  const handleShapeClick = (shapeId: string) => {
    if (gameState === 'victory' || animatingShape !== null) return;

    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (shapeId === currentQuestion.targetShape.id) {
      // Correct!
      playPop();
      playSuccess();
      setAnimatingShape(shapeId);
      setDinoEmotion('walk');
      
      // Update bridge missing parts
      setBridgeState((prev) => {
        const next = [...prev];
        next[step] = true;
        return next;
      });

      setWrongAnswers([]);

      praise(() => {
        setAnimatingShape(null);
        setDinoEmotion('idle');

        if (step < totalQuestions - 1) {
          setStep((prev) => prev + 1);
        } else {
          handleVictory(nextAttempts);
        }
      });

    } else {
      // Incorrect
      playError();
      hint();
      setDinoEmotion('sad');
      setWrongAnswers((prev) => [...prev, shapeId]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = (attempts: number) => {
    setDinoEmotion('celebrate');
    setGameState('victory');
    setShowConfetti(true);
    playVictory();
    completeWorld('shapes', starsFor(attempts));
  };

  const handlePlayAgain = () => {
    playClick();
    setStep(0);
    setGameState('playing');
    setDinoEmotion('idle');
    setTotalAttempts(0);
    setWrongAnswers([]);
    setShowConfetti(false);
    setBridgeState([false, false, false, false, false]);
    setAnimatingShape(null);

    setQuestions(buildShapeQuestions());
  };

  return (
    <GameLayout
      title="Templo das Formas"
      instructionText={instructionText}
      narrationId={narrationId}
      starsEarned={gameState === 'victory' ? starsForRun : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Bridge Arena */}
          <div className={styles.bridgeArea}>
            <div className={styles.dinoTrack}>
              <div
                className={styles.dinoOnBridge}
                style={{
                  left: `${15 + step * 15}%`,
                  transition: 'left 1s ease-in-out',
                }}
              >
                <DinoAvatar
                  type={dino.type}
                  color={dino.color}
                  accessory={dino.accessory}
                  animation={dinoEmotion}
                  size={116}
                />
              </div>
            </div>

            {/* The Bridge */}
            <div className={styles.bridge}>
              {bridgeState.map((fixed, idx) => {
                const isCurrentHole = idx === step;
                
                return (
                  <div
                    key={idx}
                    className={`${styles.bridgeSegment} ${fixed ? styles.segmentFixed : ''} ${isCurrentHole ? styles.segmentHole : ''}`}
                  >
                    {fixed ? (
                      /* Repaired block showing shape color */
                      <div className={styles.placedShape}>
                        {questions[idx]?.targetShape.svg(questions[idx]?.targetShape.color)}
                        {idx === step && animatingShape !== null && (
                          <div className={styles.sparkleGroup}>
                            <span className={styles.sparkle1}>⭐</span>
                            <span className={styles.sparkle2}>✨</span>
                            <span className={styles.sparkle3}>⭐</span>
                          </div>
                        )}
                      </div>
                    ) : isCurrentHole ? (
                      /* Shadow of the target shape in the bridge hole */
                      <div className={styles.shapeHollowShadow}>
                        {currentQuestion.targetShape.svg('rgba(0, 0, 0, 0.25)')}
                      </div>
                    ) : (
                      /* Hollow/unrepaired block */
                      <div className={styles.hollowBlock}>?</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options Grid */}
          <div className={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isWrong = wrongAnswers.includes(option.id);
              const isPlacing = animatingShape === option.id;

              return (
                <button
                  key={option.id}
                  id={`shape-${option.id}`}
                  className={`${styles.shapeCard} ${isWrong ? styles.wrongCard : ''} ${isPlacing ? styles.placingCard : ''}`}
                  onClick={() => handleShapeClick(option.id)}
                  onMouseEnter={playHover}
                  disabled={isWrong || isPlacing}
                >
                  <div className={styles.shapeSvgWrapper}>
                    {option.svg(option.color)}
                  </div>
                  <span className={styles.shapeLabel}>{option.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <div className={`${styles.victoryCard} victory-screen`}>
          <div className={styles.victoryBadge}>👑</div>
          <h2 className={styles.victoryTitle}>Espetacular!</h2>
          <p className={styles.victoryText}>
            Você é um mestre das formas geométricas! A ponte está totalmente consertada e o Dino atravessou com segurança!
          </p>

          <div className={styles.victoryStarsContainer}>
            {[1, 2, 3].map((star) => {
              const finalStars = starsForRun;
              return (
                <span
                  key={star}
                  className={`${styles.victoryStar} ${star <= finalStars ? styles.finalStarFilled : styles.finalStarEmpty}`}
                >
                  ⭐
                </span>
              );
            })}
          </div>

          <VictoryActions
            worldId="shapes"
            replayId="btn-victory-shapes-replay"
            mapId="btn-victory-shapes-map"
            onReplay={handlePlayAgain}
          />
        </div>
      )}
    </GameLayout>
  );
};
