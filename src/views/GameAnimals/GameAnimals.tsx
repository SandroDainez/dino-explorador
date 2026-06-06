import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { RotateCcw, Map } from 'lucide-react';
import styles from './GameAnimals.module.css';

interface AnimalOption {
  id: 'frog' | 'elephant' | 'lion' | 'fish' | 'bird';
  name: string;
  svg: (color: string) => React.ReactNode;
  soundName: string; // sound representation
}

const ANIMALS: Record<string, AnimalOption> = {
  frog: {
    id: 'frog',
    name: 'Sapo',
    soundName: 'o sapo coaxando! Rec, rec!',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Frog legs */}
        <ellipse cx="25" cy="75" rx="12" ry="8" fill={color === '#000' ? '#000' : '#81C784'} stroke={color === '#000' ? 'none' : '#388E3C'} strokeWidth="2" />
        <ellipse cx="75" cy="75" rx="12" ry="8" fill={color === '#000' ? '#000' : '#81C784'} stroke={color === '#000' ? 'none' : '#388E3C'} strokeWidth="2" />
        {/* Frog body */}
        <ellipse cx="50" cy="65" rx="30" ry="24" fill={color === '#000' ? '#000' : '#4CAF50'} stroke={color === '#000' ? 'none' : '#388E3C'} strokeWidth="3" />
        <ellipse cx="50" cy="68" rx="16" ry="14" fill={color === '#000' ? '#000' : '#C8E6C9'} />
        {/* Eyes */}
        <circle cx="35" cy="42" r="10" fill={color === '#000' ? '#000' : '#4CAF50'} stroke={color === '#000' ? 'none' : '#388E3C'} strokeWidth="2" />
        <circle cx="65" cy="42" r="10" fill={color === '#000' ? '#000' : '#4CAF50'} stroke={color === '#000' ? 'none' : '#388E3C'} strokeWidth="2" />
        {color !== '#000' && (
          <>
            <circle cx="35" cy="42" r="5" fill="white" />
            <circle cx="35" cy="42" r="2.5" fill="black" />
            <circle cx="65" cy="42" r="5" fill="white" />
            <circle cx="65" cy="42" r="2.5" fill="black" />
            {/* Smile */}
            <path d="M 40 64 Q 50 72, 60 64" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="36" cy="60" r="2" fill="#E57373" />
            <circle cx="64" cy="60" r="2" fill="#E57373" />
          </>
        )}
      </svg>
    ),
  },
  elephant: {
    id: 'elephant',
    name: 'Elefante',
    soundName: 'o elefante barulhento! Fuumm!',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Elephant body */}
        <circle cx="48" cy="62" r="26" fill={color === '#000' ? '#000' : '#90A4AE'} stroke={color === '#000' ? 'none' : '#546E7A'} strokeWidth="3" />
        {/* Ears */}
        <path d="M 26 40 C 10 40, 15 75, 30 70 Z" fill={color === '#000' ? '#000' : '#78909C'} stroke={color === '#000' ? 'none' : '#546E7A'} strokeWidth="2" />
        <path d="M 70 40 C 86 40, 81 75, 66 70 Z" fill={color === '#000' ? '#000' : '#78909C'} stroke={color === '#000' ? 'none' : '#546E7A'} strokeWidth="2" />
        {/* Trunk */}
        <path d="M 48 68 Q 48 88, 62 88 Q 66 88, 62 82" stroke={color === '#000' ? '#000' : '#90A4AE'} strokeWidth="8" fill="none" strokeLinecap="round" />
        {/* Legs */}
        <rect x="30" y="75" width="12" height="15" fill={color === '#000' ? '#000' : '#546E7A'} rx="4" />
        <rect x="54" y="75" width="12" height="15" fill={color === '#000' ? '#000' : '#546E7A'} rx="4" />
        {color !== '#000' && (
          <>
            {/* Eyes */}
            <circle cx="38" cy="55" r="3.5" fill="black" />
            <circle cx="58" cy="55" r="3.5" fill="black" />
            {/* Tusks */}
            <path d="M 42 66 L 38 72 L 44 68 Z" fill="white" />
            <path d="M 54 66 L 58 72 L 52 68 Z" fill="white" />
          </>
        )}
      </svg>
    ),
  },
  lion: {
    id: 'lion',
    name: 'Leão',
    soundName: 'o leão rugindo! Rrrraaar!',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Lion Mane (Back) */}
        <circle cx="50" cy="55" r="32" fill={color === '#000' ? '#000' : '#FF8A65'} stroke={color === '#000' ? 'none' : '#D84315'} strokeWidth="3" />
        <circle cx="50" cy="55" r="28" fill={color === '#000' ? '#000' : '#FF7043'} />
        {/* Head */}
        <circle cx="50" cy="55" r="22" fill={color === '#000' ? '#000' : '#FFCA28'} stroke={color === '#000' ? 'none' : '#F57F17'} strokeWidth="2.5" />
        {/* Ears */}
        <circle cx="33" cy="38" r="8" fill={color === '#000' ? '#000' : '#FFCA28'} stroke={color === '#000' ? 'none' : '#F57F17'} strokeWidth="1.5" />
        <circle cx="67" cy="38" r="8" fill={color === '#000' ? '#000' : '#FFCA28'} stroke={color === '#000' ? 'none' : '#F57F17'} strokeWidth="1.5" />
        {color !== '#000' && (
          <>
            <circle cx="33" cy="38" r="4" fill="#FF7043" />
            <circle cx="67" cy="38" r="4" fill="#FF7043" />
            {/* Eyes */}
            <circle cx="43" cy="50" r="3" fill="black" />
            <circle cx="57" cy="50" r="3" fill="black" />
            {/* Snout */}
            <polygon points="50,56 46,60 54,60" fill="#D84315" />
            <path d="M 50 60 L 50 64 M 50 64 Q 48 66, 46 64 M 50 64 Q 52 66, 54 64" stroke="black" strokeWidth="1.5" fill="none" />
            {/* Cheeks blush */}
            <circle cx="39" cy="56" r="2" fill="#FF8A65" />
            <circle cx="61" cy="56" r="2" fill="#FF8A65" />
          </>
        )}
      </svg>
    ),
  },
  bird: {
    id: 'bird',
    name: 'Pássaro',
    soundName: 'o passarinho cantando! Piu, piu!',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Tail */}
        <path d="M 28 65 L 12 72 L 22 55 Z" fill={color === '#000' ? '#000' : '#FFB74D'} stroke={color === '#000' ? 'none' : '#F57C00'} strokeWidth="2" />
        {/* Wings */}
        <path d="M 44 60 C 35 40, 20 62, 35 72 Z" fill={color === '#000' ? '#000' : '#FFB74D'} stroke={color === '#000' ? 'none' : '#F57C00'} strokeWidth="1.5" />
        {/* Bird body */}
        <circle cx="50" cy="58" r="24" fill={color === '#000' ? '#000' : '#FFD54F'} stroke={color === '#000' ? 'none' : '#FFA000'} strokeWidth="3" />
        {/* Head */}
        <circle cx="68" cy="44" r="15" fill={color === '#000' ? '#000' : '#FFD54F'} stroke={color === '#000' ? 'none' : '#FFA000'} strokeWidth="2" />
        {/* Beak */}
        <polygon points="82,40 94,44 82,48" fill={color === '#000' ? '#000' : '#FF8F00'} stroke={color === '#000' ? 'none' : '#E65100'} strokeWidth="1.5" />
        {color !== '#000' && (
          <>
            {/* Eye */}
            <circle cx="72" cy="40" r="2.5" fill="black" />
            <circle cx="71" cy="39" r="0.6" fill="white" />
            {/* Cheek blush */}
            <circle cx="74" cy="46" r="2" fill="#FF8A65" />
          </>
        )}
      </svg>
    ),
  },
  fish: {
    id: 'fish',
    name: 'Peixe',
    soundName: 'o peixe fazendo bolhas! Blu, blu!',
    svg: (color) => (
      <svg width="80" height="80" viewBox="0 0 100 100">
        {/* Tail fin */}
        <path d="M 25 55 L 8 40 L 8 70 Z" fill={color === '#000' ? '#000' : '#4DD0E1'} stroke={color === '#000' ? 'none' : '#00ACC1'} strokeWidth="2.5" />
        {/* Fish body */}
        <ellipse cx="52" cy="55" r="28" ry="20" fill={color === '#000' ? '#000' : '#00bcd4'} stroke={color === '#000' ? 'none' : '#00838F'} strokeWidth="3" />
        {/* Top fin */}
        <path d="M 52 35 Q 40 20, 60 25 Z" fill={color === '#000' ? '#000' : '#4DD0E1'} />
        {color !== '#000' && (
          <>
            {/* Eye */}
            <circle cx="68" cy="50" r="3.5" fill="white" />
            <circle cx="68" cy="50" r="1.8" fill="black" />
            {/* Gills */}
            <path d="M 45 47 Q 48 55, 45 63" stroke="#00838F" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Little smile */}
            <path d="M 74 56 Q 72 60, 68 57" stroke="black" strokeWidth="1.5" fill="none" />
          </>
        )}
      </svg>
    ),
  },
};

