import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { starsFor, victoryLine, withNextPhase } from '../../audio/lines';
import { useCorrectPraise, useWrongHint } from '../../hooks/useNarration';
import { GameLayout } from '../../components/GameLayout';
import { VictoryActions } from '../../components/VictoryPanel';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import styles from './GameLetters.module.css';

interface LetterQuestion {
  word: string;
  emoji: string;
  targetLetter: string;
  distractors: string[];
  clip: string;
}

const LETTER_QUESTIONS: LetterQuestion[] = [
  { word: 'Abelha', emoji: '🐝', targetLetter: 'A', distractors: ['M', 'O'], clip: 'letra-abelha' },
  { word: 'Borboleta', emoji: '🦋', targetLetter: 'B', distractors: ['P', 'V'], clip: 'letra-borboleta' },
  { word: 'Dinossauro', emoji: '🦖', targetLetter: 'D', distractors: ['B', 'T'], clip: 'letra-dinossauro' },
  { word: 'Elefante', emoji: '🐘', targetLetter: 'E', distractors: ['A', 'I'], clip: 'letra-elefante' },
  { word: 'Foca', emoji: '🦭', targetLetter: 'F', distractors: ['V', 'S'], clip: 'letra-foca' },
  { word: 'Gato', emoji: '🐱', targetLetter: 'G', distractors: ['J', 'C'], clip: 'letra-gato' },
  { word: 'Iguana', emoji: '🦎', targetLetter: 'I', distractors: ['E', 'U'], clip: 'letra-iguana' },
  { word: 'Leão', emoji: '🦁', targetLetter: 'L', distractors: ['N', 'R'], clip: 'letra-leao' },
  { word: 'Macaco', emoji: '🐵', targetLetter: 'M', distractors: ['N', 'B'], clip: 'letra-macaco' },
  { word: 'Pato', emoji: '🦆', targetLetter: 'P', distractors: ['B', 'T'], clip: 'letra-pato' },
];

export const GameLetters: React.FC = () => {
  const { dino, completeWorld, progress } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory, playJump } = useAudioEngine();
  const praise = useCorrectPraise();
  const hint = useWrongHint();

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
    const shuffledQuestions = shuffle(LETTER_QUESTIONS).slice(0, 5).map(q => ({
      ...q,
      distractors: shuffle(q.distractors),
    }));

    setQuestions(shuffledQuestions);
  }, []);

  const currentQuestion = questions[step];
  
  const starsEarned = gameState === 'victory' ? starsFor(totalAttempts) : 0;
  const instructionText = gameState === 'victory'
    ? withNextPhase('letters', victoryLine('Sensacional! Você ajudou o Dino a atravessar todo o Rio das Letras!', starsEarned), progress.stars)
    : currentQuestion
      ? `Dino quer atravessar o rio! Com qual letra começa a palavra ${currentQuestion.word}?`
      : '';
  const narrationId = gameState === 'victory'
    ? `vitoria-letras-${starsEarned}`
    : currentQuestion?.clip ?? null;

  const handleLetterClick = (letter: string, optionIdx: number) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || jumpingStoneIdx !== null) return;

    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (letter === currentQuestion.targetLetter) {
      // Correct!
      playJump();
      playSuccess();
      setJumpingStoneIdx(optionIdx);
      setDinoEmotion('walk');
      setWrongAnswers([]);

      praise(() => {
        setJumpingStoneIdx(null);
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
      setWrongAnswers((prev) => [...prev, letter]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = (attempts: number) => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();
    completeWorld('letters', starsFor(attempts));
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
    const shuffledQuestions = shuffle(LETTER_QUESTIONS).slice(0, 5).map(q => ({
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
      instructionText={instructionText}
      narrationId={narrationId}
      starsEarned={starsEarned}
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

              {/* Dino Avatar positioned above water, jumping */}
              <div
                className={`${styles.dinoOnRiver} ${jumpingStoneIdx !== null ? styles.dinoJumping : ''}`}
                style={{
                  left: jumpingStoneIdx !== null ? `${15 + jumpingStoneIdx * 35}%` : '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <DinoAvatar
                  type={dino.type}
                  color={dino.color}
                  accessory={dino.accessory}
                  animation={dinoEmotion}
                  size={110}
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
            worldId="letters"
            replayId="btn-victory-letters-replay"
            mapId="btn-victory-letters-map"
            onReplay={handlePlayAgain}
          />
        </div>
      )}
    </GameLayout>
  );
};
