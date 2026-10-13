import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export type PlayResult = 'finished' | 'disabled' | 'cancelled';

let generation = 0;
let stopCurrent: (() => void) | null = null;
let waiters: Array<(result: PlayResult) => void> = [];
let sharedAudio: HTMLAudioElement | null = null;
let praiseAudio: HTMLAudioElement | null = null;
let retryList: string[] | null = null;
let narrationLocked = false;

export function isNarrationLocked(): boolean {
  return narrationLocked;
}

function retryBlockedNarration() {
  if (!retryList || stopCurrent) return;
  const list = retryList;
  retryList = null;
  void playNarration(list, true);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', retryBlockedNarration, { capture: true });
}

function settle(result: PlayResult) {
  const pending = waiters;
  waiters = [];
  pending.forEach((waiter) => waiter(result));
}

export function cancelNarration() {
  generation += 1;
  retryList = null;
  const stop = stopCurrent;
  stopCurrent = null;
  if (stop) stop();
  settle('cancelled');
}

function silence(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
}

function playClip(id: string, token: number, retryFrom: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    if (token !== generation || typeof window === 'undefined') {
      resolve(false);
      return;
    }

    silence(sharedAudio);
    const audio = new Audio(`/audio/${id}.mp3`);
    sharedAudio = audio;
    audio.muted = false;

    let settled = false;
    let cap = 0;
    let retried = false;
    const finish = (keepGoing: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(cap);
      if (stopCurrent === stop) stopCurrent = null;
      resolve(keepGoing);
    };
    const stop = () => {
      silence(audio);
      finish(false);
    };
    stopCurrent = stop;
    audio.onended = () => finish(token === generation);
    audio.onerror = () => finish(token === generation);
    cap = window.setTimeout(() => finish(token === generation), 15000);

    const start = () => {
      void audio.play().then(() => {
        retryList = null;
      }).catch((error: unknown) => {
        const name = error instanceof DOMException ? error.name : '';
        if (name === 'AbortError' && !retried && token === generation) {
          retried = true;
          window.setTimeout(start, 60);
          return;
        }
        const blocked = name === 'NotAllowedError';
        if (blocked && token === generation) retryList = retryFrom;
        finish(!blocked && token === generation);
      });
    };
    start();
  });
}

export function playNarration(ids: string | string[], enabled: boolean): Promise<PlayResult> {
  if (!enabled) return Promise.resolve('disabled');

  const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
  if (!list.length) return Promise.resolve('finished');

  cancelNarration();
  const token = generation;

  return new Promise((resolve) => {
    waiters.push(resolve);
    void (async () => {
      try {
        for (let index = 0; index < list.length; index += 1) {
          const keepGoing = await playClip(list[index], token, list.slice(index));
          if (!keepGoing || token !== generation) {
            if (token === generation) settle('finished');
            return;
          }
        }
        if (token === generation) settle('finished');
      } catch {
        if (token === generation) settle('finished');
      }
    })();
  });
}

export const useNarration = () => {
  const { speechEnabled } = useGame();

  const play = useCallback(
    (ids: string | string[], force = false) => playNarration(ids, force || speechEnabled),
    [speechEnabled],
  );

  const cancel = useCallback(() => {
    cancelNarration();
  }, []);

  return { play, cancel };
};

export function useNarrationSequence() {
  const { play, cancel } = useNarration();
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const playThen = useCallback(
    (id: string | string[], onDone: () => void, minMs = 1100, maxMs = 8000) => {
      const started = performance.now();
      let finished = false;
      narrationLocked = true;
      const done = () => {
        if (finished) return;
        finished = true;
        narrationLocked = false;
        if (!alive.current) return;
        onDone();
      };

      const cap = window.setTimeout(done, Math.max(minMs, maxMs));
      void play(id).then((status) => {
        if (!alive.current || finished) return;
        window.clearTimeout(cap);
        const elapsed = performance.now() - started;
        const wait = status === 'cancelled' ? 600 : Math.max(0, minMs - elapsed);
        window.setTimeout(done, wait);
      }).catch(() => {
        if (!alive.current || finished) return;
        window.clearTimeout(cap);
        window.setTimeout(done, 600);
      });
    },
    [play],
  );

  return { play, cancel, playThen };
}

function speakLine(text: string) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const line = new SpeechSynthesisUtterance(text);
  line.lang = 'pt-BR';
  line.rate = 1;
  synth.cancel();
  synth.speak(line);
}

function speakMuitoBem() {
  speakLine('Muito bem!');
}

function playPraiseClip(id: string): Promise<boolean> {
  if (praiseAudio) {
    praiseAudio.onended = null;
    praiseAudio.onerror = null;
    praiseAudio.pause();
  }

  const audio = new Audio(`/audio/${id}.mp3`);
  praiseAudio = audio;
  audio.volume = 1;

  return new Promise((resolve) => {
    let settled = false;
    let heard = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(cap);
      window.clearTimeout(watchdog);
      if (praiseAudio === audio) praiseAudio = null;
      resolve(ok);
    };
    const markHeard = () => {
      heard = true;
      window.clearTimeout(watchdog);
    };
    const cap = window.setTimeout(() => finish(true), 5000);
    const watchdog = window.setTimeout(() => {
      if (!heard) speakMuitoBem();
    }, 400);
    audio.onplaying = markHeard;
    audio.onended = () => finish(true);
    audio.onerror = () => {
      if (!heard) speakMuitoBem();
      finish(false);
    };
    void audio.play().then(markHeard).catch(() => {
      if (!heard) speakMuitoBem();
      finish(false);
    });
  });
}

export function useCorrectPraise() {
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return useCallback((onDone: () => void, extra?: string) => {
    const started = performance.now();
    let finished = false;
    narrationLocked = true;
    cancelNarration();
    window.dispatchEvent(new CustomEvent('dino-praise'));

    const done = () => {
      if (finished) return;
      finished = true;
      narrationLocked = false;
      if (!alive.current) return;
      onDone();
    };

    const cap = window.setTimeout(done, extra ? 14000 : 3200);
    const first = playPraiseClip('contar-1');
    void first.then(async () => {
      if (extra && alive.current) await playPraiseClip(extra);
      const wait = Math.max(0, 1700 - (performance.now() - started));
      window.setTimeout(() => {
        window.clearTimeout(cap);
        done();
      }, wait);
    });
  }, []);
}

const WRONG_HINT = 'Você não quer escolher outra opção?';

function playHintClip(id: string, spoken: string) {
  if (praiseAudio) {
    praiseAudio.onended = null;
    praiseAudio.onerror = null;
    praiseAudio.pause();
  }

  const audio = new Audio(`/audio/${id}.mp3`);
  praiseAudio = audio;
  audio.volume = 1;
  let spoke = false;
  const say = () => {
    if (spoke) return;
    spoke = true;
    speakLine(spoken);
  };
  audio.onplaying = () => {
    spoke = true;
  };
  audio.onerror = say;
  void audio.play().catch(say);
}

export function useWrongHint() {
  return useCallback(() => {
    cancelNarration();
    window.dispatchEvent(new CustomEvent('dino-hint'));
    playHintClip('outra-opcao', WRONG_HINT);
  }, []);
}
