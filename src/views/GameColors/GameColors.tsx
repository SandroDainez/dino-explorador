import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { RotateCcw, Map } from 'lucide-react';
import styles from './GameColors.module.css';

interface FruitOption {
  id: string;
  colorName: string;
  colorHex: string;
  type: 'apple' | 'banana' | 'orange' | 'grapes' | 'blueberry' | 'plum';
  svg: React.ReactNode;
}

const FRUIT_OPTIONS: FruitOption[] = [
  {
    id: 'red',
    colorName: 'Vermelha',
    colorHex: '#E53935',
    type: 'apple',
    svg: (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Apple body */}
        <path d="M 50 28 C 30 20, 15 40, 20 65 C 25 85, 45 92, 50 82 C 55 92, 75 85, 80 65 C 85 40, 70 20, 50 28 Z" fill="#E53935" stroke="#B71C1C" strokeWidth="3" />
        {/* Stem */}
        <path d="M 50 28 Q 52 15, 60 12" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Leaf */}
        <path d="M 52 24 Q 65 20, 68 28 Q 55 32, 52 24 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'yellow',
    colorName: 'Amarela',
    colorHex: '#FBC02D',
    type: 'banana',
    svg: (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Banana body */}
        <path d="M 25 35 Q 55 35, 75 65 Q 50 75, 20 50 Q 15 40, 25 35 Z" fill="#FFEB3B" stroke="#FBC02D" strokeWidth="3" />
        {/* Stem and tips */}
        <path d="M 23 33 L 27 37" stroke="#5D4037" strokeWidth="5" strokeLinecap="round" />
        <path d="M 73 63 L 77 67" stroke="#5D4037" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'orange',
    colorName: 'Laranja',
    colorHex: '#FB8C00',
    type: 'orange',
    svg: (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Orange body */}
        <circle cx="50" cy="55" r="30" fill="#FFA726" stroke="#FB8C00" strokeWidth="3" />
        {/* Leaf */}
        <path d="M 50 25 Q 55 12, 68 15 Q 60 25, 50 25 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1.5" />
        {/* Texture dots */}
        <circle cx="38" cy="50" r="2" fill="#E65100" opacity="0.4" />
        <circle cx="62" cy="60" r="2" fill="#E65100" opacity="0.4" />
        <circle cx="52" cy="70" r="2" fill="#E65100" opacity="0.4" />
        <circle cx="45" cy="40" r="2" fill="#E65100" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'green',
    colorName: 'Verde',
    colorHex: '#4CAF50',
    type: 'grapes',
    svg: (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Bunch of green grapes (several circles) */}
        {/* Stem */}
        <path d="M 50 25 L 50 15" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
        {/* Grapes */}
        <circle cx="50" cy="35" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
        <circle cx="38" cy="45" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
        <circle cx="62" cy="45" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
        <circle cx="50" cy="55" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
        <circle cx="38" cy="65" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
        <circle cx="62" cy="65" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
        <circle cx="50" cy="75" r="10" fill="#81C784" stroke="#4CAF50" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'blue',
    colorName: 'Azul',
    colorHex: '#1E88E5',
    type: 'blueberry',
    svg: (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Blueberry */}
        <circle cx="50" cy="55" r="28" fill="#42A5F5" stroke="#1E88E5" strokeWidth="3" />
        {/* Crown detail */}
        <path d="M 42 32 Q 50 40, 58 32 Q 50 36, 42 32 Z" fill="#1565C0" />
        <circle cx="50" cy="36" r="3" fill="#1565C0" />
      </svg>
    ),
  },
  {
    id: 'purple',
    colorName: 'Roxa',
    colorHex: '#8E24AA',
    type: 'plum',
    svg: (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Plum */}
        <circle cx="50" cy="55" r="30" fill="#AB47BC" stroke="#8E24AA" strokeWidth="3" />
        {/* Indentation line */}
        <path d="M 50 25 C 45 40, 45 70, 50 85" stroke="#7B1FA2" strokeWidth="2" fill="none" opacity="0.5" />
        {/* Stem */}
        <path d="M 50 25 L 45 15" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface Question {
  targetFruit: FruitOption;
  options: FruitOption[];
}

export const GameColors: React.FC = () => {
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
  const [biteFruit, setBiteFruit] = useState<string | null>(null);

  const totalQuestions = 5;

  // Generate questions
  useEffect(() => {
    const questionsList: Question[] = [];
    
    // Shuffle helper
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Create 5 distinct questions
    const shuffledFruits = shuffle(FRUIT_OPTIONS);
    for (let i = 0; i < totalQuestions; i++) {
      const targetFruit = shuffledFruits[i];
      
      // Get other options (excluding target)
      const pool = FRUIT_OPTIONS.filter((f) => f.id !== targetFruit.id);
      const randomOthers = shuffle(pool).slice(0, 3); // 3 distractor fruits
      
      // Combine and shuffle options
      const options = shuffle([targetFruit, ...randomOthers]);
      questionsList.push({ targetFruit, options });
    }

    setQuestions(questionsList);
  }, []);

  const currentQuestion = questions[step];
  
  const instructionText = currentQuestion
    ? `Dino quer comer uma fruta ${currentQuestion.targetFruit.colorName}! Qual é a correta?`
    : '';

  const handleFruitClick = (selectedId: string) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || biteFruit !== null) return;

    setTotalAttempts((prev) => prev + 1);

    if (selectedId === currentQuestion.targetFruit.id) {
      // Correct!
      playPop();
      playSuccess();
      setBiteFruit(selectedId);
      setDinoEmotion('celebrate');
      setWrongAnswers([]);

      setTimeout(() => {
        setBiteFruit(null);
        setDinoEmotion('idle');
        
        if (step < totalQuestions - 1) {
          setStep((prev) => prev + 1);
        } else {
          // Completed all steps!
          handleVictory();
        }
      }, 1500);

    } else {
      // Incorrect
      playError();
      setDinoEmotion('sad');
      setWrongAnswers((prev) => [...prev, selectedId]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = () => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();

    // Calculate stars
    // Best case: 5 questions in 5 attempts = 3 stars.
    // 6-7 attempts = 2 stars.
    // More = 1 star.
    let starsEarned = 1;
    if (totalAttempts <= 5) starsEarned = 3;
    else if (totalAttempts <= 7) starsEarned = 2;

    completeWorld('colors', starsEarned);
    speak(`Muito bem! Você ajudou o Dino a comer todas as frutinhas coloridas! Você ganhou ${starsEarned} estrelas!`);
  };

  const handlePlayAgain = () => {
    playClick();
    setStep(0);
    setGameState('playing');
    setDinoEmotion('idle');
    setTotalAttempts(0);
    setWrongAnswers([]);
    setShowConfetti(false);
    setBiteFruit(null);

    // Regenerate questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const shuffledFruits = shuffle(FRUIT_OPTIONS);
    const questionsList: Question[] = [];
    for (let i = 0; i < totalQuestions; i++) {
      const targetFruit = shuffledFruits[i];
      const pool = FRUIT_OPTIONS.filter((f) => f.id !== targetFruit.id);
      const randomOthers = shuffle(pool).slice(0, 3);
      const options = shuffle([targetFruit, ...randomOthers]);
      questionsList.push({ targetFruit, options });
    }
    setQuestions(questionsList);
  };


  return (
    <GameLayout
      title="Vale das Cores"
      instructionText={gameState === 'victory' ? 'Parabéns!' : instructionText}
      starsEarned={gameState === 'victory' ? (totalAttempts <= 5 ? 3 : totalAttempts <= 7 ? 2 : 1) : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Dino Section */}
          <div className={styles.dinoContainer}>
            <DinoAvatar
              type={dino.type}
              color={dino.color}
              accessory={dino.accessory}
              animation={dinoEmotion}
              size={180}
            />
            {biteFruit && (
              <div className={styles.sparkleGroup}>
                <span className={styles.sparkle1}>⭐</span>
                <span className={styles.sparkle2}>✨</span>
                <span className={styles.sparkle3}>⭐</span>
              </div>
            )}
            <div className={styles.bowlPlate}>
              Prato do Dino 🍽️
            </div>
          </div>

          {/* Options Grid */}
          <div className={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isWrong = wrongAnswers.includes(option.id);
              const isBitten = biteFruit === option.id;

              return (
                <button
                  key={option.id}
                  id={`fruit-${option.id}`}
                  className={`${styles.fruitCard} ${isWrong ? styles.wrongCard : ''} ${isBitten ? styles.bittenCard : ''}`}
                  onClick={() => handleFruitClick(option.id)}
                  onMouseEnter={playHover}
                  disabled={isWrong || isBitten}
                  style={{
                    backgroundColor: 'white',
                    borderColor: option.colorHex,
                  }}
                >
                  <div className={styles.fruitSvgWrapper}>
                    {option.svg}
                  </div>
                  <span className={styles.fruitLabel} style={{ color: option.colorHex }}>
                    {option.colorName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <div className={styles.victoryCard}>
          <div className={styles.victoryBadge}>🏆</div>
          <h2 className={styles.victoryTitle}>Incrível!</h2>
          <p className={styles.victoryText}>
            Você conhece muito bem as cores! O Dino está de barriga cheia e muito feliz!
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
              id="btn-victory-replay"
              className="btn-bubble"
              style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
              onClick={handlePlayAgain}
              onMouseEnter={playHover}
            >
              <RotateCcw size={20} />
              <span>Jogar de Novo</span>
            </button>
            <button
              id="btn-victory-map"
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
