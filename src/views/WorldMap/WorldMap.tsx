import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import type { GameView } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { DinoAvatar } from '../../components/DinoAvatar';
import { PrehistoricScene } from '../../components/PrehistoricScene';
import { JOURNEY, TRAIL_PATH, type WorldSpot } from '../../game/journey';
import { Home, Award, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import styles from './WorldMap.module.css';

export const WorldMap: React.FC = () => {
  const {
    dino,
    progress,
    setCurrentView,
    soundEnabled,
    setSoundEnabled,
    speechEnabled,
    setSpeechEnabled,
    resetGame,
  } = useGame();

  const { playClick, playHover, playJump } = useAudioEngine();
  const { speak, cancelSpeech } = useSpeechSynthesis();

  // Track position of dino on map. If null, Dino is at the start (bottom-center or floating).
  const [dinoPosition, setDinoPosition] = useState<{ x: number; y: number } | null>(null);
  const [movingToNode, setMovingToNode] = useState<GameView | null>(null);

  const mapInstructions = "Este é o mapa das fases! Escolha uma fase para explorar e aprender com o seu dinossauro!";

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(mapInstructions);
    }, 0);

    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, [speak, cancelSpeech]);

  const handleNodeClick = (node: WorldSpot) => {
    if (movingToNode) return; // prevent multiple clicks while moving
    
    playJump();
    cancelSpeech();
    setMovingToNode(node.id);
    setDinoPosition({ x: node.x, y: node.y });

    // Transition to the game screen after Dino finishes moving
    setTimeout(() => {
      setCurrentView(node.id);
    }, 1200);
  };

  const handleBackToCustomizer = () => {
    playClick();
    cancelSpeech();
    setCurrentView('home');
  };

  const handleReset = () => {
    playClick();
    const confirmReset = window.confirm("Deseja mesmo recomeçar toda a aventura e apagar suas medalhas?");
    if (confirmReset) {
      resetGame();
    }
  };

  // Count total stars
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
  const maxStars = JOURNEY.length * 3;
  const continueWorld = JOURNEY.find((world) => !progress.completedWorlds.includes(world.id));

  return (
    <div className={styles.container}>
      <PrehistoricScene />
      <div className={styles.topBar}>
        <button
          id="btn-back-to-customizer"
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-pink)', color: 'white', padding: '10px 18px', fontSize: '0.95rem' }}
          onClick={handleBackToCustomizer}
          onMouseEnter={playHover}
        >
          <Home size={18} />
          <span>Mudar Dino</span>
        </button>

        <div className={styles.topRightControls}>
          <button
            id="btn-toggle-sound-map"
            className={`${styles.iconBtn} ${soundEnabled ? styles.active : ''}`}
            onClick={() => { playClick(); setSoundEnabled(!soundEnabled); }}
            onMouseEnter={playHover}
            title="Ativar/Desativar som"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button
            id="btn-toggle-speech-map"
            className={`${styles.iconBtn} ${speechEnabled ? styles.active : ''}`}
            onClick={() => {
              playClick();
              const nextState = !speechEnabled;
              setSpeechEnabled(nextState);
              if (nextState) speak(mapInstructions, true);
              else cancelSpeech();
            }}
            onMouseEnter={playHover}
            title="Ativar/Desativar narração"
          >
            <span style={{ fontSize: '1.1rem' }}>🗣️</span>
          </button>

          <button
            id="btn-reset-game"
            className={styles.resetBtn}
            onClick={handleReset}
            onMouseEnter={playHover}
            title="Recomeçar o jogo"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className={styles.statsPanel}>
        <div className={styles.statItem}>
          <span style={{ fontSize: '1.75rem' }}>⭐</span>
          <div>
            <div className={styles.statLabel}>Estrelas</div>
            <div className={styles.statVal}>{totalStars} / {maxStars}</div>
          </div>
        </div>

        <div className={styles.statItem}>
          <span style={{ fontSize: '1.75rem' }}>🏆</span>
          <div>
            <div className={styles.statLabel}>Medalhas</div>
            <div className={styles.statVal}>{progress.medals.length} / {JOURNEY.length}</div>
          </div>
        </div>
      </div>

      <div className={styles.trailBar}>
        <h2 className={styles.mapHeading}>{JOURNEY.length} fases para explorar</h2>
        {continueWorld ? (
          <button
            id="btn-continue-trail"
            className={styles.continueBtn}
            onClick={() => handleNodeClick(continueWorld)}
            onMouseEnter={playHover}
          >
            Continuar · {continueWorld.name}
          </button>
        ) : (
          <p className={styles.continueDone}>Trilha completa!</p>
        )}
      </div>

      <div className={styles.mapArea}>
        <div className={styles.mapDecor} aria-hidden="true">
          <span className={styles.pond} />
          <span className={styles.treeOne} />
          <span className={styles.treeTwo} />
          <span className={styles.boulder} />
        </div>
        <svg className={styles.pathwaySvg} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={TRAIL_PATH}
            fill="none"
            stroke="#8a5a32"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={TRAIL_PATH}
            fill="none"
            stroke="#e6c48a"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Map Nodes */}
        {JOURNEY.map((node, index) => {
          const starsEarned = progress.stars[node.id] || 0;

          return (
            <button
              key={node.id}
              id={`map-node-${node.id}`}
              className={`${styles.mapNode} ${movingToNode === node.id ? styles.targetNode : ''} ${node.x < 30 ? styles.edgeLeft : ''} ${node.x > 70 ? styles.edgeRight : ''}`}
              aria-label={`Fase ${index + 1}: ${node.name}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                backgroundColor: node.color,
                boxShadow: `0 8px 0 rgba(0,0,0,0.2), 0 0 20px ${node.color}55`,
              }}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={playHover}
            >
              <span className={styles.phaseChip}>{index + 1}</span>
              <span className={styles.nodeIcon}>
                <img src={node.image} alt="" />
              </span>
              
              <div className={styles.nodeBadge}>
                <span className={styles.nodeName}>{node.name}</span>
                <div className={styles.nodeStars}>
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={star <= starsEarned ? styles.starFilled : styles.starEmpty}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}

        {/* Dino Moving Avatar */}
        <div
          className={styles.dinoAvatarOnMap}
          style={{
            left: dinoPosition ? `${dinoPosition.x}%` : '36%',
            top: dinoPosition ? `${dinoPosition.y}%` : '92%',
            transform: `translate(-50%, -85%) ${movingToNode ? 'scale(1.15)' : 'scale(1)'}`,
            transition: 'left 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <DinoAvatar
            type={dino.type}
            color={dino.color}
            accessory={dino.accessory}
            animation={movingToNode ? 'walk' : 'idle'}
            size={100}
          />
        </div>
      </div>

      {/* Medals Drawer */}
      {progress.medals.length > 0 && (
        <div className={styles.medalsDrawer}>
          <div className={styles.medalsTitle}>
            <Award size={20} className={styles.awardIcon} />
            <span>Suas Conquistas:</span>
          </div>
          <div className={styles.medalsList}>
            {progress.medals.map((medal, idx) => (
              <div key={idx} className={styles.medalItem} title={medal}>
                <span className={styles.medalTrophy}>🏆</span>
                <span className={styles.medalName}>{medal}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
