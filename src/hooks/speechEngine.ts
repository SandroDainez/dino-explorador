// Chrome and Safari drop speechSynthesis.speak() when it happens in the same
// turn as cancel(), and cancel() while the engine is idle can mute the next
// line. Phase changes used to do exactly that, so some questions never spoke.

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

let generation = 0;
let lastCancelAt = 0;
let activeStarted = false;
let activeGeneration = -1;
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
      if (activeStarted && activeGeneration === generation) return;
      if (synth.speaking || synth.pending) return;
      const phrase = gesturePhrase;
      const gen = gestureGeneration;
      gesturePhrase = null;
      clearStartTimer();
      launch(phrase, gen, 1);
    },
    true,
  );
}

function createUtterance(phrase: string): UtteranceLike {
  const Utterance = SpeechSynthesisUtterance as unknown as new (text: string) => UtteranceLike;
  const utterance = new Utterance(phrase);
  retainedUtterances.push(utterance);
  if (retainedUtterances.length > 8) retainedUtterances.shift();
  utterance.lang = 'pt-BR';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  const synth = getSynth();
  const voice = synth ? pickPortugueseVoice(synth.getVoices()) : undefined;
  utterance.voice = voice ?? null;
  return utterance;
}

function launch(phrase: string, gen: number, attempt: number) {
  const synth = getSynth();
  if (!synth || gen !== generation) return;

  clearWatchTimer();
  if (synth.paused) synth.resume();

  const utterance = createUtterance(phrase);
  let started = false;
  activeStarted = false;
  activeGeneration = gen;

  utterance.onstart = () => {
    started = true;
    activeStarted = true;
    if (gestureGeneration === gen) gesturePhrase = null;
  };
  utterance.onend = () => {
    if (gen !== generation) return;
    stopKeepAlive();
  };
  utterance.onerror = (event) => {
    if (gen !== generation) return;
    if (event.error === 'not-allowed' || event.error === 'synthesis-failed') {
      armGesture(phrase, gen);
    }
  };

  synth.resume();
  synth.speak(utterance);
  startKeepAlive();

  const startedAt = Date.now();
  const watch = () => {
    watchTimer = null;
    if (gen !== generation || started) return;

    const busy = synth.speaking || synth.pending;
    if (!busy) {
      if (attempt < 1) {
        launch(phrase, gen, attempt + 1);
        return;
      }
      armGesture(phrase, gen);
      return;
    }

    // A slow voice can take a moment to fire onstart. Only treat the engine
    // as stuck when it stays "speaking" without ever starting.
    if (Date.now() - startedAt < STUCK_RETRY_MS) {
      watchTimer = window.setTimeout(watch, 250);
      return;
    }

    if (attempt >= 1) {
      synth.cancel();
      lastCancelAt = Date.now();
      armGesture(phrase, gen);
      return;
    }

    synth.cancel();
    lastCancelAt = Date.now();
    armGesture(phrase, gen);
    clearStartTimer();
    startTimer = window.setTimeout(() => {
      startTimer = null;
      launch(phrase, gen, attempt + 1);
    }, CANCEL_GAP_MS);
  };

  watchTimer = window.setTimeout(watch, SILENT_RETRY_MS);
}

function scheduleLaunch(phrase: string, gen: number) {
  const wait = Math.max(0, lastCancelAt + CANCEL_GAP_MS - Date.now());
  clearStartTimer();
  if (wait === 0) {
    launch(phrase, gen, 0);
    return;
  }
  startTimer = window.setTimeout(() => {
    startTimer = null;
    if (gen !== generation) return;
    launch(phrase, gen, 0);
  }, wait);
}

export function speakPhrase(text: string) {
  bindGestureReplay();
  const phrase = text.replace(/\s+/g, ' ').trim();
  if (!phrase || !getSynth()) return;

  generation += 1;
  const gen = generation;
  activeStarted = false;
  gesturePhrase = null;
  clearStartTimer();
  clearWatchTimer();
  cancelIfBusy();
  scheduleLaunch(phrase, gen);
}

export function cancelPhrase() {
  generation += 1;
  activeStarted = false;
  gesturePhrase = null;
  clearStartTimer();
  clearWatchTimer();
  stopKeepAlive();
  cancelIfBusy();
}

export function resetSpeechEngineForTests() {
  cancelPhrase();
  generation = 0;
  lastCancelAt = 0;
  activeStarted = false;
  activeGeneration = -1;
  gesturePhrase = null;
  gestureGeneration = -1;
  stopKeepAlive();
}
