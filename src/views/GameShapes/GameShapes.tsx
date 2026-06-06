import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { RotateCcw, Map } from 'lucide-react';
import styles from './GameShapes.module.css';

interface ShapeOption {
  id: 'circle' | 'square' | 'triangle' | 'rectangle' | 'star';
  name: string;
  color: string;
  svg: (color: string) => React.ReactNode;
}

const SHAPES: ShapeOption[] = [
  {
    id: 'circle',
    name: 'Círculo',
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
];

interface Question {
  targetShape: ShapeOption;
  options: ShapeOption[];
}

export const GameShapes: React.FC = () => {
  const { dino, completeWorld, setCurrentView } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const { speak, cancelSpeech } = useSpeechSynthesis();

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [dinoEmotion, setDinoEmotion] = useState<'idle' | 'walk' | 'celebrate' | 'sad'>('idle');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bridgeState, setBridgeState] = useState<boolean[]>([false, false, false, false, false]);
  const [animatingShape, setAnimatingShape] = useState<string | null>(null);

  const totalQuestions = 5;

  useEffect(() => {
    // Generate 5 questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const shuffledShapes = shuffle(SHAPES);
    
    // We have 5 shapes, so each question will use one of them as the target!
    const questionsList: Question[] = shuffledShapes.map((targetShape) => {
      const pool = SHAPES.filter((s) => s.id !== targetShape.id);
      const randomOthers = shuffle(pool).slice(0, 2); // 2 distractors (total 3 options)
      const options = shuffle([targetShape, ...randomOthers]);
      return { targetShape, options };
    });

    setQuestions(questionsList);
  }, []);

  const currentQuestion = questions[step];
  
  const instructionText = currentQuestion
    ? `Dino precisa da pedra em forma de ${currentQuestion.targetShape.name} para consertar a ponte! Qual é ela?`
    : '';

  const handleShapeClick = (shapeId: string) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || animatingShape !== null) return;

    setTotalAttempts((prev) => prev + 1);

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

      setTimeout(() => {
        setAnimatingShape(null);
        setDinoEmotion('idle');
        
        if (step < totalQuestions - 1) {
          setStep((prev) => prev + 1);
        } else {
          handleVictory();
        }
      }, 1500);

    } else {
      // Incorrect
      playError();
      setDinoEmotion('sad');
      setWrongAnswers((prev) => [...prev, shapeId]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = () => {
    setDinoEmotion('celebrate');
    setGameState('victory');
    setShowConfetti(true);
    playVictory();

    let starsEarned = 1;
    if (totalAttempts <= 5) starsEarned = 3;
    else if (totalAttempts <= 7) starsEarned = 2;

    completeWorld('shapes', starsEarned);
    speak(`Incrível! Você consertou a ponte inteira! O Dino conseguiu atravessar para o templo e ganhou ${starsEarned} estrelas!`);
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

    // Regenerate questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const shuffledShapes = shuffle(SHAPES);
    const questionsList: Question[] = shuffledShapes.map((targetShape) => {
      const pool = SHAPES.filter((s) => s.id !== targetShape.id);
      const randomOthers = shuffle(pool).slice(0, 2);
      const options = shuffle([targetShape, ...randomOthers]);
      return { targetShape, options };
    });
    setQuestions(questionsList);
  };

  return (
    <GameLayout
      title="Templo das Formas"
      instructionText={gameState === 'victory' ? 'Ponte consertada!' : instructionText}
      starsEarned={gameState === 'victory' ? (totalAttempts <= 5 ? 3 : totalAttempts <= 7 ? 2 : 1) : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Bridge Arena */}
          <div className={styles.bridgeArea}>
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

            {/* Dino Walking on the Bridge */}
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
                size={120}
              />
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
        <div className={styles.victoryCard}>
          <div className={styles.victoryBadge}>👑</div>
          <h2 className={styles.victoryTitle}>Espetacular!</h2>
          <p className={styles.victoryText}>
            Você é um mestre das formas geométricas! A ponte está totalmente consertada e o Dino atravessou com segurança!
          </p>

          <div className={styles.victoryStarsContainer}>
            {[1, 2, 3].map((star) => {
              const finalStars = totalAttempts <= 5 ? 3 : totalAttempts <= 7 ? 2 : 1;
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

          <div className={styles.victoryButtons}>
            <button
              id="btn-victory-shapes-replay"
              className="btn-bubble"
              style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
              onClick={handlePlayAgain}
              onMouseEnter={playHover}
            >
              <RotateCcw size={20} />
              <span>Jogar de Novo</span>
            </button>
            <button
              id="btn-victory-shapes-map"
              className="btn-bubble"
              style={{ backgroundColor: 'var(--color-green)', color: 'white' }}
              onClick={() => { playClick(); cancelSpeech(); setCurrentView('map'); }}
              onMouseEnter={playHover}
            >
              <Map size={20} />
              <span>Ir para o Mapa</span>
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
};
