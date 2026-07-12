import { test } from "node:test";
import assert from "node:assert/strict";
import { createAudio } from "../site/audio.js";

/** Minimal in-memory Storage stub. */
function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

/** A fake AudioContext that records the nodes it is asked to build. */
function fakeAudioContextFactory() {
  const calls = { oscillators: 0, gains: 0 };
  class FakeParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = "running";
      this.destination = {};
    }
    createOscillator() {
      calls.oscillators++;
      return {
        type: "",
        frequency: new FakeParam(),
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      calls.gains++;
      return { gain: new FakeParam(), connect() {} };
    }
  }
  return { FakeAudioContext, calls };
}

test("play schedules a sound when a context is available", () => {
  const { FakeAudioContext, calls } = fakeAudioContextFactory();
  const audio = createAudio({
    AudioContextCtor: FakeAudioContext,
    storage: memStorage(),
  });
  audio.play("start");
  assert.equal(calls.oscillators, 1);
  assert.equal(calls.gains, 1);
});

test("does not throw and plays nothing when AudioContext is absent", () => {
  const audio = createAudio({ AudioContextCtor: null, storage: memStorage() });
  assert.doesNotThrow(() => audio.play("milestone"));
  assert.doesNotThrow(() => audio.unlock());
});

test("muted audio plays nothing", () => {
  const { FakeAudioContext, calls } = fakeAudioContextFactory();
  const audio = createAudio({
    AudioContextCtor: FakeAudioContext,
    storage: memStorage(),
  });
  audio.toggleMute();
  assert.equal(audio.isMuted(), true);
  audio.play("start");
  assert.equal(calls.oscillators, 0);
});

test("mute state is read from and written to storage", () => {
  const storage = memStorage({ "burn-rate:muted": "1" });
  const audio = createAudio({ AudioContextCtor: null, storage });
  assert.equal(audio.isMuted(), true, "restores muted from storage");
  audio.toggleMute();
  assert.equal(storage.getItem("burn-rate:muted"), "0", "persists unmute");
});

test("unknown effect names are ignored", () => {
  const { FakeAudioContext, calls } = fakeAudioContextFactory();
  const audio = createAudio({
    AudioContextCtor: FakeAudioContext,
    storage: memStorage(),
  });
  audio.play("does-not-exist");
  assert.equal(calls.oscillators, 0);
});

test("survives storage access throwing", () => {
  const throwingStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  const audio = createAudio({
    AudioContextCtor: null,
    storage: throwingStorage,
  });
  assert.equal(audio.isMuted(), false);
  assert.doesNotThrow(() => audio.toggleMute());
});
