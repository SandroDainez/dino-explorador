import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import type { DinoType, DinoColor, DinoAccessory } from '../../context/GameContext';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { DinoAvatar } from '../../components/DinoAvatar';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import styles from './Home.module.css';

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

  const introText = "Olá, amiguinho! Vamos criar o seu dinossauro de aventura? Escolha o tipo de dinossauro, a sua cor favorita e um acessório bem legal. Depois, clique no botão verde JOGAR para começar a nossa exploração!";

  useEffect(() => {
    // Narrate introduction when landing page mounts
    const timer = setTimeout(() => {
      speak(introText, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, []);

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

  const [hasInteracted, setHasInteracted] = useState(false);

  const handleFirstInteraction = () => {
    if (hasInteracted) return;
    setHasInteracted(true);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      speak(introText);
    }
  };

  const handleStartGame = () => {
    playSuccess();
    cancelSpeech();
    setCurrentView('map');
  };

  return (
    <div
      className={styles.container}
      onClick={handleFirstInteraction}
      onTouchStart={handleFirstInteraction}
    >
      {/* Background Clouds */}
      <div className={styles.cloud1} />
      <div className={styles.cloud2} />

      {/* Top Bar Settings */}
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
            if (nextState) speak(introText);
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
        <p className={styles.subtitle}>Uma Aventura Educativa Pré-Histórica!</p>
      </header>

      {/* Main Selection Area */}
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
              size={240}
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
        </section>
      </div>

      {/* Start Button */}
      <div className={styles.actionContainer}>
        <button
          id="btn-play-game"
          className={`${styles.btnPlay} animate-pulse-soft`}
          onClick={handleStartGame}
          onMouseEnter={playHover}
        >
          <Sparkles size={28} />
          <span>JOGAR!</span>
          <Sparkles size={28} />
        </button>
      </div>
    </div>
  );
};
