# Architecture

Burn Rate is a **zero-backend static web app**. All logic runs in the browser; the URL is the
only state store. There is no build step — the files in `site/` are served as-is.

## Module map (`site/`)

| File | Responsibility | DOM? | Tested by |
|---|---|---|---|
| `calc.js` | Pure math: `costPerSecond`, `totalBurned`, `formatCurrency` | no | `tests/calc.test.js` |
| `ticker.js` | `createTicker(now)` — clock-driven stopwatch; start/pause/resume/reset against elapsed time | no | `tests/ticker.test.js` |
| `milestone.js` | `milestonesCrossed(prev, curr, step)` — $1,000 boundary detection | no | `tests/milestone.test.js` |
| `audio.js` | `createAudio(deps)` — synthesized WebAudio SFX + persistent mute; guarded when `AudioContext` absent | no | `tests/audio.test.js` |
| `inputs.js` | `validateInputs`, `PRESETS`, `save/loadLastInputs` | no | `tests/inputs.test.js` |
| `state.js` | URL encode/decode, `isPresenter`, `buildShareQuery` | no | `tests/state.test.js` |
| `app.js` | DOM wiring: event handlers + `requestAnimationFrame` render loop | yes | `tests/app.smoke.test.js` |
| `index.html` | Markup: setup form, ticker hero, readouts, controls | — | — |
| `style.css` | Retro-LED theme, states, keyframes, responsive + reduced-motion | — | — |

**Design rule:** every non-trivial decision lives in a DOM-free module so it is unit-testable;
`app.js` stays thin glue. The headless smoke test stands up a minimal fake DOM + controllable
clock to exercise `app.js` without a browser.

## Data flow (the tick)

1. User enters headcount + salary → `validateInputs` gates Start (live + on click).
2. Start → `costPerSecond` gives `$/s` → `ticker.start(rate, startedAt)`; URL updated via
   `history.replaceState` (`buildShareQuery`).
3. `requestAnimationFrame` loop (`tick`): `ticker.total()` → `formatCurrency` → digits;
   `milestonesCrossed` fires the flash + rate-limited synth blip; sub-readouts update; the SR
   live region is throttled to once per 5s.
4. Pause banks elapsed time and stops the loop; Resume continues from banked time.
5. A shared URL (`decodeState(location.search)`) auto-resumes an already-running counter from
   the encoded `startedAt`, so a pasted link opens mid-tick.

## Run & test

- **Serve locally:** `npm start` (→ `scripts/serve.js`, static server on `:8080`).
- **Test:** `npm test` (`node --test tests/`, no network/DOM deps).
- **Lint:** `npm run lint` (ESLint flat config; browser globals scoped to `site/`).

## Servable

Static, self-contained, base-path-relative — all asset links are relative (`style.css`,
`app.js`, `./calc.js`), so it works from the `/burn-rate/` subpath. **Build dir:** `site/`.
**Build command:** none.
