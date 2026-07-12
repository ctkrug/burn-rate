# Design direction

## 1. Aesthetic direction

**Retro LED jackpot board.** Burn Rate looks like a casino jackpot counter or an airport
departure board bolted to the wall of a near-black room: warm amber seven-segment digits glow
against a dark panel, ticking upward with a faint scanline shimmer. It is not a SaaS dashboard
— it is an instrument built to be stared at, projected, and screen-shared while a room watches
its own meeting's cost climb in real time.

*Portfolio variety check:* the last several ships lean heavily blueprint/technical (Reflow,
Latency Ladder, Recon, Chronofuzz, Redline, Porthole, Rigfit, Skew) or paper-and-ink/editorial
(Sestet, Setaside, Docket Interest, Sheaf, Skein). Retro LED/CRT has not appeared recently —
distinct direction and distinct amber-on-black palette family.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0d` | page background (near-black, faint blue undertone) |
| `--surface-1` | `#141419` | panel behind the ticker / form |
| `--surface-2` | `#1c1c22` | raised chrome — buttons, input fields |
| `--text` | `#f5ede0` | primary text (warm off-white, not pure #fff) |
| `--text-muted` | `#8a8a94` | secondary labels, helper text |
| `--accent` | `#ffb000` | the LED amber — digits, focus rings, primary buttons |
| `--accent-support` | `#ff3b30` | milestone flash / danger (crossing a $1,000 threshold) |
| `--success` | `#3ddc84` | copy-link confirmation, valid input |

**Type pairing:** display font **[VT323](https://fonts.google.com/specimen/VT323)** (Google
Fonts) for the giant ticker digits and the wordmark — a genuine pixel/LED CRT face. UI font
**[Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)** for labels, buttons, and
form text. Both load with system-monospace / system-sans fallbacks.

**Spacing:** 8px base scale — 8 / 16 / 24 / 32 / 48 / 64.

**Corner radius:** 4px — sharp and instrument-like, not soft/glassy.

**Shadow / glow:** no drop shadows. Digits get a layered amber text-glow
(`0 0 8px rgba(255,176,0,.65), 0 0 28px rgba(255,176,0,.35)`); panels get a 1px inset border in
`--surface-2` rather than a shadow, keeping the flat-panel CRT read.

**Motion:** UI transitions 150ms ease-out. Milestone flash pulse 90ms in, 250ms decay.

## 3. Layout intent

The hero is the ticker itself: a full-width LED-style dollar readout that owns roughly 65–70%
of the viewport height on desktop (1440×900), centered in the dark room with the setup form as
a slim panel above it before Start, and a compact stats/legal strip below (cost/min, elapsed
time, Copy Link). Once running, the form collapses so the digits dominate even further —
that's the point: this screen gets projected.

At phone width (390×844) the ticker keeps the top ~55–60% of the viewport with digits scaled
to fill the width; the form and controls stack full-width below with 44px+ touch targets. No
dead margins on either breakpoint — the panel background (subtle vignette + scanline texture)
fills the full canvas even where digits don't.

## 4. Signature detail

A **boot-up flicker**: on load, before any numbers are entered, the display shows
`$8,888,888.88` for ~400ms with a CRT power-on flicker (opacity/brightness jitter), then snaps
to `$0.00` — like switching on an old sign. It reinforces "this is a real instrument," ties
directly to the product (segments literally used by the counter), and costs nothing beyond a
CSS keyframe + timeout, no binary assets.

## 5. Juice plan (playful toy, not a game — scoped feedback only)

- **Milestone flash:** every time the running total crosses a $1,000 increment, the digit
  panel pulses `--accent-support` red for ~250ms and scales up 2% then back (90ms in).
- **Start "power-on":** hitting Start triggers the boot-flicker treatment on the digits before
  they begin counting from the real value, plus a synth swell.
- **Synth SFX (WebAudio oscillators, no audio files):**
  - `start` — a short rising sawtooth "power-on" swell (~180ms).
  - `milestone` — a two-tone synth blip (square wave, ~90ms) on each $1,000 crossed, rate-
    limited to at most once per 400ms so back-to-back milestones don't stack.
  - `pause` / `reset` — a soft low click (~60ms sine).
  - No sound plays on every tick — only Start, milestone, pause, and reset get audio, since
    the counter itself updates many times a second.
- **Mute toggle:** persists to `localStorage`; `AudioContext` is created lazily on the first
  user gesture (Start click) and every audio call is guarded so environments without
  `AudioContext` (tests, some embeds) never throw.
- Respect `prefers-reduced-motion`: boot flicker and milestone scale/flash drop to a plain
  opacity/color swap; ticking numbers still update normally.
