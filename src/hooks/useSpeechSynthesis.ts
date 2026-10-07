import { useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';

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

function pickPortugueseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const normalize = (lang: string) => lang.toLowerCase().replace('_', '-');
  const ptBR = voices.filter((voice) => normalize(voice.lang).startsWith('pt-br'));
  const pt = voices.filter((voice) => normalize(voice.lang).startsWith('pt'));
  const pool = ptBR.length ? ptBR : pt;
  if (!pool.length) return undefined;

  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    let value = 0;
    if (normalize(voice.lang).startsWith('pt-br')) value += 40;
    // On-device voices start immediately. Google voices are downloaded and
    // often stay silent or begin a second later.
    if (voice.localService) value += 35;
    if (/luciana|francisca|maria|fernanda|vit[oó]ria|camila|antonio|felipe|joana/.test(name)) value += 20;
    if (/google|wavenet|network/.test(name)) value -= 40;
    if (/compact|espeak/.test(name)) value -= 10;
    return value;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

let generation = 0;
let keepAliveTimer: number | null = null;
const retainedUtterances: SpeechSynthesisUtterance[] = [];

function stopKeepAlive() {
  if (keepAliveTimer !== null) {
    window.clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  if (keepAliveTimer !== null || typeof window === 'undefined') return;
  // Chrome sometimes pauses the engine on its own. Resume only — pausing
  // here is what chops the sentence in the middle.
  keepAliveTimer = window.setInterval(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (synth.paused) synth.resume();
    if (!synth.speaking && !synth.pending) stopKeepAlive();
  }, 4000);
}

export const useSpeechSynthesis = () => {
  const { speechEnabled } = useGame();

  useEffect(() => {
    primeVoices();
    loadVoices();
  }, []);

  const cancelSpeech = useCallback(() => {
    generation += 1;
    stopKeepAlive();
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    // cancel() while the engine is idle makes the next speak() silent on Chrome.
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
    }
  }, []);

  const speak = useCallback((text: string, force = false) => {
    if (!(force || speechEnabled)) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const phrase = text.replace(/\s+/g, ' ').trim();
    if (!phrase) return;

    const synth = window.speechSynthesis;
    const myGen = ++generation;
    const voice = pickPortugueseVoice(loadVoices());

    const createUtterance = () => {
      const utterance = new SpeechSynthesisUtterance(phrase);
      retainedUtterances.push(utterance);
      if (retainedUtterances.length > 8) retainedUtterances.shift();
      utterance.lang = 'pt-BR';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (myGen === generation) stopKeepAlive();
      };
      return utterance;
    };

    const start = (attempt = 0) => {
      if (myGen !== generation) return;
      if (synth.paused) synth.resume();
      const utterance = createUtterance();
      let started = false;
      utterance.onstart = () => {
        started = true;
      };
      synth.speak(utterance);
      startKeepAlive();
      if (attempt >= 1) return;
      // One retry only when Chrome dropped the utterance. If audio already
      // started, a second speak() would cut the sentence off.
      window.setTimeout(() => {
        if (myGen !== generation || started) return;
        if (!synth.speaking && !synth.pending) start(attempt + 1);
      }, 450);
    };

    if (synth.speaking || synth.pending) {
      synth.cancel();
      // Chrome drops speak() issued in the same turn as cancel().
      window.setTimeout(() => start(0), 80);
      return;
    }

    start(0);
  }, [speechEnabled]);

  return {
    speak,
    cancelSpeech,
  };
};
