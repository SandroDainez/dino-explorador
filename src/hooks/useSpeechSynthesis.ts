import { useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { cancelPhrase, speakPhrase } from './speechEngine';

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesPrimed = false;

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return cachedVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

function primeVoices() {
  if (voicesPrimed || typeof window === 'undefined' || !window.speechSynthesis) return;
  voicesPrimed = true;
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    loadVoices();
  });
}

primeVoices();

export const useSpeechSynthesis = () => {
  const { speechEnabled } = useGame();

  useEffect(() => {
    primeVoices();
    loadVoices();
  }, []);

  const cancelSpeech = useCallback(() => {
    cancelPhrase();
  }, []);

  const speak = useCallback((text: string, force = false) => {
    if (!(force || speechEnabled)) return;
    speakPhrase(text, force);
  }, [speechEnabled]);

  return {
    speak,
    cancelSpeech,
  };
};
