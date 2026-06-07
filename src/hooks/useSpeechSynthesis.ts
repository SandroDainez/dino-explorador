import { useGame } from '../context/GameContext';

export const useSpeechSynthesis = () => {
  const { speechEnabled } = useGame();

  const speak = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

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

      utterance.pitch = 1.0; // Keep normal pitch to avoid robotic/metallic effect on mobile
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