interface Question {
  targetAnimal: AnimalOption;
  options: AnimalOption[];
}

export const GameAnimals: React.FC = () => {
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
  const [isRevealed, setIsRevealed] = useState(false);

  const totalQuestions = 5;

  useEffect(() => {
    const questionsList: Question[] = [];
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // List of keys
    const keys: ('frog' | 'elephant' | 'lion' | 'bird' | 'fish')[] = ['frog', 'elephant', 'lion', 'bird', 'fish'];
    const shuffledKeys = shuffle(keys);

    shuffledKeys.forEach((key) => {
      const targetAnimal = ANIMALS[key];
      const pool = keys.filter((k) => k !== key).map((k) => ANIMALS[k]);
      const distractors = shuffle(pool).slice(0, 2);

      const options = shuffle([targetAnimal, ...distractors]);
      questionsList.push({ targetAnimal, options });
    });

    setQuestions(questionsList);
  }, []);

  const currentQuestion = questions[step];
  
  const instructionText = currentQuestion
    ? `Qual animal faz essa sombra escura na floresta?`
    : '';

  const handleAnimalClick = (animal: AnimalOption) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || isRevealed) return;

    setTotalAttempts((prev) => prev + 1);

    if (animal.id === currentQuestion.targetAnimal.id) {
      // Correct!
      playPop();
      playSuccess();
      setIsRevealed(true);
      setDinoEmotion('celebrate');
      setWrongAnswers([]);
      
      // Narrate animal name and sound
      speak(`É o ${currentQuestion.targetAnimal.name}! Ouça ${currentQuestion.targetAnimal.soundName}`);

      setTimeout(() => {
        setIsRevealed(false);
        setDinoEmotion('idle');
        
        if (step < totalQuestions - 1) {
          setStep((prev) => prev + 1);
        } else {
          handleVictory();
        }
      }, 3000); // 3s so they can hear the narrator talk about the animal

    } else {
      // Incorrect
      playError();
      setDinoEmotion('sad');
      setWrongAnswers((prev) => [...prev, animal.id]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = () => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();

    let starsEarned = 1;
    if (totalAttempts <= 5) starsEarned = 3;
    else if (totalAttempts <= 7) starsEarned = 2;

    completeWorld('animals', starsEarned);
  };

  const handlePlayAgain = () => {
    playClick();
    setStep(0);
    setGameState('playing');
    setDinoEmotion('idle');
    setTotalAttempts(0);
    setWrongAnswers([]);
    setShowConfetti(false);
    setIsRevealed(false);

    // Regenerate/shuffle questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const keys: ('frog' | 'elephant' | 'lion' | 'bird' | 'fish')[] = ['frog', 'elephant', 'lion', 'bird', 'fish'];
    const shuffledKeys = shuffle(keys);
    const questionsList: Question[] = [];

    shuffledKeys.forEach((key) => {
      const targetAnimal = ANIMALS[key];
      const pool = keys.filter((k) => k !== key).map((k) => ANIMALS[k]);
      const distractors = shuffle(pool).slice(0, 2);
      const options = shuffle([targetAnimal, ...distractors]);
      questionsList.push({ targetAnimal, options });
    });

    setQuestions(questionsList);
  };

  return (
    <GameLayout
      title="Floresta dos Animais"
      instructionText={gameState === 'victory' ? 'Sombra encontrada!' : instructionText}
      starsEarned={gameState === 'victory' ? (totalAttempts <= 5 ? 3 : totalAttempts <= 7 ? 2 : 1) : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Left Panel: Silhouette Viewer */}
          <div className={styles.viewerSection}>
            <div className={styles.silhouettePlate}>
              {/* Show silhouette (black) or colored (when revealed) */}
              {isRevealed
                ? currentQuestion.targetAnimal.svg(dino.color) /* Pass color to show details */
                : currentQuestion.targetAnimal.svg('#000')}
              {isRevealed && (
                <div className={styles.sparkleGroup}>
                  <span className={styles.sparkle1}>⭐</span>
                  <span className={styles.sparkle2}>✨</span>
                  <span className={styles.sparkle3}>⭐</span>
                </div>
              )}
            </div>
            
            <div className={styles.labelPlate}>
              {isRevealed ? (
                <span className={`${styles.animalNameReveal} animate-pop-in`}>
                  {currentQuestion.targetAnimal.name}! 🌟
                </span>
              ) : (
                <span>Quem está escondido? 🔍</span>
              )}
            </div>
          </div>

          {/* Right Panel: Choices */}
          <div className={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isWrong = wrongAnswers.includes(option.id);

              return (
                <button
                  key={option.id}
                  id={`animal-${option.id}`}
                  className={`${styles.animalCard} ${isWrong ? styles.wrongCard : ''} ${isRevealed && option.id === currentQuestion.targetAnimal.id ? styles.correctCard : ''}`}
                  onClick={() => handleAnimalClick(option)}
                  disabled={isWrong || isRevealed}
                  onMouseEnter={playHover}
                >
                  <div className={styles.animalSvgWrapper}>
                    {/* Animal card displays colored version */}
                    {option.svg(dino.color)}
                  </div>
                  <span className={styles.animalLabel}>{option.name}</span>
                </button>
              );
            })}
          </div>

          {/* Dino Assistant */}
          <div className={styles.dinoCorner}>
            <DinoAvatar
              type={dino.type}
              color={dino.color}
              accessory={dino.accessory}
              animation={dinoEmotion}
              size={120}
            />
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <div className={styles.victoryCard}>
          <div className={styles.victoryBadge}>🦁</div>
          <h2 className={styles.victoryTitle}>Brilhante!</h2>
          <p className={styles.victoryText}>
            Você é um incrível zoólogo! Descobriu todos os animais da floresta com muita facilidade!
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
              id="btn-victory-animals-replay"
              className="btn-bubble"
              style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
              onClick={handlePlayAgain}
              onMouseEnter={playHover}
            >
              <RotateCcw size={20} />
              <span>Jogar de Novo</span>
            </button>
            <button
              id="btn-victory-animals-map"
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
