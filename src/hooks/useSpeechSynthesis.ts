import { useGame } from '../context/GameContext';

let isSpeechUnlocked = false;

// Global listener to unlock Web Speech API on iOS / Android browsers on first user gesture
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const unlock = () => {
    try {
      const u = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(u);
      isSpeechUnlocked = true;
      console.log('Web Speech API successfully unlocked on mobile.');
    } catch (e) {
      console.warn('SpeechSynthesis unlock failed:', e);
    }
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
}

export const useSpeechSynthesis = () => {
  const { speechEnabled } = useGame();

  const speak = (text: string, isAuto = false) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Check if device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // If on mobile and it's an auto-speech (from useEffect), skip if not unlocked yet to avoid freezing Safari queue
    if (isMobile && isAuto && !isSpeechUnlocked) {
      console.log('Skipping auto-speech on mobile before first user interaction.');
      return;
    }

    // Cancel any current narration
    window.speechSynthesis.cancel();

    // Use a small timeout to let the browser process the cancel before speaking, preventing queue lockup
    setTimeout(() => {
      if (!window.speechSynthesis) return;
      
      // Resume in case the engine is stuck in a paused state
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      
      // Attempt to set a friendly Portuguese voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(voice => voice.lang.startsWith('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.pitch = 1.2; // Slightly higher pitch for child-friendly tone
      utterance.rate = 0.95;  // Slightly slower for better comprehension by kids

      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const cancelSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return {
    speak,
    cancelSpeech,
  };
};
