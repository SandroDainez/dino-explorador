import assert from 'node:assert/strict';
import test from 'node:test';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function installSpeechShim() {
  const calls = [];
  const cancels = [];
  const utterances = [];
  let dropRemaining = 0;
  let stuck = false;
  const listeners = new Map();

  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => [],
    speak(utterance) {
      const dropped = dropRemaining > 0;
      if (dropped) dropRemaining -= 1;
      calls.push({
        text: utterance.text,
        at: Date.now(),
        dropped,
      });
      utterances.push(utterance);
      if (dropped) {
        this.speaking = false;
        this.pending = false;
        utterance.onerror?.({ error: 'not-allowed' });
        return;
      }
      this.speaking = true;
      this.pending = false;
      if (stuck) return;
      queueMicrotask(() => {
        utterance.onstart?.();
      });
    },
    cancel() {
      cancels.push(Date.now());
      this.speaking = false;
      this.pending = false;
    },
    resume() {},
    pause() {},
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
  };

  class Utterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
      this.voice = null;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
    }
  }

  const windowStub = {
    speechSynthesis: synth,
    SpeechSynthesisUtterance: Utterance,
    setTimeout,
    clearTimeout,
    setInterval: (fn, ms) => {
      const id = setInterval(fn, ms);
      id.unref?.();
      return id;
    },
    clearInterval,
    addEventListener(type, fn) {
      const list = listeners.get(type) ?? [];
      list.push(fn);
      listeners.set(type, list);
    },
  };

  globalThis.window = windowStub;
  globalThis.SpeechSynthesisUtterance = Utterance;

  return {
    calls,
    cancels,
    utterances,
    synth,
    setDropRemaining(count) {
      dropRemaining = count;
    },
    setStuck(value) {
      stuck = value;
    },
    pointerDown() {
      for (const fn of listeners.get('pointerdown') ?? []) fn();
    },
  };
}

const shim = installSpeechShim();
const engine = await import('../src/hooks/speechEngine.ts');

test.beforeEach(() => {
  engine.resetSpeechEngineForTests();
  shim.calls.length = 0;
  shim.cancels.length = 0;
  shim.utterances.length = 0;
  shim.synth.speaking = false;
  shim.synth.pending = false;
  shim.setDropRemaining(0);
  shim.setStuck(false);
});

test('speaks immediately when the engine is idle', () => {
  engine.speakPhrase('Pergunta 1. Conte os vaga-lumes.');
  assert.equal(shim.calls.length, 1);
  assert.equal(shim.calls[0].text, 'Pergunta 1. Conte os vaga-lumes.');
  assert.equal(shim.cancels.length, 0);
});

test('does not cancel while the engine is idle', () => {
  engine.cancelPhrase();
  assert.equal(shim.cancels.length, 0);
});

test('queues the next phase instead of cancelling it', async () => {
  engine.speakPhrase('Pergunta 1. Qual é a cor?');
  engine.speakPhrase('Pergunta 2. Qual é a forma?');

  assert.equal(shim.cancels.length, 0);
  assert.equal(shim.calls.filter((call) => call.text.startsWith('Pergunta 2')).length, 0);

  await Promise.resolve();
  shim.utterances[0].onend();
  const next = shim.calls.filter((call) => call.text.startsWith('Pergunta 2'));
  assert.equal(next.length, 1);
  assert.equal(next[0].dropped, false);
});

test('waits after cancel before speaking the next phase', async () => {
  engine.speakPhrase('Pergunta 1. Qual é a cor?');
  engine.cancelPhrase();
  const startedAt = Date.now();
  engine.speakPhrase('Pergunta 2. Qual é a forma?');

  assert.equal(shim.calls.filter((call) => call.text.startsWith('Pergunta 2')).length, 0);
  await delay(260);
  const after = shim.calls.filter((call) => call.text.startsWith('Pergunta 2'));
  assert.equal(after.length, 1);
  assert.ok(after[0].at - startedAt >= 180);
});

test('retries a phase line Chrome dropped', async () => {
  shim.setDropRemaining(1);
  engine.speakPhrase('Pergunta 2. Ache a letra.');

  await delay(80);
  const early = shim.calls.filter((call) => call.text.startsWith('Pergunta 2'));
  assert.equal(early.length, 1);
  assert.equal(early[0].dropped, true);

  await delay(500);
  const retried = shim.calls.filter((call) => call.text.startsWith('Pergunta 2'));
  assert.equal(retried.length, 2);
  assert.equal(retried[1].dropped, false);
});

test('keeps a line recovered by a tap instead of cancelling it', async () => {
  shim.setDropRemaining(1);
  engine.speakPhrase('Pergunta 4. Não corte esta frase.');
  await delay(30);
  shim.pointerDown();

  const recovered = shim.calls.filter((call) => !call.dropped);
  assert.equal(recovered.length, 1);

  await delay(1300);
  assert.equal(shim.cancels.length, 0);
  assert.equal(shim.calls.filter((call) => !call.dropped).length, 1);
});

test('does not cancel a line that is still starting', async () => {
  shim.setStuck(true);
  engine.speakPhrase('Não cancele esta frase.');
  await delay(1500);
  assert.equal(shim.cancels.length, 0);
  assert.equal(shim.calls.length, 1);
});

test('a tap while the voice is still starting does not cancel it', async () => {
  shim.setStuck(true);
  engine.speakPhrase('Pergunta 1. Espere a voz.');
  await delay(40);
  shim.pointerDown();
  assert.equal(shim.cancels.length, 0);
  assert.equal(shim.calls.length, 1);
});

test('the next phase speaks after a stuck line is recovered', async () => {
  shim.setStuck(true);
  engine.speakPhrase('Pergunta 1. Travou.');
  await delay(1200);
  shim.setStuck(false);
  shim.pointerDown();
  await delay(250);
  await Promise.resolve();

  assert.equal(shim.cancels.length, 1);
  assert.equal(shim.calls.length, 2);
  assert.equal(shim.calls[1].dropped, false);
  shim.utterances.at(-1).onend();
  engine.speakPhrase('Pergunta 2. Agora fala.');
  const next = shim.calls.filter((call) => call.text.startsWith('Pergunta 2'));
  assert.equal(next.length, 1);
  assert.equal(next[0].dropped, false);
});

test('says the phase on the next tap when speech never starts', async () => {
  shim.setDropRemaining(5);
  engine.speakPhrase('Pergunta 3. Quem está escondido?');

  await delay(1100);
  assert.ok(shim.calls.every((call) => call.dropped));

  shim.setDropRemaining(0);
  shim.pointerDown();
  const recovered = shim.calls.filter((call) => !call.dropped);
  assert.equal(recovered.length, 1);
  assert.match(recovered[0].text, /Pergunta 3/);
});
