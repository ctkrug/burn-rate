# Backlog

Epics and stories for the build. Every story has 1–3 concrete, verifiable acceptance criteria.
The first story of Epic 1 is the wow moment — it lands before anything optional.

## Epic 1 — Core ticker (the wow moment)

- [x] **1.1 [WOW] Live dollar counter ticks up after Start**
  - Entering headcount = 10 and average salary = $100,000 and clicking Start begins a visibly
    increasing dollar figure, updating at least 4 times per second.
  - The displayed value N seconds after Start matches `costPerSecond(headcount, salary) * N`
    within a small rounding tolerance.
  - Clicking Start with an empty or zero headcount/salary field shows an inline validation
    message instead of silently starting at $0.

- [x] **1.2 Pause / resume / reset controls**
  - Clicking Pause freezes the displayed number and the elapsed-time readout.
  - Clicking Resume continues counting from the paused elapsed time, not from zero.
  - Clicking Reset returns the display to $0.00 and re-enables the headcount/salary inputs.

- [x] **1.3 Design polish — LED/CRT ticker readout**
  - The ticker digits render in the display font (VT323) with the amber glow treatment from
    `docs/DESIGN.md`, not the system UI font.
  - On desktop (1440×900) the ticker panel occupies at least 60% of the viewport height.
  - The boot-up flicker signature detail (`docs/DESIGN.md` §4) plays once on initial page load.

## Epic 2 — Shareable & room-ready

- [x] **2.1 Shareable state via URL**
  - After Start, the URL updates with `headcount`, `salary`, and `startedAt` query params
    without a full page reload.
  - Opening a URL containing valid params in a fresh tab resumes a live, already-ticking
    counter computed from the encoded start time (not restarted from zero).
  - A "Copy Link" control copies the current shareable URL to the clipboard and shows a brief
    visible confirmation.

- [x] **2.2 Presenter mode**
  - Toggling presenter mode hides the setup form and any non-essential chrome, leaving only the
    ticker and minimal controls visible.
  - Presenter mode state persists across a page reload (via URL param or `localStorage`).
  - Pressing Escape, or a visible exit control, returns from presenter mode to the full view.

- [x] **2.3 Design polish — milestone flash and sub-readouts**
  - Crossing each $1,000 increment of the running total triggers a brief flash/pulse on the
    ticker panel using `--accent-support`.
  - A "cost per minute" and "elapsed time" sub-readout are visible near the main counter while
    running.
  - With `prefers-reduced-motion` enabled, the flash/pulse animation is replaced by a plain
    color swap (no shake or scale), while the numeric values still update normally.

## Epic 3 — Trust, accessibility & robustness

- [x] **3.1 Input validation, presets, and persistence**
  - Entering a non-numeric or negative value in headcount or salary shows an inline error and
    disables the Start button.
  - At least two one-click quick-fill presets (e.g. "10 people @ $120k") populate both fields
    correctly when clicked.
  - Reloading the page before clicking Start restores the last-entered headcount/salary values
    from `localStorage`.

- [x] **3.2 Keyboard and screen-reader support**
  - Start, Pause, and Reset are all reachable via Tab and operable via Enter/Space.
  - The counter's live region updates at most once every 5 seconds for assistive tech (not on
    every animation frame), while the visual display keeps updating at full rate.
  - Every icon-only control has an `aria-label` describing its action.

- [x] **3.3 Design polish — synthesized audio and brand pass**
  - A synthesized WebAudio milestone sound plays on each $1,000 crossed when unmuted, and the
    mute toggle's state persists across reloads via `localStorage`.
  - No audio call throws in an environment without `AudioContext` (verified by a test that
    stubs its absence).
  - The favicon and wordmark match `docs/DESIGN.md` (amber-on-black monogram, VT323 wordmark)
    rather than a default icon.
