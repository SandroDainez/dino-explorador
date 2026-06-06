import { useGame } from '../context/GameContext';

let sharedAudioContext: AudioContext | null = null;

export const useAudioEngine = () => {
  const { soundEnabled } = useGame();

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      if (!sharedAudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          sharedAudioContext = new AudioContextClass();
        }
      }
      
      // Resume context if suspended by browser autoplay policies
      if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
      }
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
    }
    
    return sharedAudioContext;
  };

  const createOscillator = (
    ctx: AudioContext,
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number
  ) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(gainStart, ctx.currentTime);
    // Linear ramp to 0 to prevent clicking sounds at the end of notes
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    return { osc, gainNode };
  };

  const playClick = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // A fast click sound (pop)
    const duration = 0.08;
    const { osc } = createOscillator(ctx, 'sine', 600, duration, 0.15);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playHover = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Subtly high and short click
    const duration = 0.03;
    const { osc } = createOscillator(ctx, 'sine', 800, duration, 0.05);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playSuccess = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Happy 3-note arpeggio (C5 -> E5 -> G5)
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.12;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; // triangle sounds warmer & cuter
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.15, now + index * 0.1 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + noteDuration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + noteDuration);
    });
  };

  const playError = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Sad sliding tone (sawtooth or triangle sliding down)
    const duration = 0.35;
    const { osc } = createOscillator(ctx, 'triangle', 220, duration, 0.2);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playJump = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Upward slide (boing/jump)
    const duration = 0.25;
    const { osc } = createOscillator(ctx, 'sine', 200, duration, 0.15);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playPop = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Cute bubble pop
    const duration = 0.15;
    const { osc } = createOscillator(ctx, 'sine', 150, duration, 0.2);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playVictory = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Fanfare melody: C5 (0.1s), E5 (0.1s), G5 (0.1s), C6 (0.3s)
    const notes = [
      { freq: 523.25, start: 0.0, dur: 0.1 },
      { freq: 659.25, start: 0.1, dur: 0.1 },
      { freq: 783.99, start: 0.2, dur: 0.1 },
      { freq: 1046.50, start: 0.3, dur: 0.5 },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gainNode.gain.setValueAtTime(0, now + note.start);
      gainNode.gain.linearRampToValueAtTime(0.2, now + note.start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });
  };

  return {
    playClick,
    playHover,
    playSuccess,
    playError,
    playJump,
    playPop,
    playVictory,
  };
};
