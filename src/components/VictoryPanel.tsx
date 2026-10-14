import { ArrowRight, Map, RotateCcw } from 'lucide-react';
import type { GameView } from '../context/GameContext';
import { useGame } from '../context/GameContext';
import { suggestedNext } from '../game/phases';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { unlockAudio, useNarration } from '../hooks/useNarration';
import styles from './VictoryPanel.module.css';

interface VictoryActionsProps {
  worldId: GameView;
  replayId: string;
  mapId: string;
  onReplay: () => void;
}

export const VictoryActions = ({
  worldId,
  replayId,
  mapId,
  onReplay,
}: VictoryActionsProps) => {
  const { setCurrentView, progress } = useGame();
  const { playClick, playHover } = useAudioEngine();
  const { cancel } = useNarration();
  const upcoming = suggestedNext(worldId, progress.stars);

  const goTo = (view: GameView) => {
    unlockAudio();
    playClick();
    cancel();
    setCurrentView(view);
  };

  return (
    <div className={styles.victoryActions}>
      {upcoming ? (
        <p className={styles.nextHint}>Próxima fase: {upcoming.name}</p>
      ) : (
        <p className={styles.nextHint}>Você explorou todas as fases!</p>
      )}
      <div className={styles.victoryButtons}>
        {upcoming && (
          <button
            id={`btn-next-${worldId}`}
            className="btn-bubble"
            style={{ backgroundColor: 'var(--color-orange)', color: 'white' }}
            onClick={() => goTo(upcoming.id)}
            onMouseEnter={playHover}
          >
            <ArrowRight size={20} />
            <span>Fazer {upcoming.name}</span>
          </button>
        )}
        <button
          id={replayId}
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
          onClick={onReplay}
          onMouseEnter={playHover}
        >
          <RotateCcw size={20} />
          <span>Repetir esta fase</span>
        </button>
        <button
          id={mapId}
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-green)', color: 'white' }}
          onClick={() => goTo('map')}
          onMouseEnter={playHover}
        >
          <Map size={20} />
          <span>Escolher outra</span>
        </button>
      </div>
    </div>
  );
};

interface VictoryPanelProps {
  worldId: GameView;
  badge: string;
  title: string;
  text: string;
  stars: number;
  replayId: string;
  mapId: string;
  onReplay: () => void;
}

export const VictoryPanel = ({
  badge,
  title,
  text,
  stars,
  worldId,
  replayId,
  mapId,
  onReplay,
}: VictoryPanelProps) => {
  return (
    <div className={styles.victoryCard}>
      <div className={styles.victoryBadge}>{badge}</div>
      <h2 className={styles.victoryTitle}>{title}</h2>
      <p className={styles.victoryText}>{text}</p>
      <div className={styles.victoryStarsContainer}>
        {[1, 2, 3].map((star) => (
          <span
            key={star}
            className={`${styles.victoryStar} ${star <= stars ? styles.finalStarFilled : styles.finalStarEmpty}`}
          >
            ⭐
          </span>
        ))}
      </div>
      <VictoryActions worldId={worldId} replayId={replayId} mapId={mapId} onReplay={onReplay} />
    </div>
  );
};
