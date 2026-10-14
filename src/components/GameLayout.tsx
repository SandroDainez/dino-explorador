import React from 'react';
import { useGame } from '../context/GameContext';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { narrationClipsFor } from '../audio/catalog';
import { isNarrationLocked, useNarration } from '../hooks/useNarration';
import { ArrowLeft, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { PrehistoricScene } from './PrehistoricScene';
import styles from './GameLayout.module.css';

interface GameLayoutProps {
  title: string;
  instructionText: string;
  children: React.ReactNode;
  starsEarned?: number;
  currentStep?: number;
  totalSteps?: number;
  narrationId?: string | null;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  title,
  instructionText,
  children,
  starsEarned = 0,
  currentStep,
  totalSteps,
  narrationId,
}) => {
  const { soundEnabled, setSoundEnabled, speechEnabled, setSpeechEnabled, setCurrentView } = useGame();
  const { playClick, playHover } = useAudioEngine();
  const { play, cancel } = useNarration();
  const [showPraise, setShowPraise] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);

  React.useEffect(() => {
    let timer = 0;
    const onPraise = () => {
      setShowHint(false);
      setShowPraise(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShowPraise(false), 1700);
    };
    const onHint = () => {
      setShowPraise(false);
      setShowHint(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShowHint(false), 2800);
    };
    window.addEventListener('dino-praise', onPraise);
    window.addEventListener('dino-hint', onHint);
    return () => {
      window.removeEventListener('dino-praise', onPraise);
      window.removeEventListener('dino-hint', onHint);
      window.clearTimeout(timer);
    };
  }, []);

  const narrationClips = narrationClipsFor(narrationId);
  const narrationKey = narrationClips.join('|');

  const handleBack = () => {
    playClick();
    cancel();
    setCurrentView('map');
  };

  const toggleSound = () => {
    playClick();
    setSoundEnabled(!soundEnabled);
  };

  const toggleSpeech = () => {
    playClick();
    const next = !speechEnabled;
    setSpeechEnabled(next);
    if (!next) cancel();
  };

  const handleNarrationClick = () => {
    playClick();
    if (narrationClips.length) void play(narrationClips);
  };

  React.useEffect(() => {
    if (!narrationKey) return;
    let alive = true;
    let timer = 0;
    const start = () => {
      if (!alive) return;
      // Praise can still be finishing when the next question or the choice
      // screen appears. Wait, then speak. A skipped start used to leave the
      // next phase silent.
      if (isNarrationLocked()) {
        timer = window.setTimeout(start, 120);
        return;
      }
      void play(narrationKey.split('|'));
    };
    start();

    return () => {
      alive = false;
      window.clearTimeout(timer);
      if (isNarrationLocked()) return;
      cancel();
    };
    // currentStep repeats a question that reuses the same recording, such as
    // the cave line, and the choice lines at the end of every phase.
  }, [narrationKey, currentStep, play, cancel]);

  return (
    <div className={styles.container}>
      {/* BACKGROUND LANDSCAPE (Ultra Premium) */}
      <div className={styles.skyBackground}>
        <PrehistoricScene />

        {/* Volcano Left */}
        <div className={styles.volcanoLeft}>
          <svg width="120" height="90" viewBox="0 0 120 90">
            {/* Volcano Mountain */}
            <polygon points="10,90 60,20 110,90" fill="#78909C" />
            {/* Lava tip */}
            <polygon points="50,34 60,20 70,34" fill="#FF3D00" />
            {/* Twigs on base */}
            <ellipse cx="60" cy="90" rx="55" ry="10" fill="#388E3C" opacity="0.5" />
          </svg>
          {/* Animated Rising Smoke */}
          <div className={`${styles.smokePuff} ${styles.smoke1}`} />
          <div className={`${styles.smokePuff} ${styles.smoke2}`} />
          <div className={`${styles.smokePuff} ${styles.smoke3}`} />
        </div>

        {/* Swaying Palm Tree Right */}
        <div className={`${styles.palmTreeRight} ${styles.swayAnimation}`}>
          <svg width="100" height="150" viewBox="0 0 100 150">
            {/* Trunk */}
            <path d="M 80 150 Q 75 100, 60 40 Q 64 35, 66 40 Q 80 100, 85 150 Z" fill="#8D6E63" />
            {/* Palm Leaves */}
            <g transform="translate(60, 40)" className="animate-sway">
              {/* Top left leaf */}
              <path d="M 0 0 Q -25 -25, -50 -10 Q -25 -5, 0 0" fill="#2E7D32" />
              {/* Top right leaf */}
              <path d="M 0 0 Q 25 -25, 48 -5 Q 22 -3, 0 0" fill="#2E7D32" />
              {/* Mid left leaf */}
              <path d="M 0 0 Q -35 -5, -45 15 Q -25 10, 0 0" fill="#388E3C" />
              {/* Mid right leaf */}
              <path d="M 0 0 Q 35 -2, 42 20 Q 20 10, 0 0" fill="#388E3C" />
              {/* Coconuts */}
              <circle cx="-5" cy="5" r="5" fill="#5D4037" />
              <circle cx="5" cy="7" r="4.5" fill="#5D4037" />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Header */}
      <header className={styles.header}>
        <button
          id="btn-back-to-map"
          className={`${styles.backBtn} btn-bubble`}
          onClick={handleBack}
          onMouseEnter={playHover}
        >
          <ArrowLeft size={20} />
          <span>Mapa</span>
        </button>

        <div className={styles.titleContainer}>
          <h1 className={styles.title}>{title}</h1>
        </div>

        <div className={styles.controls}>
          {/* Audio toggle */}
          <button
            id="btn-toggle-sound"
            className={`${styles.controlBtn} ${soundEnabled ? styles.active : ''}`}
            onClick={toggleSound}
            onMouseEnter={playHover}
            title={soundEnabled ? "Desativar sons" : "Ativar sons"}
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>

          {/* Speech toggle / Listen icon */}
          <button
            id="btn-trigger-speech"
            className={`${styles.controlBtn} ${speechEnabled ? styles.active : ''}`}
            onClick={toggleSpeech}
            onMouseEnter={playHover}
            title={speechEnabled ? "Desativar voz" : "Ativar voz"}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>🗣️</span>
          </button>
        </div>
      </header>

      {showPraise && (
        <div id="praise-banner" className={styles.praiseBurst} role="status">
          Muito bem!
        </div>
      )}
      {showHint && (
        <div id="hint-banner" className={`${styles.praiseBurst} ${styles.hintBurst}`} role="status">
          Quer escolher outra?
        </div>
      )}

      {/* Instruction Box */}
      <div className={styles.instructionBox} onClick={handleNarrationClick}>
        <button className={styles.speechBubbleIcon} title="Ouvir instrução">
          <HelpCircle size={24} />
        </button>
        <p className={styles.instruction}>{instructionText}</p>
      </div>

      {/* Main Game Screen */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Footer Progress & Decoration */}
      <footer className={styles.footer}>
        {currentStep !== undefined && totalSteps !== undefined ? (
          <div className={styles.progressCounter}>
            Pergunta: <strong>{currentStep} de {totalSteps}</strong>
          </div>
        ) : (
          <div />
        )}
        
        {/* Stars representation */}
        <div className={styles.starsContainer}>
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className={`${styles.star} ${star <= starsEarned ? styles.starFilled : styles.starEmpty}`}
            >
              ⭐
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};
