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
    if (/neural|natural|premium|enhanced|wavenet|google/.test(name)) value += 25;
    if (/luciana|francisca|maria|fernanda|vit[oó]ria|camila|antonio/.test(name)) value += 12;
    if (/compact|espeak/.test(name)) value -= 15;
    return value;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

function splitForSpeech(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  // Ellipsis is a pause ("1... 2..."), not three sentence endings.
  const protectedText = normalized.replace(/\.{2,}/g, '…');
  const sentences = protectedText
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.replace(/…/g, '...').trim())
    .filter((part) => /[\p{L}\p{N}]/u.test(part));

  const chunks: string[] = [];
  const source = sentences.length ? sentences : [normalized];

  for (const sentence of source) {
    if (sentence.length <= 170) {
      chunks.push(sentence);
      continue;
    }

    const pieces = sentence.split(/,\s+/);
    let buffer = '';
    for (const piece of pieces) {
      const next = buffer ? `${buffer}, ${piece}` : piece;
      if (next.length > 170 && buffer) {
        chunks.push(buffer);
        buffer = piece;
      } else {
        buffer = next;
      }
    }
    if (buffer) chunks.push(buffer);
  }

  return chunks;
}

let generation = 0;
let keepAliveTimer: number | null = null;

function stopKeepAlive() {
  if (keepAliveTimer !== null) {
    window.clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  if (keepAliveTimer !== null || typeof window === 'undefined') return;
  // Chrome pauses the speech engine on longer narrations. Resuming keeps
  // the queue alive without the pause/resume cycle that clips words.
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback((text: string, force = false) => {
    if (!(force || speechEnabled)) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    const chunks = splitForSpeech(text);
    if (!chunks.length) return;

    const myGen = ++generation;
    const voice = pickPortugueseVoice(loadVoices());
    const held: SpeechSynthesisUtterance[] = [];
    let index = 0;

    const pump = () => {
      if (myGen !== generation) return;
      if (index >= chunks.length) {
        stopKeepAlive();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      held.push(utterance);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (myGen !== generation) return;
        index += 1;
        window.setTimeout(pump, 80);
      };

      utterance.onerror = (event) => {
        if (myGen !== generation) return;
        if (event.error === 'interrupted' || event.error === 'canceled') return;
        index += 1;
        window.setTimeout(pump, 40);
      };

      if (synth.paused) synth.resume();
      synth.speak(utterance);
      startKeepAlive();
    };

    const wasBusy = synth.speaking || synth.pending;
    if (wasBusy) synth.cancel();

    if (wasBusy) {
      // Chrome drops speak() issued in the same turn as cancel().
      window.setTimeout(() => {
        if (myGen !== generation) return;
        pump();
      }, 60);
      return;
    }

    // First narration must start inside the user gesture (iOS/Safari).
    pump();
  }, [speechEnabled]);

  return {
    speak,
    cancelSpeech,
  };
};
