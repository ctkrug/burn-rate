// Synthesized sound effects for the ticker — all generated from WebAudio
// oscillators, so there are zero binary assets to ship. Every call is guarded:
// in an environment without AudioContext (tests, some embeds) the module is
// inert and never throws. The AudioContext is created lazily on the first user
// gesture (per browser autoplay policy) and the mute state persists to storage.

const MUTE_KEY = "burn-rate:muted";

/** Per-effect synth recipes. Each returns nothing; it just schedules sound. */
const VOICES = {
  // Rising sawtooth "power-on" swell.
  start(ctx, gain) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.19);
  },
  // Two-tone square blip for a crossed $1,000 milestone.
  milestone(ctx, gain) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },
  // Soft low sine click for pause / reset.
  click(ctx, gain) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  },
};

/**
 * @param {object} [deps]
 * @param {typeof AudioContext} [deps.AudioContextCtor] - injectable for tests.
 * @param {Storage} [deps.storage] - injectable for tests.
 */
export function createAudio(deps = {}) {
  const AudioCtor =
    deps.AudioContextCtor !== undefined
      ? deps.AudioContextCtor
      : typeof AudioContext !== "undefined"
        ? AudioContext
        : typeof window !== "undefined"
          ? window.AudioContext || window.webkitAudioContext
          : undefined;
  const storage =
    deps.storage !== undefined
      ? deps.storage
      : typeof localStorage !== "undefined"
        ? localStorage
        : undefined;

  let ctx = null;
  let muted = readMuted();

  function readMuted() {
    try {
      return storage ? storage.getItem(MUTE_KEY) === "1" : false;
    } catch {
      return false;
    }
  }

  function persistMuted() {
    try {
      storage && storage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* storage unavailable — mute still works for this session */
    }
  }

  /** Create (or resume) the AudioContext; returns null when unsupported. */
  function ensureContext() {
    if (!AudioCtor) return null;
    try {
      if (!ctx) ctx = new AudioCtor();
      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume();
      }
      return ctx;
    } catch {
      return null;
    }
  }

  return {
    /** Play a named effect. No-ops silently when muted or unsupported. */
    play(name) {
      if (muted) return;
      const voice = VOICES[name];
      if (!voice) return;
      const active = ensureContext();
      if (!active) return;
      try {
        const gain = active.createGain();
        gain.connect(active.destination);
        voice(active, gain);
      } catch {
        /* audio glitch must never break the counter */
      }
    },
    /** Prime the AudioContext during a user gesture (autoplay policy). */
    unlock() {
      ensureContext();
    },
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      persistMuted();
      return muted;
    },
    setMuted(value) {
      muted = Boolean(value);
      persistMuted();
      return muted;
    },
  };
}
