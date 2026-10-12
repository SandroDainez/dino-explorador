// Chrome and Safari drop speechSynthesis.speak() when it happens in the same
// turn as cancel(), and cancel() while the engine is idle can mute the next
// line. Replacing the current question used to do exactly that, so some
// phases never spoke. Lines are queued instead, and a cancelled line waits
// before the next one starts.

const CANCEL_GAP_MS = 200;
const SILENT_RETRY_MS = 450;
const STUCK_RETRY_MS = 1100;

type VoiceLike = {
  lang: string;
  name: string;
  localService?: boolean;
};

type UtteranceLike = {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  voice: VoiceLike | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type SynthLike = {
  speaking: boolean;
  pending: boolean;
  paused: boolean;
  getVoices: () => VoiceLike[];
  speak: (utterance: UtteranceLike) => void;
  cancel: () => void;
  resume: () => void;
  pause: () => void;
};

type TimerHandle = ReturnType<typeof setTimeout>;

type SpeechItem = {
  phrase: string;
  gen: number;
};

let generation = 0;
let runId = 0;
let lastCancelAt = 0;
let voiceManifest: Record<string, string> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let queue: SpeechItem[] = [];
let current: (SpeechItem & { run: number; started: boolean; startedAt: number }) | null = null;
let startTimer: TimerHandle | null = null;
let watchTimer: TimerHandle | null = null;
let keepAliveTimer: TimerHandle | null = null;
let gesturePhrase: string | null = null;
let gestureGeneration = -1;
let gestureBound = false;
const retainedUtterances: UtteranceLike[] = [];

function getSynth(): SynthLike | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return window.speechSynthesis as unknown as SynthLike;
}

function clearStartTimer() {
  if (startTimer !== null) {
    window.clearTimeout(startTimer);
    startTimer = null;
  }
}

function clearWatchTimer() {
  if (watchTimer !== null) {
    window.clearTimeout(watchTimer);
    watchTimer = null;
  }
}

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
    const synth = getSynth();
    if (!synth) return;
    if (synth.paused) synth.resume();
    if (!synth.speaking && !synth.pending) stopKeepAlive();
  }, 4000);
}

