import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import type { GameView } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { DinoAvatar } from '../../components/DinoAvatar';
import { Home, Award, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import styles from './WorldMap.module.css';

interface MapNode {
  id: GameView;
  name: string;
  icon: React.ReactNode;
  x: number; // percentage from left
  y: number; // percentage from top
  color: string;
  desc: string;
}

const MAP_NODES: MapNode[] = [
  {
    id: 'colors',
    name: 'Vale das Cores',
    icon: (
      <svg width="55" height="55" viewBox="0 0 100 100">
        <path d="M 15 65 A 35 35 0 0 1 85 65" fill="none" stroke="#E53935" strokeWidth="8" />
        <path d="M 23 65 A 27 27 0 0 1 77 65" fill="none" stroke="#FFA726" strokeWidth="8" />
        <path d="M 31 65 A 19 19 0 0 1 69 65" fill="none" stroke="#4CAF50" strokeWidth="8" />
        <path d="M 39 65 A 11 11 0 0 1 61 65" fill="none" stroke="#2196F3" strokeWidth="8" />
        <path d="M 30 78 C 18 78, 12 55, 34 50 C 45 47, 65 52, 70 65 C 75 76, 50 86, 30 78 Z" fill="#D7CCC8" stroke="#5D4037" strokeWidth="2.5" />
        <circle cx="28" cy="65" r="4.5" fill="#E53935" />
        <circle cx="42" cy="58" r="4.5" fill="#FFEB3B" />
        <circle cx="56" cy="63" r="4.5" fill="#4CAF50" />
      </svg>
    ),
    x: 15,
    y: 35,
    color: '#FF5722',
    desc: 'Aprenda as cores!',
  },
  {
    id: 'shapes',
    name: 'Templo das Formas',
    icon: (
      <svg width="55" height="55" viewBox="0 0 100 100">
        <rect x="25" y="45" width="10" height="30" fill="#CFD8DC" stroke="#455A64" strokeWidth="2" />
        <rect x="65" y="45" width="10" height="30" fill="#CFD8DC" stroke="#455A64" strokeWidth="2" />
        <polygon points="15,45 50,15 85,45" fill="#90A4AE" stroke="#455A64" strokeWidth="2.5" />
        <polygon points="50,44 53,51 60,51 55,55 57,62 50,58 43,62 45,55 40,51 47,51" fill="#FFD54F" />
      </svg>
    ),
    x: 45,
    y: 20,
    color: '#9C27B0',
    desc: 'Brinque com as formas!',
  },
  {
    id: 'numbers',
    name: 'Ninho dos Números',
    icon: (
      <svg width="55" height="55" viewBox="0 0 100 100">
        <path d="M 15 80 C 15 80, 85 80, 85 70 C 85 55, 60 55, 50 55 C 35 55, 15 65, 15 80 Z" fill="#B0BEC5" />
        <ellipse cx="50" cy="60" rx="30" ry="12" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />
        <ellipse cx="42" cy="54" rx="6" ry="9" fill="#FFF9C4" stroke="#37474F" transform="rotate(-15 42 54)" />
        <ellipse cx="50" cy="51" rx="6" ry="9" fill="#FFCDD2" stroke="#37474F" />
        <ellipse cx="58" cy="55" rx="6" ry="9" fill="#C8E6C9" stroke="#37474F" transform="rotate(20 58 55)" />
      </svg>
    ),
    x: 80,
    y: 30,
    color: '#2196F3',
    desc: 'Conte e choque ovos!',
  },
  {
    id: 'letters',
    name: 'Rio das Letras',
    icon: (
      <svg width="55" height="55" viewBox="0 0 100 100">
        <ellipse cx="30" cy="62" rx="22" ry="11" fill="#90A4AE" stroke="#37474F" strokeWidth="2" />
        <ellipse cx="70" cy="48" rx="22" ry="11" fill="#78909C" stroke="#37474F" strokeWidth="2" />
        <text x="30" y="68" fontFamily="Fredoka" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" style={{ textShadow: '1px 1px 0 #263238' }}>A</text>
        <text x="70" y="54" fontFamily="Fredoka" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" style={{ textShadow: '1px 1px 0 #263238' }}>B</text>
      </svg>
    ),
    x: 20,
    y: 70,
    color: '#4CAF50',
    desc: 'Ache as letras certas!',
  },
  {
    id: 'animals',
    name: 'Floresta dos Animais',
    icon: (
      <svg width="55" height="55" viewBox="0 0 100 100">
        <circle cx="50" cy="35" r="22" fill="#2E7D32" />
        <circle cx="33" cy="50" r="18" fill="#388E3C" />
        <circle cx="67" cy="48" r="18" fill="#388E3C" />
        <rect x="46" y="58" width="8" height="22" fill="#5D4037" />
        <polygon points="26,38 18,26 31,31" fill="#E91E63" />
        <polygon points="74,36 82,24 69,29" fill="#FF9800" />
      </svg>
    ),
    x: 50,
    y: 80,
    color: '#FF9800',
    desc: 'Descubra os animais!',
  },
  {
    id: 'counting',
    name: 'Caverna da Contagem',
    icon: (
      <svg width="55" height="55" viewBox="0 0 100 100">
        <path d="M 12 80 C 12 40, 88 40, 88 80" fill="none" stroke="#455A64" strokeWidth="14" strokeLinecap="round" />
        <path d="M 19 80 C 19 46, 81 46, 81 80" fill="#263238" />
        <polygon points="40,75 44,55 48,75" fill="#FFE082" />
        <polygon points="52,78 57,64 62,78" fill="#80D8FF" />
      </svg>
    ),
    x: 82,
    y: 70,
    color: '#00BCD4',
    desc: 'Conte os objetos!',
  },
];

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

  const mapInstructions = "Este é o mapa do nosso mundo pré-histórico! Escolha um dos seis lugares para explorar e aprender com o seu dinossauro!";

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(mapInstructions);
    }, 800);

    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, []);

  const handleNodeClick = (node: MapNode) => {
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
  const maxStars = MAP_NODES.length * 3;

  return (
    <div className={styles.container}>
      {/* Settings & Reset Bar */}
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
              if (nextState) speak(mapInstructions);
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
            <div className={styles.statVal}>{progress.medals.length} / 6</div>
          </div>
        </div>
      </div>

      {/* Map Board */}
      <div className={styles.mapArea}>
        {/* Draw simple decorative pathway lines on background (SVG Overlay) */}
        <svg className={styles.pathwaySvg}>
          <path
            d="M 15 35 Q 30 25, 45 20 T 80 30 T 82 70 T 50 80 T 20 70 Z"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="8"
            strokeDasharray="15, 10"
            strokeLinecap="round"
          />
        </svg>

        {/* Map Nodes */}
        {MAP_NODES.map((node) => {
          const starsEarned = progress.stars[node.id] || 0;

          return (
            <button
              key={node.id}
              id={`map-node-${node.id}`}
              className={`${styles.mapNode} ${movingToNode === node.id ? styles.targetNode : ''}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                backgroundColor: node.color,
                boxShadow: `0 8px 0 rgba(0,0,0,0.2), 0 0 20px ${node.color}55`,
              }}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={playHover}
            >
              <span className={styles.nodeIcon}>{node.icon}</span>
              
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
            left: dinoPosition ? `${dinoPosition.x}%` : '50%',
            top: dinoPosition ? `${dinoPosition.y}%` : '55%',
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
