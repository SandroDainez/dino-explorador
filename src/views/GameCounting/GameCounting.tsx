import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { GameLayout } from '../../components/GameLayout';
import { PhaseComplete } from '../../components/PhaseComplete';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { starsForAttempts } from '../../game/journey';
import styles from './GameCounting.module.css';

interface Question {
  fireflyCount: number;
  options: number[];
}

// Fixed non-overlapping coordinates for up to 10 fireflies inside a 500x250 container
const FIREFLY_POSITIONS = [
  { x: 250, y: 125 }, // 1
  { x: 100, y: 70 },  // 2
  { x: 400, y: 170 }, // 3
  { x: 150, y: 180 }, // 4
  { x: 350, y: 80 },  // 5
  { x: 250, y: 50 },  // 6
  { x: 450, y: 100 }, // 7
  { x: 70, y: 150 },  // 8
  { x: 200, y: 110 }, // 9
  { x: 300, y: 180 }, // 10
];

export const GameCounting: React.FC = () => {
  const { dino, completeWorld } = useGame();
  const { playClick, playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const { speak } = useSpeechSynthesis();

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [dinoEmotion, setDinoEmotion] = useState<'idle' | 'walk' | 'celebrate' | 'sad'>('idle');
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCounted, setIsCounted] = useState(false);

  const totalQuestions = 8;

  useEffect(() => {
    const questionsList: Question[] = [];
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Target counts for our 5 questions (e.g. random numbers from 1 to 10)
    const targets = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, totalQuestions);

    targets.forEach((targetCount) => {
      // Generate options: targetCount + 3 close distractors
      const pool = Array.from({ length: 10 }, (_, idx) => idx + 1).filter((n) => n !== targetCount);
      const distractors = shuffle(pool).slice(0, 3);
      const options = shuffle([targetCount, ...distractors]);

      questionsList.push({
        fireflyCount: targetCount,
        options,
      });
    });

    setQuestions(questionsList);
  }, []);

  const currentQuestion = questions[step];
  const starsForRun = starsForAttempts(totalAttempts, totalQuestions);

  const instructionText = gameState === 'victory'
    ? `Muito bem! Você contou todos os vaga-lumes! Você ganhou ${starsForRun} estrelas!`
    : currentQuestion
      ? `Dino entrou na caverna! Quantos vaga-lumes brilhantes você consegue contar?`
      : '';

  const handleNumberClick = (num: number) => {
    if (gameState === 'victory' || dinoEmotion !== 'idle' || isCounted) return;

    setTotalAttempts((prev) => prev + 1);

    if (num === currentQuestion.fireflyCount) {
      // Correct!
      playPop();
      playSuccess();
      setIsCounted(true);
      setDinoEmotion('celebrate');
      setWrongAnswers([]);
      
      // Narrate count
      const count = currentQuestion.fireflyCount;
      speak(count === 1 ? 'Isso! É 1 vaga-lume!' : `Isso! São ${count} vaga-lumes!`);

      setTimeout(() => {
        setIsCounted(false);
        setDinoEmotion('idle');
        
        if (step < totalQuestions - 1) {
          setStep((prev) => prev + 1);
        } else {
          handleVictory();
        }
      }, 2000);

    } else {
      // Incorrect
      playError();
      setDinoEmotion('sad');
      setWrongAnswers((prev) => [...prev, num]);

      setTimeout(() => {
        setDinoEmotion('idle');
      }, 800);
    }
  };

  const handleVictory = () => {
    setGameState('victory');
    setShowConfetti(true);
    playVictory();

    completeWorld('counting', starsForAttempts(totalAttempts + 1, totalQuestions));
  };

  const handlePlayAgain = () => {
    playClick();
    setStep(0);
    setGameState('playing');
    setDinoEmotion('idle');
    setTotalAttempts(0);
    setWrongAnswers([]);
    setShowConfetti(false);
    setIsCounted(false);

    // Regenerate/shuffle questions
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const targets = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, totalQuestions);
    const questionsList: Question[] = [];

    targets.forEach((targetCount) => {
      const pool = Array.from({ length: 10 }, (_, idx) => idx + 1).filter((n) => n !== targetCount);
      const distractors = shuffle(pool).slice(0, 3);
      const options = shuffle([targetCount, ...distractors]);
      questionsList.push({ fireflyCount: targetCount, options });
    });

    setQuestions(questionsList);
  };

  const renderFireflySvg = (delay: number) => {
    return (
      <svg
        width="44"
        height="44"
        viewBox="0 0 50 50"
        className={styles.firefly}
        style={{ animationDelay: `${delay}s` }}
      >
        {/* Glowing aura */}
        <circle cx="25" cy="25" r="16" fill="#FFEE58" opacity="0.3" className={styles.glowingAura} />
        {/* Firefly Body */}
        <ellipse cx="25" cy="27" rx="6" ry="10" fill="#37474F" />
        {/* Glow butt */}
        <circle cx="25" cy="34" r="5" fill="#FFEE58" />
        {/* Wings */}
        <ellipse cx="18" cy="23" rx="8" ry="4" fill="#E0F7FA" opacity="0.8" transform="rotate(-20 18 23)" />
        <ellipse cx="32" cy="23" rx="8" ry="4" fill="#E0F7FA" opacity="0.8" transform="rotate(20 32 23)" />
        {/* Head */}
        <circle cx="25" cy="18" r="4.5" fill="#37474F" />
        <circle cx="23" cy="16" r="1" fill="white" />
        <circle cx="27" cy="16" r="1" fill="white" />
        {/* Antennae */}
        <path d="M 23 14 Q 21 10, 19 12" stroke="#37474F" strokeWidth="1" fill="none" />
        <path d="M 27 14 Q 29 10, 31 12" stroke="#37474F" strokeWidth="1" fill="none" />
      </svg>
    );
  };

  return (
    <GameLayout
      title="Caverna da Contagem"
      instructionText={instructionText}
      starsEarned={gameState === 'victory' ? starsForRun : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={showConfetti} />

      {gameState === 'playing' && currentQuestion ? (
        <div className={styles.gameContainer}>
          {/* Cave board representing the dark cave ceiling with fireflies */}
          <div className={styles.caveBoard}>
            {/* Draw rock formations / stalactites in SVG */}
            <svg className={styles.stalactitesSvg}>
              <polygon points="0,0 40,0 20,40" fill="#263238" />
              <polygon points="80,0 150,0 110,60" fill="#263238" />
              <polygon points="200,0 250,0 220,30" fill="#263238" />
              <polygon points="320,0 410,0 360,50" fill="#263238" />
              <polygon points="460,0 500,0 480,30" fill="#263238" />
            </svg>

            {isCounted && (
              <div className={styles.sparkleGroup}>
                <span className={styles.sparkle1}>⭐</span>
                <span className={styles.sparkle2}>✨</span>
                <span className={styles.sparkle3}>⭐</span>
              </div>
            )}

            {/* Fireflies scattered in the cave */}
            {FIREFLY_POSITIONS.slice(0, currentQuestion.fireflyCount).map((pos, idx) => (
              <div
                key={idx}
                className={styles.fireflyWrapper}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                }}
              >
                {renderFireflySvg(idx * 0.15)}
                {isCounted && (
                  /* Number tags showing up when correct answer is picked */
                  <span className={`${styles.countTag} animate-pop-in`}>
                    {idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Numbers grid selection */}
          <div className={styles.optionsContainer}>
            {currentQuestion.options.map((num) => {
              const isWrong = wrongAnswers.includes(num);

              return (
                <button
                  key={num}
                  id={`count-num-${num}`}
                  className={`${styles.numberBtn} ${isWrong ? styles.wrongBtn : ''} ${isCounted && num === currentQuestion.fireflyCount ? styles.correctBtn : ''}`}
                  onClick={() => handleNumberClick(num)}
                  disabled={isWrong || isCounted}
                  onMouseEnter={playHover}
                >
                  <span className={styles.numberLabel}>{num}</span>
                </button>
              );
            })}
          </div>

          {/* Dino Assistant standing next to cave entry */}
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
        <PhaseComplete
          worldId="counting"
          badge="🍎"
          title="Brilhante!"
          message="Que inteligência! Você sabe contar até dez perfeitamente e iluminou toda a caverna!"
          stars={starsForRun}
          onReplay={handlePlayAgain}
          replayId="btn-victory-counting-replay"
          mapId="btn-victory-counting-map"
        />
      )}
    </GameLayout>
  );
};
