import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useNarrationSequence } from '../../hooks/useNarration';
import { starsFor, victoryLine, withNextPhase } from '../../audio/lines';
import { GameLayout } from '../../components/GameLayout';
import { VictoryActions } from '../../components/VictoryPanel';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import styles from './GameNumbers.module.css';

interface NestOption {
  id: string;
  eggCount: number;
  // Position of eggs in nest for SVG rendering
  eggPositions: { x: number; y: number; rotate: number; color: string }[];
}

interface Question {
  targetNumber: number;
  options: NestOption[];
}

const EGG_COLORS = [
  '#FFCDD2', // pink
  '#C8E6C9', // green
  '#BBDEFB', // blue
  '#FFE0B2', // orange
  '#E1BEE7', // purple
  '#FFF9C4', // yellow
];

export const GameNumbers: React.FC = () => {
  const { dino, completeWorld } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const { playThen } = useNarrationSequence();

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [dinoEmotion, setDinoEmotion] = useState<'idle' | 'walk' | 'celebrate' | 'sad'>('idle');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hatchedNestId, setHatchedNestId] = useState<string | null>(null);

  const totalQuestions = 5;

  const generateNestOption = (id: string, count: number): NestOption => {
    // Eggs positions inside the nest
    // Center is 100, 75 on the nest SVG
    const positions = [
      { x: 100, y: 70, rotate: 5 },
      { x: 75, y: 78, rotate: -20 },
      { x: 125, y: 76, rotate: 25 },
      { x: 90, y: 85, rotate: 10 },
      { x: 110, y: 88, rotate: -15 },
      { x: 65, y: 92, rotate: -35 },
      { x: 135, y: 90, rotate: 40 },
    ];

    const eggPositions = positions.slice(0, count).map((p, idx) => ({
      ...p,
      color: EGG_COLORS[idx % EGG_COLORS.length],
    }));

    return {
      id,
      eggCount: count,
      eggPositions,
    };
  };

  useEffect(() => {
    const questionsList: Question[] = [];
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Target numbers for our 5 questions (e.g. random 5 numbers from 1 to 7)
    const targets = shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, 5);

    targets.forEach((targetNum) => {
      // Choose two distractor numbers close to target
      const pool = [1, 2, 3, 4, 5, 6, 7].filter((n) => n !== targetNum);
      const distractors = shuffle(pool).slice(0, 2);

      const options = shuffle([
        generateNestOption('correct', targetNum),
        generateNestOption('wrong1', distractors[0]),
        generateNestOption('wrong2', distractors[1]),
      ]);

      questionsList.push({
        targetNumber: targetNum,
        options,
      });
    });

    setQuestions(questionsList);
  }, []);

  const currentQuestion = questions[step];
  
  const starsEarned = gameState === 'victory' ? starsFor(totalAttempts) : 0;
  const instructionText = gameState === 'victory'
    ? withNextPhase('numbers', victoryLine('Muito bem! Você encontrou todos os ninhos!', starsEarned))
    : currentQuestion
      ? `A mamãe dinossauro quer encontrar o ninho com ${currentQuestion.targetNumber} ${currentQuestion.targetNumber === 1 ? 'ovo' : 'ovos'}! Ajude ela!`
      : '';
  const narrationId = gameState === 'victory'
    ? `vitoria-numeros-${starsEarned}`
    : currentQuestion
      ? `ninho-${currentQuestion.targetNumber}`
      : null;

  const handleNestClick = (option: NestOption) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || hatchedNestId !== null) return;

    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (option.eggCount === currentQuestion.targetNumber) {
      playPop();
      playSuccess();
      setHatchedNestId(option.id);
      setDinoEmotion('celebrate');
      setWrongAnswers([]);

      playThen(`contar-${option.eggCount}`, () => {
        setHatchedNestId(null);
        setDinoEmotion('idle');

        if (step < totalQuestions - 1) {
          setStep((prev) => prev + 1);
        } else {
          handleVictory(nextAttempts);
        }
      }, 1400);

    } else {
      // Incorrect
      playError();
      setDinoEmotion('sad');
      setWrongAnswers((prev) => [...prev, option.id]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = (attempts: number) => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();
    completeWorld('numbers', starsFor(attempts));
  };

  const handlePlayAgain = () => {
    playClick();
    setStep(0);
    setGameState('playing');
    setDinoEmotion('idle');
    setTotalAttempts(0);
    setWrongAnswers([]);
    setShowConfetti(false);
    setHatchedNestId(null);

    // Regenerate questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const targets = shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, 5);
    const questionsList: Question[] = [];

    targets.forEach((targetNum) => {
      const pool = [1, 2, 3, 4, 5, 6, 7].filter((n) => n !== targetNum);
      const distractors = shuffle(pool).slice(0, 2);

      const options = shuffle([
        generateNestOption('correct', targetNum),
        generateNestOption('wrong1', distractors[0]),
        generateNestOption('wrong2', distractors[1]),
      ]);

      questionsList.push({
        targetNumber: targetNum,
        options,
      });
    });

    setQuestions(questionsList);
  };

  const renderNestSvg = (option: NestOption, isHatched: boolean) => {
    return (
      <svg width="180" height="150" viewBox="0 0 200 150" className={styles.nestSvg}>
        {/* Nest Base (Brown twigs) */}
        <ellipse cx="100" cy="115" rx="75" ry="22" fill="#8D6E63" stroke="#5D4037" strokeWidth="4" />
        <path d="M 30 115 C 30 135, 170 135, 170 115" stroke="#5D4037" strokeWidth="8" fill="none" strokeLinecap="round" />
        {/* Inside dark hollow */}
        <ellipse cx="100" cy="100" rx="60" ry="15" fill="#3E2723" />
        
        {/* Render Eggs or Hatched Dinos */}
        {option.eggPositions.map((pos, idx) => {
          return (
            <g
              key={idx}
              transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.rotate})`}
              className={isHatched ? styles.hatchingAnim : ''}
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              {isHatched ? (
                /* Cute baby dino head hatching out of shell */
                <g>
                  {/* Bottom shell */}
                  <path d="M -15 0 C -15 15, 15 15, 15 0 L 10 -5 L 5 2 L 0 -8 L -5 2 L -10 -5 Z" fill={pos.color} stroke="#37474F" strokeWidth="1.5" />
                  {/* Dino Head */}
                  <circle cx="0" cy="-14" r="10" fill={dino.color === 'green' ? '#4CAF50' : dino.color === 'pink' ? '#E91E63' : dino.color === 'blue' ? '#2196F3' : '#FF9800'} />
                  {/* Eye */}
                  <circle cx="3" cy="-16" r="2.5" fill="black" />
                  <circle cx="2" cy="-17" r="0.8" fill="white" />
                  {/* Cheek */}
                  <circle cx="6" cy="-12" r="2" fill="#FF8A80" />
                  {/* Top shell cap */}
                  <path d="M -10 -22 C -10 -30, 10 -30, 10 -22 L 5 -18 L 0 -24 L -5 -18 Z" fill={pos.color} stroke="#37474F" strokeWidth="1.5" />
                </g>
              ) : (
                /* Cute speckled egg */
                <g>
                  <ellipse cx="0" cy="-5" rx="14" ry="19" fill={pos.color} stroke="#37474F" strokeWidth="2.5" />
                  {/* Speckles */}
                  <circle cx="-5" cy="-10" r="2" fill="white" opacity="0.6" />
                  <circle cx="6" cy="-2" r="1.5" fill="white" opacity="0.6" />
                  <circle cx="-2" cy="4" r="2.2" fill="white" opacity="0.6" />
                </g>
              )}
            </g>
          );
        })}

        {/* Front details of the nest (twigs crossing) */}
        <path d="M 25 110 L 175 110" stroke="#795548" strokeWidth="4" strokeLinecap="round" />
        <path d="M 40 120 L 160 120" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
        <path d="M 60 128 Q 100 138, 140 128" stroke="#3E2723" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  };

  return (
    <GameLayout
      title="Ninho dos Números"
      instructionText={instructionText}
      narrationId={narrationId}
      starsEarned={starsEarned}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Target panel (big number tag) */}
          <div className={styles.numberSignBoard}>
            <div className={styles.motherDino}>
              <DinoAvatar
                type="pterodactyl"
                color="orange"
                accessory="none"
                animation={dinoEmotion}
                size={120}
              />
            </div>
            <div className={styles.numberSign}>
              Ache o ninho com:
              <span className={styles.numberBig}>{currentQuestion.targetNumber}</span>
              {currentQuestion.targetNumber === 1 ? 'ovo' : 'ovos'}!
            </div>
          </div>

          {/* Nests Selection */}
          <div className={styles.nestsContainer}>
            {currentQuestion.options.map((option) => {
              const isWrong = wrongAnswers.includes(option.id);
              const isHatched = hatchedNestId === option.id;

              return (
                <button
                  key={option.id}
                  id={`nest-${option.id}`}
                  className={`${styles.nestCard} ${isWrong ? styles.wrongCard : ''} ${isHatched ? styles.hatchedCard : ''}`}
                  onClick={() => handleNestClick(option)}
                  onMouseEnter={playHover}
                  disabled={isWrong || hatchedNestId !== null}
                >
                  {isHatched && (
                    <div className={styles.sparkleGroup}>
                      <span className={styles.sparkle1}>⭐</span>
                      <span className={styles.sparkle2}>✨</span>
                      <span className={styles.sparkle3}>⭐</span>
                    </div>
                  )}
                  {renderNestSvg(option, isHatched)}
                  <span className={styles.eggCountBadge}>
                    {option.eggCount} {option.eggCount === 1 ? 'Ovo' : 'Ovos'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <div className={styles.victoryCard}>
          <div className={styles.victoryBadge}>🦖</div>
          <h2 className={styles.victoryTitle}>Sensacional!</h2>
          <p className={styles.victoryText}>
            Você sabe contar muito bem! Todos os ninhos estão em segurança e os bebês dinossauros nasceram felizes!
          </p>

          <div className={styles.victoryStarsContainer}>
            {[1, 2, 3].map((star) => {
              const finalStars = starsEarned;
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
            worldId="numbers"
            replayId="btn-victory-numbers-replay"
            mapId="btn-victory-numbers-map"
            onReplay={handlePlayAgain}
          />
        </div>
      )}
    </GameLayout>
  );
};
