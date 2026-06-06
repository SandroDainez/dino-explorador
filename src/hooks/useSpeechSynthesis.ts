import { useGame } from '../context/GameContext';

let isSpeechUnlocked = false;

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

    // If nothing is currently speaking, speak synchronously to maintain user gesture stack (crucial for iOS Safari)
    if (!window.speechSynthesis.speaking) {
      window.speechSynthesis.speak(utterance);
      if (!isAuto) {
        isSpeechUnlocked = true;
      }
    } else {
      // If already speaking, cancel first and wait a brief moment to avoid WebKit crash/lockup
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (window.speechSynthesis) {
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
          if (!isAuto) {
            isSpeechUnlocked = true;
          }
        }
      }, 30);
    }
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
