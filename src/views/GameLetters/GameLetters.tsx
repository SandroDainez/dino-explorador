import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { GameLayout } from '../../components/GameLayout';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { RotateCcw, Map } from 'lucide-react';
import styles from './GameLetters.module.css';

interface LetterQuestion {
  word: string;
  emoji: string;
  targetLetter: string;
  distractors: string[];
}

const LETTER_QUESTIONS: LetterQuestion[] = [
  { word: 'Abelha', emoji: '🐝', targetLetter: 'A', distractors: ['M', 'O'] },
  { word: 'Borboleta', emoji: '🦋', targetLetter: 'B', distractors: ['P', 'V'] },
  { word: 'Dinossauro', emoji: '🦖', targetLetter: 'D', distractors: ['B', 'T'] },
  { word: 'Elefante', emoji: '🐘', targetLetter: 'E', distractors: ['A', 'I'] },
  { word: 'Gato', emoji: '🐱', targetLetter: 'G', distractors: ['J', 'C'] },
];

export const GameLetters: React.FC = () => {
  const { dino, completeWorld, setCurrentView } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory, playJump } = useAudioEngine();
  const { speak, cancelSpeech } = useSpeechSynthesis();

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<LetterQuestion[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [dinoEmotion, setDinoEmotion] = useState<'idle' | 'walk' | 'celebrate' | 'sad'>('idle');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [jumpingStoneIdx, setJumpingStoneIdx] = useState<number | null>(null);

  const totalQuestions = 5;

  useEffect(() => {
    // We shuffle the choices of letters for each question
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    
    // We shuffle the questions list itself to keep it fresh, but keep them at length 5.
    const shuffledQuestions = shuffle(LETTER_QUESTIONS).map(q => ({
      ...q,
      distractors: shuffle(q.distractors),
    }));

    setQuestions(shuffledQuestions);
  }, []);

  const currentQuestion = questions[step];
  
  const instructionText = currentQuestion
    ? `Dino quer atravessar o rio! Com qual letra começa a palavra ${currentQuestion.word}?`
    : '';

  const handleLetterClick = (letter: string, optionIdx: number) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || jumpingStoneIdx !== null) return;

    setTotalAttempts((prev) => prev + 1);

    if (letter === currentQuestion.targetLetter) {
      // Correct!
      playJump();
      playSuccess();
      setJumpingStoneIdx(optionIdx);
      setDinoEmotion('walk');
      setWrongAnswers([]);

      setTimeout(() => {
        setJumpingStoneIdx(null);
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
      setWrongAnswers((prev) => [...prev, letter]);

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

    completeWorld('letters', starsEarned);
    speak(`Sensacional! Você ajudou o Dino a atravessar todo o Rio das Letras! Você ganhou ${starsEarned} estrelas!`);
  };

  const handlePlayAgain = () => {
    playClick();
    setStep(0);
    setGameState('playing');
    setDinoEmotion('idle');
    setTotalAttempts(0);
    setWrongAnswers([]);
    setShowConfetti(false);
    setJumpingStoneIdx(null);

    // Regenerate/shuffle questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const shuffledQuestions = shuffle(LETTER_QUESTIONS).map(q => ({
      ...q,
      distractors: shuffle(q.distractors),
    }));
    setQuestions(shuffledQuestions);
  };

  const getOptionsRow = () => {
    if (!currentQuestion) return [];
    // Combine target and distractors and sort them alphabetically so they aren't in predictable spots
    return [currentQuestion.targetLetter, ...currentQuestion.distractors].sort();
  };

  const currentOptions = getOptionsRow();

  return (
    <GameLayout
      title="Rio das Letras"
      instructionText={gameState === 'victory' ? 'Rio atravessado!' : instructionText}
      starsEarned={gameState === 'victory' ? (totalAttempts <= 5 ? 3 : totalAttempts <= 7 ? 2 : 1) : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Card detailing word and picture */}
          <div className={styles.wordCard}>
            <span className={styles.wordEmoji}>{currentQuestion.emoji}</span>
            <div className={styles.wordHint}>
              Qual letra começa?
              <span className={styles.wordMystery}>
                _ {currentQuestion.word.substring(1)}
              </span>
            </div>
          </div>

          {/* River Area showing Dino jumping across stepping stones */}
          <div className={styles.riverArea}>
            <div className={styles.riverWater}>
              {/* Left starting river bank */}
              <div className={styles.riverBankLeft} />

              {/* Stepping Stones inside the river */}
              {currentOptions.map((letter, idx) => {
                const isWrong = wrongAnswers.includes(letter);
                const isJumpingHere = jumpingStoneIdx === idx;

                return (
                  <button
                    key={idx}
                    id={`stone-${letter}`}
                    className={`${styles.stone} ${isWrong ? styles.wrongStone : ''} ${isJumpingHere ? styles.jumpingStone : ''}`}
                    onClick={() => handleLetterClick(letter, idx)}
                    disabled={isWrong || jumpingStoneIdx !== null}
                    onMouseEnter={playHover}
                  >
                    {isJumpingHere && (
                      <div className={styles.sparkleGroup}>
                        <span className={styles.sparkle1}>⭐</span>
                        <span className={styles.sparkle2}>✨</span>
                        <span className={styles.sparkle3}>⭐</span>
                      </div>
                    )}
                    <span className={styles.stoneLetter}>{letter}</span>
                  </button>
                );
              })}

              {/* Right landing river bank */}
              <div className={styles.riverBankRight} />

              {/* Dino Avatar positioned above water, jumping */}
              <div
                className={`${styles.dinoOnRiver} ${jumpingStoneIdx !== null ? styles.dinoJumping : ''}`}
                style={{
                  left: jumpingStoneIdx !== null ? `${30 + jumpingStoneIdx * 20}%` : '10%',
                  transform: 'translateX(-50%)',
                }}
              >
                <DinoAvatar
                  type={dino.type}
                  color={dino.color}
                  accessory={dino.accessory}
                  animation={dinoEmotion}
                  size={100}
                  className={styles.dinoSvg}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <div className={styles.victoryCard}>
          <div className={styles.victoryBadge}>🔤</div>
          <h2 className={styles.victoryTitle}>Espetacular!</h2>
          <p className={styles.victoryText}>
            Você conhece muito bem o alfabeto! O Dino atravessou o rio e completou sua expedição de letras!
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
              id="btn-victory-letters-replay"
              className="btn-bubble"
              style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
              onClick={handlePlayAgain}
              onMouseEnter={playHover}
            >
              <RotateCcw size={20} />
              <span>Jogar de Novo</span>
            </button>
            <button
              id="btn-victory-letters-map"
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
