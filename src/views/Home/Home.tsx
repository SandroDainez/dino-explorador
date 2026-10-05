import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import type { DinoType, DinoColor, DinoAccessory } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { DinoAvatar } from '../../components/DinoAvatar';
import { PrehistoricScene } from '../../components/PrehistoricScene';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import styles from './Home.module.css';

let initialLoad = true;
let ignoreHomeAutoNarration = false;

export const Home: React.FC = () => {
  const {
    dino,
    updateDinoConfig,
    setCurrentView,
    soundEnabled,
    setSoundEnabled,
    speechEnabled,
    setSpeechEnabled,
  } = useGame();

  const { playClick, playHover, playSuccess } = useAudioEngine();
  const { speak, cancelSpeech } = useSpeechSynthesis();

  const [showSplash, setShowSplash] = useState(initialLoad);
  const [isMobile, setIsMobile] = useState(false);
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsShort(window.innerHeight <= 760);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dinoSize = isMobile ? 112 : isShort ? 128 : 200;

  const introText = "Olá! Escolha o seu dinossauro. Depois toque no botão verde JOGAR para abrir os joguinhos.";

  const handleStartDiscovery = () => {
    playSuccess();
    initialLoad = false;
    ignoreHomeAutoNarration = true;
    window.setTimeout(() => {
      ignoreHomeAutoNarration = false;
    }, 1600);
    setShowSplash(false);
    speak(introText);
  };

  useEffect(() => {
    if (showSplash || ignoreHomeAutoNarration) return;

    const timer = window.setTimeout(() => {
      speak(introText);
    }, 500);

    return () => {
      window.clearTimeout(timer);
      cancelSpeech();
    };
  }, [showSplash, speak, cancelSpeech]);

  if (showSplash) {
    return (
      <div className={styles.container}>
        <PrehistoricScene />

        <div className={styles.stage}>
        <div className={styles.splashCard}>
          <h1 className={styles.splashTitle}>
            <span className={styles.word1}>DINO</span>
            <span className={styles.word2}>EXPLORADOR</span>
          </h1>
          <p className={styles.splashSubtitle}>Uma Aventura Educativa Pré-Histórica!</p>

          <div className={styles.splashDinoPlate}>
            <DinoAvatar
              type="trex"
              color="green"
              accessory="hat"
              animation="celebrate"
              size={isShort ? 96 : 168}
            />
          </div>

          <button
            id="btn-start-discovery"
            className={`${styles.btnStartDiscovery} animate-pulse-soft`}
            onClick={handleStartDiscovery}
            onMouseEnter={playHover}
          >
            <Sparkles size={24} />
            <span>INICIAR AVENTURA!</span>
            <Sparkles size={24} />
          </button>
        </div>
        </div>
      </div>
    );
  }

  const handleTypeChange = (type: DinoType) => {
    playClick();
    updateDinoConfig({ type });
  };

  const handleColorChange = (color: DinoColor) => {
    playClick();
    updateDinoConfig({ color });
  };

  const handleAccessoryChange = (accessory: DinoAccessory) => {
    playClick();
    updateDinoConfig({ accessory });
  };

  const handleStartGame = () => {
    playSuccess();
    cancelSpeech();
    setCurrentView('map');
  };

  return (
    <div className={styles.container}>
      <PrehistoricScene />

      <div className={styles.stage}>
      <div className={styles.settingsBar}>
        <button
          id="btn-toggle-sound-home"
          className={`${styles.iconBtn} ${soundEnabled ? styles.active : ''}`}
          onClick={() => { playClick(); setSoundEnabled(!soundEnabled); }}
          onMouseEnter={playHover}
          title="Sons do jogo"
        >
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        <button
          id="btn-toggle-speech-home"
          className={`${styles.iconBtn} ${speechEnabled ? styles.active : ''}`}
          onClick={() => {
            playClick();
            const nextState = !speechEnabled;
            setSpeechEnabled(nextState);
            if (nextState) speak(introText, true);
            else cancelSpeech();
          }}
          onMouseEnter={playHover}
          title="Narração por voz"
        >
          <span style={{ fontSize: '1.25rem' }}>🗣️</span>
        </button>
      </div>

      {/* Game Title */}
      <header className={styles.header}>
        <h1 className={styles.gameTitle}>
          <span className={styles.word1}>DINO</span>
          <span className={styles.word2}>EXPLORADOR</span>
        </h1>
        <p className={styles.subtitle}>Crie seu explorador e entre nos joguinhos</p>
      </header>

      <div className={styles.workspace}>
        {/* Preview Panel (Left) */}
        <section className={styles.previewSection}>
          <div className={styles.dinoPlate}>
            <div className={styles.spotlightContainer}>
              <svg viewBox="0 0 200 200" className={styles.spotlightSunray}>
                {Array.from({ length: 12 }).map((_, idx) => (
                  <path
                    key={idx}
                    d="M 100 100 L 80 0 L 120 0 Z"
                    fill="rgba(255, 255, 255, 0.25)"
                    transform={`rotate(${idx * 30} 100 100)`}
                  />
                ))}
              </svg>
            </div>
            <DinoAvatar
              type={dino.type}
              color={dino.color}
              accessory={dino.accessory}
              animation="idle"
              size={dinoSize}
              className={styles.dinoPreviewAvatar}
            />
          </div>
          <p className={styles.previewLabel}>Seu Explorador!</p>
        </section>

        {/* Configuration Panel (Right) */}
        <section className={styles.configSection}>
          <h2 className={styles.sectionTitle}>Crie seu Dino</h2>

          {/* Model Selector */}
          <div className={styles.optionGroup}>
            <span className={styles.optionTitle}>🦕 Tipo:</span>
            <div className={styles.buttonsRow}>
              {(['trex', 'triceratops', 'pterodactyl'] as DinoType[]).map((t) => (
                <button
                  key={t}
                  id={`btn-type-${t}`}
                  className={`${styles.choiceBtn} ${dino.type === t ? styles.selected : ''}`}
                  onClick={() => handleTypeChange(t)}
                  onMouseEnter={playHover}
                >
                  {t === 'trex' && 'T-Rex'}
                  {t === 'triceratops' && 'Tricera'}
                  {t === 'pterodactyl' && 'Ptero'}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className={styles.optionGroup}>
            <span className={styles.optionTitle}>🎨 Cor:</span>
            <div className={styles.colorsRow}>
              {(['green', 'pink', 'blue', 'orange'] as DinoColor[]).map((c) => (
                <button
                  key={c}
                  id={`btn-color-${c}`}
                  className={`${styles.colorCircle} ${styles[c]} ${dino.color === c ? styles.selectedColor : ''}`}
                  onClick={() => handleColorChange(c)}
                  onMouseEnter={playHover}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Accessory Selector */}
          <div className={styles.optionGroup}>
            <span className={styles.optionTitle}>🎩 Acessório:</span>
            <div className={styles.buttonsRow}>
              {(['none', 'hat', 'glasses', 'bowtie'] as DinoAccessory[]).map((acc) => (
                <button
                  key={acc}
                  id={`btn-acc-${acc}`}
                  className={`${styles.choiceBtn} ${dino.accessory === acc ? styles.selected : ''}`}
                  onClick={() => handleAccessoryChange(acc)}
                  onMouseEnter={playHover}
                >
                  {acc === 'none' && 'Nenhum'}
                  {acc === 'hat' && 'Chapéu'}
                  {acc === 'glasses' && 'Óculos'}
                  {acc === 'bowtie' && 'Gravata'}
                </button>
              ))}
            </div>
          </div>

          <button
            id="btn-play-game"
            className={styles.btnPlay}
            onClick={handleStartGame}
            onMouseEnter={playHover}
          >
            <Sparkles size={22} />
            <span className={styles.playText}>
              <span className={styles.playTitle}>JOGAR</span>
              <span className={styles.playSub}>Abrir os joguinhos</span>
            </span>
            <Sparkles size={22} />
          </button>
        </section>
      </div>
      </div>
    </div>
  );
};
