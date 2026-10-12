import { Map, RotateCcw } from 'lucide-react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import styles from './VictoryPanel.module.css';

interface VictoryPanelProps {
  badge: string;
  title: string;
  text: string;
  stars: number;
  replayId: string;
  mapId: string;
  onReplay: () => void;
  onMap: () => void;
}

export const VictoryPanel = ({
  badge,
  title,
  text,
  stars,
  replayId,
  mapId,
  onReplay,
  onMap,
}: VictoryPanelProps) => {
  const { playHover } = useAudioEngine();

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
      <div className={styles.victoryButtons}>
        <button
          id={replayId}
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
          onClick={onReplay}
          onMouseEnter={playHover}
        >
          <RotateCcw size={20} />
          <span>Jogar de Novo</span>
        </button>
        <button
          id={mapId}
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-green)', color: 'white' }}
          onClick={onMap}
          onMouseEnter={playHover}
        >
          <Map size={20} />
          <span>Ir para o Mapa</span>
        </button>
      </div>
    </div>
  );
};
