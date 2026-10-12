import React, { useEffect, useState } from 'react';
import { Map, RotateCcw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { nextWorld, type WorldId } from '../game/journey';
import styles from './PhaseComplete.module.css';

const ADVANCE_SECONDS = 8;

interface PhaseCompleteProps {
  worldId: WorldId;
  badge: string;
  title: string;
  message: string;
  stars: number;
  onReplay: () => void;
  replayId: string;
  mapId: string;
}

export const PhaseComplete: React.FC<PhaseCompleteProps> = ({
  worldId,
  badge,
  title,
  message,
  stars,
  onReplay,
  replayId,
  mapId,
}) => {
  const { setCurrentView } = useGame();
  const { playClick, playHover } = useAudioEngine();
  const { cancelSpeech } = useSpeechSynthesis();
  const upcoming = nextWorld(worldId);
  const [secondsLeft, setSecondsLeft] = useState(ADVANCE_SECONDS);

  useEffect(() => {
    if (!upcoming) return;
    if (secondsLeft <= 0) {
      cancelSpeech();
      setCurrentView(upcoming.id);
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, upcoming, cancelSpeech, setCurrentView]);

  const goToMap = () => {
    playClick();
    cancelSpeech();
    setCurrentView('map');
  };

  const goNext = () => {
    if (!upcoming) {
      goToMap();
      return;
    }
    playClick();
    cancelSpeech();
    setCurrentView(upcoming.id);
  };

  return (
    <div className={styles.card}>
      <div className={styles.badge}>{badge}</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>

      <div className={styles.stars} aria-label={`${stars} de 3 estrelas`}>
        {[1, 2, 3].map((star) => (
          <span key={star} className={star <= stars ? styles.starOn : styles.starOff}>
            ⭐
          </span>
        ))}
      </div>

      {upcoming ? (
        <p className={styles.nextLine}>
          Próxima fase em <strong>{secondsLeft}</strong>: {upcoming.name}
        </p>
      ) : (
        <p className={styles.nextLine}>Você concluiu toda a trilha!</p>
      )}

      <div className={styles.buttons}>
        <button
          id="btn-victory-next"
          className={`btn-bubble ${styles.nextButton}`}
          onClick={goNext}
          onMouseEnter={playHover}
        >
          <span>{upcoming ? `Ir para ${upcoming.name}` : 'Ver o mapa'}</span>
        </button>
        <button
          id={replayId}
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
          onClick={() => {
            playClick();
            onReplay();
          }}
          onMouseEnter={playHover}
        >
          <RotateCcw size={20} />
          <span>Jogar de Novo</span>
        </button>
        <button
          id={mapId}
          className="btn-bubble"
          style={{ backgroundColor: 'white', color: 'var(--color-green-dark)' }}
          onClick={goToMap}
          onMouseEnter={playHover}
        >
          <Map size={20} />
          <span>Ir para o Mapa</span>
        </button>
      </div>
    </div>
  );
};