function pickPortugueseVoice(voices: VoiceLike[]): VoiceLike | undefined {
  const normalize = (lang: string) => lang.toLowerCase().replace('_', '-');
  const ptBR = voices.filter((voice) => normalize(voice.lang).startsWith('pt-br'));
  const pt = voices.filter((voice) => normalize(voice.lang).startsWith('pt'));
  const pool = ptBR.length ? ptBR : pt;
  if (!pool.length) return undefined;

  const score = (voice: VoiceLike) => {
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

function primeVoiceManifest() {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  fetch('/voice/manifest.json')
    .then((response) => (response.ok ? response.json() : {}))
    .then((data) => {
      voiceManifest = data && typeof data === 'object' ? data as Record<string, string> : {};
    })
    .catch(() => {
      voiceManifest = {};
    });
}

primeVoiceManifest();

function clipUrl(file: string): string {
  return file.startsWith('/') ? file : `/voice/${file}`;
}

function clipsFor(phrase: string): string[] | null {
  if (!voiceManifest) return null;
  const full = voiceManifest[phrase];
  if (typeof full === 'string' && full) return [clipUrl(full)];

  const match = phrase.match(/^Pergunta (\d+)\. (.+)$/);
  if (!match) return null;
  const intro = voiceManifest[`Pergunta ${match[1]}.`];
  const body = voiceManifest[match[2]];
  const files = [intro, body].filter((file): file is string => typeof file === 'string' && file.length > 0);
  if (!files.length) return null;
  return files.map(clipUrl);
}

function stopAudio() {
  if (!currentAudio) return;
  const audio = currentAudio;
  currentAudio = null;
  audio.onplaying = null;
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
  audio.src = '';
}

function cancelIfBusy() {
  const synth = getSynth();
  if (!synth) return;
  if (synth.speaking || synth.pending) {
    synth.cancel();
    lastCancelAt = Date.now();
  }
}

function armGesture(phrase: string, gen: number) {
  if (gen !== generation) return;
  gesturePhrase = phrase;
  gestureGeneration = gen;
}

function chooseVoice(attempt: number): VoiceLike | undefined {
  const synth = getSynth();
  if (!synth) return undefined;
  const best = pickPortugueseVoice(synth.getVoices());
  if (!best) return undefined;
  // First try the Portuguese voice. If that never starts, retry with the
  // browser default instead of pinning a silent network voice.
  if (attempt > 0 && best.localService === false) return undefined;
  return best;
}

function createUtterance(phrase: string, attempt: number): UtteranceLike {
  const Utterance = SpeechSynthesisUtterance as unknown as new (text: string) => UtteranceLike;
  const utterance = new Utterance(phrase);
  retainedUtterances.push(utterance);
  if (retainedUtterances.length > 8) retainedUtterances.shift();
  utterance.lang = 'pt-BR';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voice = chooseVoice(attempt);
  if (voice) {
    try {
      utterance.voice = voice;
    } catch {
      // A voice the browser rejects must not skip the line.
    }
  }
  return utterance;
}

function finish(run: number) {
  if (!current || current.run !== run) return;
  current = null;
  stopKeepAlive();
  pump();
}

function markStarted(item: SpeechItem, myRun: number) {
  if (!current || current.run !== myRun) return;
  current.started = true;
  if (gestureGeneration === item.gen && gesturePhrase === item.phrase) gesturePhrase = null;
}

function speakWithSynth(item: SpeechItem, attempt: number, myRun: number) {
  const synth = getSynth();
  if (!synth || item.gen !== generation || !current || current.run !== myRun) return;
  if (synth.paused) synth.resume();

  const utterance = createUtterance(item.phrase, attempt);
  const startedAt = Date.now();

  utterance.onstart = () => {
    markStarted(item, myRun);
  };
  utterance.onend = () => {
    if (!current || current.run !== myRun || !current.started) return;
    finish(myRun);
  };
  utterance.onerror = (event) => {
    if (item.gen !== generation) return;
    if (event.error === 'interrupted' || event.error === 'canceled') return;
    armGesture(item.phrase, item.gen);
  };

  try {
    synth.speak(utterance);
  } catch {
    armGesture(item.phrase, item.gen);
    return;
  }
  startKeepAlive();

  const watch = () => {
    watchTimer = null;
    if (!current || current.run !== myRun || current.started) return;
    const busy = synth.speaking || synth.pending;
    if (!busy) {
      if (attempt < 1) {
        current = null;
        play(item, attempt + 1);
        return;
      }
      armGesture(item.phrase, item.gen);
      finish(myRun);
      return;
    }

    // speaking stayed true without onstart. Do not cancel: cancelling here
    // is what leaves Chrome silent for the rest of the visit. Give a slow
    // voice time to start, then wait for a tap to unlock audio.
    if (Date.now() - startedAt < STUCK_RETRY_MS) {
      watchTimer = window.setTimeout(watch, 250);
      return;
    }

    armGesture(item.phrase, item.gen);
  };

  watchTimer = window.setTimeout(watch, SILENT_RETRY_MS);
}

function playRecorded(urls: string[], item: SpeechItem, myRun: number, attempt: number) {
  let index = 0;
  let fellBack = false;

  const giveUp = () => {
    if (fellBack || item.gen !== generation || !current || current.run !== myRun) return;
    fellBack = true;
    stopAudio();
    if (current.started) {
      finish(myRun);
      return;
    }
    speakWithSynth(item, attempt, myRun);
  };

  const playNext = () => {
    if (item.gen !== generation || !current || current.run !== myRun) return;
    if (index >= urls.length) {
      finish(myRun);
      return;
    }

    let audio: HTMLAudioElement;
    try {
      audio = new Audio(urls[index]);
    } catch {
      giveUp();
      return;
    }
    index += 1;
    currentAudio = audio;
    audio.onplaying = () => markStarted(item, myRun);
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      playNext();
    };
    audio.onerror = () => giveUp();
    audio.play().catch(() => giveUp());
  };

  playNext();
}

function play(item: SpeechItem, attempt: number) {
  const synth = getSynth();
  if (!synth || item.gen !== generation) return;

  const myRun = ++runId;
  clearWatchTimer();
  stopAudio();
  current = { ...item, run: myRun, started: false, startedAt: Date.now() };
  // Keep the line ready for the next tap until audio actually starts.
  // Mobile browsers ignore speak() that was not inside a user gesture.
  armGesture(item.phrase, item.gen);

  const clips = clipsFor(item.phrase);
  if (clips && attempt === 0) {
    playRecorded(clips, item, myRun, attempt);
    return;
  }

  speakWithSynth(item, attempt, myRun);
}

function pump() {
  if (current || startTimer !== null || queue.length === 0) return;

  const wait = Math.max(0, lastCancelAt + CANCEL_GAP_MS - Date.now());
  if (wait > 0) {
    startTimer = window.setTimeout(() => {
      startTimer = null;
      pump();
    }, wait);
    return;
  }

  const next = queue[0];
  if (next.gen !== generation) {
    queue.shift();
    pump();
    return;
  }

  queue.shift();
  play(next, 0);
}

function bindGestureReplay() {
  if (gestureBound || typeof window === 'undefined') return;
  gestureBound = true;
  window.addEventListener(
    'pointerdown',
    () => {
      const synth = getSynth();
      if (!synth) return;
      if (synth.paused) synth.resume();
      if (!gesturePhrase || gestureGeneration !== generation) return;
      if (current?.started) return;

      const busy = synth.speaking || synth.pending;
      const elapsed = current ? Date.now() - current.startedAt : STUCK_RETRY_MS;
      // onstart can lag a slow voice. Cancelling during that lag is what
      // leaves Chrome silent for the rest of the visit.
      const stuck = busy && elapsed >= STUCK_RETRY_MS;
      if (busy && !stuck) return;

      const phrase = gesturePhrase;
      const gen = gestureGeneration;
      gesturePhrase = null;
      clearStartTimer();
      clearWatchTimer();
      stopAudio();
      current = null;
      if (stuck) {
        synth.cancel();
        lastCancelAt = Date.now();
      }
      // Speak inside this tap. iOS only allows that. If cancel() made Chrome
      // drop it, try once more after the gap.
      play({ phrase, gen }, stuck ? 1 : 0);
      if (!stuck) return;
      const retry = window.setTimeout(() => {
        if (startTimer === retry) startTimer = null;
        if (gen !== generation || current?.started) return;
        current = null;
        play({ phrase, gen }, 1);
      }, CANCEL_GAP_MS);
      startTimer = retry;
    },
    true,
  );
}

export function speakPhrase(text: string, interrupt = false) {
  bindGestureReplay();
  const phrase = text.replace(/\s+/g, ' ').trim();
  if (!phrase || !getSynth()) return;

  if (interrupt) {
    generation += 1;
    queue = [];
    current = null;
    gesturePhrase = null;
    clearStartTimer();
    clearWatchTimer();
    stopAudio();
    cancelIfBusy();
  }

  queue.push({ phrase, gen: generation });
  pump();
}

export function cancelPhrase() {
  generation += 1;
  queue = [];
  current = null;
  gesturePhrase = null;
  clearStartTimer();
  clearWatchTimer();
  stopKeepAlive();
  stopAudio();
  cancelIfBusy();
}

export function setVoiceManifestForTests(manifest: Record<string, string> | null) {
  voiceManifest = manifest;
}

export function resetSpeechEngineForTests() {
  cancelPhrase();
  generation = 0;
  lastCancelAt = 0;
  gesturePhrase = null;
  gestureGeneration = -1;
  voiceManifest = null;
  stopKeepAlive();
}
