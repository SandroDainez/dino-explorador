import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { GameLayout } from '../../components/GameLayout';
import { PhaseComplete } from '../../components/PhaseComplete';
import { DinoAvatar } from '../../components/DinoAvatar';
import { ConfettiCanvas } from '../../components/ConfettiCanvas';
import { starsForAttempts, starsSpoken } from '../../game/journey';
import styles from './GamePositions.module.css';

type PlaceId = 'up' | 'down' | 'left' | 'right';

interface Place {
  id: PlaceId;
  word: string;
  arrow: string;
}

const PLACES: Place[] = [
  { id: 'up', word: 'em cima', arrow: '↑' },
  { id: 'down', word: 'embaixo', arrow: '↓' },
  { id: 'left', word: 'à esquerda', arrow: '←' },
  { id: 'right', word: 'à direita', arrow: '→' },
];

const ROUND_IDS: PlaceId[] = ['up', 'left', 'down', 'right', 'up'];

export const GamePositions: React.FC = () => {
  const { dino, completeWorld } = useGame();
  const { playHover, playSuccess, playError, playVictory, playPop } = useAudioEngine();
  const [step, setStep] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory'>('playing');
  const [emotion, setEmotion] = useState<'idle' | 'celebrate' | 'sad'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [wrong, setWrong] = useState<PlaceId | null>(null);

  const totalQuestions = ROUND_IDS.length;
  const target = PLACES.find((place) => place.id === ROUND_IDS[step]);
  const starsForRun = starsForAttempts(attempts, totalQuestions);
  const instructionText = gameState === 'victory'
    ? `Muito bem! Você encontrou todos os lugares! Você ganhou ${starsSpoken(starsForRun)}!`
    : target
      ? `Toque ${target.word} do ninho!`
      : '';

  const choose = (place: Place) => {
    if (!target || locked || gameState === 'victory' || wrong === place.id) return;
    setAttempts((value) => value + 1);
    if (place.id !== target.id) {
      playError();
      setEmotion('sad');
      setWrong(place.id);
      window.setTimeout(() => setEmotion('idle'), 700);
      return;
    }

    playPop();
    playSuccess();
    setLocked(true);
    setEmotion('celebrate');
    window.setTimeout(() => {
      setLocked(false);
      setWrong(null);
      setEmotion('idle');
      if (step < totalQuestions - 1) setStep((value) => value + 1);
      else {
        setGameState('victory');
        playVictory();
        completeWorld('positions', starsForAttempts(attempts + 1, totalQuestions));
      }
    }, 900);
  };

  const replay = () => {
    setStep(0);
    setGameState('playing');
    setEmotion('idle');
    setAttempts(0);
    setLocked(false);
    setWrong(null);
  };

  const spot = (id: PlaceId) => PLACES.find((place) => place.id === id)!;

  return (
    <GameLayout
      title="Clareira das Posições"
      instructionText={instructionText}
      starsEarned={gameState === 'victory' ? starsForRun : 0}
      currentStep={gameState === 'victory' ? undefined : step + 1}
      totalSteps={gameState === 'victory' ? undefined : totalQuestions}
    >
      <ConfettiCanvas active={gameState === 'victory'} />
      {gameState === 'playing' && target ? (
        <div className={styles.stage}>
          <DinoAvatar type={dino.type} color={dino.color} accessory={dino.accessory} animation={emotion} size={120} />
          <div className={styles.board}>
            <PlaceButton place={spot('up')} target={target.id} wrong={wrong} locked={locked} onChoose={choose} onHover={playHover} />
            <PlaceButton place={spot('left')} target={target.id} wrong={wrong} locked={locked} onChoose={choose} onHover={playHover} />
            <div className={styles.nest} aria-hidden="true">
              <svg width="110" height="70" viewBox="0 0 110 70">
                <ellipse cx="55" cy="40" rx="48" ry="22" fill="#8D6E63" />
                <ellipse cx="55" cy="36" rx="34" ry="14" fill="#6D4C41" />
                <ellipse cx="42" cy="30" rx="10" ry="13" fill="#FFF59D" />
                <ellipse cx="62" cy="28" rx="10" ry="13" fill="#80DEEA" />
              </svg>
              <span>ninho</span>
            </div>
            <PlaceButton place={spot('right')} target={target.id} wrong={wrong} locked={locked} onChoose={choose} onHover={playHover} />
            <PlaceButton place={spot('down')} target={target.id} wrong={wrong} locked={locked} onChoose={choose} onHover={playHover} />
          </div>
        </div>
      ) : (
        <PhaseComplete
          worldId="positions"
          badge="🧭"
          title="Bom lugar!"
          message="Você achou em cima, embaixo e os dois lados do ninho."
          stars={starsForRun}
          onReplay={replay}
          replayId="btn-victory-positions-replay"
          mapId="btn-victory-positions-map"
        />
      )}
    </GameLayout>
  );
};

function PlaceButton({
  place,
  target,
  wrong,
  locked,
  onChoose,
  onHover,
}: {
  place: Place;
  target: PlaceId;
  wrong: PlaceId | null;
  locked: boolean;
  onChoose: (place: Place) => void;
  onHover: () => void;
}) {
  return (
    <button
      id={place.id === target ? 'pos-correct' : `pos-${place.id}`}
      className={`${styles.spot} ${styles[place.id]} ${wrong === place.id ? styles.wrong : ''}`}
      onClick={() => onChoose(place)}
      onMouseEnter={onHover}
      disabled={locked || wrong === place.id}
    >
      <span className={styles.arrow}>{place.arrow}</span>
      <span>{place.word}</span>
    </button>
  );
}
