import React from 'react';
import { useGame } from '../context/GameContext';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { ArrowLeft, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import styles from './GameLayout.module.css';

interface GameLayoutProps {
  title: string;
  instructionText: string;
  children: React.ReactNode;
  starsEarned?: number;
  currentStep?: number;
  totalSteps?: number;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  title,
  instructionText,
  children,
  starsEarned = 0,
  currentStep,
  totalSteps,
}) => {
  const { soundEnabled, setSoundEnabled, speechEnabled, setSpeechEnabled, setCurrentView } = useGame();
  const { playClick, playHover } = useAudioEngine();
  const { speak, cancelSpeech } = useSpeechSynthesis();

  const handleBack = () => {
    playClick();
    cancelSpeech();
    setCurrentView('map');
  };

  const toggleSound = () => {
    playClick();
    setSoundEnabled(!soundEnabled);
  };

  const toggleSpeech = () => {
    playClick();
    const nextState = !speechEnabled;
    setSpeechEnabled(nextState);
    if (nextState) {
      setTimeout(() => speak(instructionText), 100);
    } else {
      cancelSpeech();
    }
  };

  const handleNarrationClick = () => {
    playClick();
    speak(instructionText);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      speak(instructionText, true);
    }, 800);
    
    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, [instructionText, currentStep]);

  return (
    <div className={styles.container}>
      {/* BACKGROUND LANDSCAPE (Ultra Premium) */}
      <div className={styles.skyBackground}>
        {/* Parallax Clouds */}
        <div className={styles.cloud1} />
        <div className={styles.cloud2} />
        
        {/* Flying Pterodactyl in the background */}
        <div className={styles.pterodactylBg}>
          <svg width="40" height="25" viewBox="0 0 40 25" fill="#E65100" opacity="0.35">
            <path d="M 0 10 Q 10 0, 20 10 T 40 10 Q 30 18, 20 12 T 0 10" />
            <path d="M 20 12 L 20 22 L 18 12 Z" />
          </svg>
        </div>

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
          className="btn-bubble"
          style={{ backgroundColor: 'var(--color-orange)', color: 'white', padding: '10px 18px', fontSize: '1rem' }}
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
