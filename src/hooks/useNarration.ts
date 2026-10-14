import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export type PlayResult = 'finished' | 'disabled' | 'cancelled';

let generation = 0;
let stopCurrent: (() => void) | null = null;
let stopPraisePlay: (() => void) | null = null;
let waiters: Array<(result: PlayResult) => void> = [];
let sharedAudio: HTMLAudioElement | null = null;
let praiseAudio: HTMLAudioElement | null = null;
let narrationLocked = false;

export function isNarrationLocked(): boolean {
  return narrationLocked;
}

function settle(result: PlayResult) {
  const pending = waiters;
  waiters = [];
  pending.forEach((waiter) => waiter(result));
}

function silence(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.onended = null;
  audio.onerror = null;
  audio.onplaying = null;
  audio.pause();
}

function stopPraise() {
  const stop = stopPraisePlay;
  stopPraisePlay = null;
  if (stop) stop();
  silence(praiseAudio);
  praiseAudio = null;
}

export function cancelNarration() {
  generation += 1;
  narrationLocked = false;
  const stop = stopCurrent;
  stopCurrent = null;
  if (stop) stop();
  stopPraise();
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  settle('cancelled');
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/** Call inside a tap so the next recorded line is allowed to play. */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  const audio = new Audio(SILENT_WAV);
  void audio.play().catch(() => {});
}

function playClip(id: string, token: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (token !== generation || typeof window === 'undefined') {
      resolve(false);
      return;
    }

    silence(sharedAudio);
    const audio = new Audio(`/audio/${id}.mp3`);
    sharedAudio = audio;

    let settled = false;
    let cap = 0;
    const finish = (keepGoing: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(cap);
      if (stopCurrent === stop) stopCurrent = null;
      if (!keepGoing) silence(audio);
      resolve(keepGoing && token === generation);
    };
    const stop = () => {
      silence(audio);
      finish(false);
    };
    stopCurrent = stop;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(true);
    cap = window.setTimeout(() => finish(true), 20000);

    void audio.play().catch((error: unknown) => {
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'AbortError' && token === generation) {
        window.setTimeout(() => {
          if (token !== generation || settled) return;
          void audio.play().catch(() => finish(true));
        }, 60);
        return;
      }
      finish(true);
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
      try {
        for (const id of list) {
          const keepGoing = await playClip(id, token);
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

function playPraiseClip(id: string, token: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (token !== generation || typeof window === 'undefined') {
      resolve(false);
      return;
    }

    silence(praiseAudio);
    const audio = new Audio(`/audio/${id}.mp3`);
    praiseAudio = audio;
    audio.volume = 1;

    let settled = false;
    let cap = 0;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(cap);
      if (stopPraisePlay === stop) stopPraisePlay = null;
      if (!ok) silence(audio);
      if (praiseAudio === audio && !ok) praiseAudio = null;
      resolve(ok && token === generation);
    };
    const stop = () => {
      silence(audio);
      finish(false);
    };
    stopPraisePlay = stop;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(true);
    cap = window.setTimeout(() => {
      silence(audio);
      finish(true);
    }, 20000);

    void audio.play().catch(() => finish(true));
  });
}

export function useCorrectPraise() {
  const { speechEnabled } = useGame();
  const speechRef = useRef(speechEnabled);
  const alive = useRef(true);

  useEffect(() => {
    speechRef.current = speechEnabled;
  }, [speechEnabled]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return useCallback((onDone: () => void, clips?: string | string[]) => {
    if (!speechRef.current) {
      if (alive.current) onDone();
      return;
    }
    const list = (clips ? (Array.isArray(clips) ? clips : [clips]) : ['contar-1']).filter(Boolean);
    cancelNarration();
    const token = generation;
    narrationLocked = true;
    window.dispatchEvent(new CustomEvent('dino-praise'));

    let finished = false;
    let safety = 0;
    const finish = (runDone: boolean) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(safety);
      if (token !== generation) return;
      narrationLocked = false;
      stopPraise();
      if (runDone && alive.current) onDone();
    };
    safety = window.setTimeout(() => finish(true), 20000);

    void (async () => {
      for (const id of list) {
        const ok = await playPraiseClip(id, token);
        if (!ok || token !== generation || !alive.current) {
          finish(false);
          return;
        }
      }
      finish(true);
    })();
  }, []);
}

function playHintClip(id: string) {
  silence(praiseAudio);
  const audio = new Audio(`/audio/${id}.mp3`);
  praiseAudio = audio;
  audio.volume = 1;
  audio.onended = () => {
    if (praiseAudio === audio) praiseAudio = null;
  };
  void audio.play().catch(() => {
    if (praiseAudio === audio) praiseAudio = null;
  });
}

export function useWrongHint() {
  const { speechEnabled } = useGame();
  const speechRef = useRef(speechEnabled);

  useEffect(() => {
    speechRef.current = speechEnabled;
  }, [speechEnabled]);

  return useCallback(() => {
    if (speechRef.current) cancelNarration();
    window.dispatchEvent(new CustomEvent('dino-hint'));
    if (speechRef.current) playHintClip('outra-opcao');
  }, []);
}
