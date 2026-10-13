import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export type PlayResult = 'finished' | 'disabled' | 'cancelled';

let generation = 0;
let stopCurrent: (() => void) | null = null;
let waiters: Array<(result: PlayResult) => void> = [];
let sharedAudio: HTMLAudioElement | null = null;
let retryList: string[] | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) sharedAudio = new Audio();
  return sharedAudio;
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

function playClip(id: string, token: number, retryFrom: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = getAudio();
    if (token !== generation || !audio) {
      resolve(false);
      return;
    }

    audio.muted = false;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.src = `/audio/${id}.mp3`;

    let settled = false;
    const finish = (keepGoing: boolean) => {
      if (settled) return;
      settled = true;
      if (stopCurrent === stop) stopCurrent = null;
      resolve(keepGoing);
    };
    const stop = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      finish(false);
    };
    stopCurrent = stop;
    audio.onended = () => finish(token === generation);
    audio.onerror = () => finish(token === generation);
    void audio.play().then(() => {
      retryList = null;
    }).catch((error: unknown) => {
      const blocked = error instanceof DOMException && error.name === 'NotAllowedError';
      if (blocked && token === generation) retryList = retryFrom;
      finish(!blocked && token === generation);
    });
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
      for (let index = 0; index < list.length; index += 1) {
        const keepGoing = await playClip(list[index], token, list.slice(index));
        if (!keepGoing || token !== generation) {
          if (token === generation) settle('finished');
          return;
        }
      }
      if (token === generation) settle('finished');
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
    return () => {
      alive.current = false;
    };
  }, []);

  const playThen = useCallback(
    (id: string, onDone: () => void, minMs = 1100) => {
      const started = performance.now();
      let finished = false;
      const done = () => {
        if (finished || !alive.current) return;
        finished = true;
        onDone();
      };

      void play(id).then((status) => {
        if (!alive.current || finished) return;
        const elapsed = performance.now() - started;
        const wait = status === 'cancelled' ? 600 : Math.max(0, minMs - elapsed);
        window.setTimeout(done, wait);
      });
    },
    [play],
  );

  return { play, cancel, playThen };
}
