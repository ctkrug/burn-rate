# Burn Rate

A real-time dollar counter for meetings. Enter the headcount and the average salary in the
room, hit start, and screen-share the link — everyone watches the meeting's cost climb live,
several times a second, for as long as it runs.

## Why

Meeting cost calculators exist, but they all do the same thing: you fill in a form and get a
static total *after* the meeting ends. That's a spreadsheet, not a moment. Burn Rate is built
to be watched *during* the meeting — projected on a screen while the number ticks up in front
of the room. The static total never made anyone flinch. A live, climbing number does.

## Features

- **Live ticker** — a dollar figure that visibly increases multiple times per second once
  started, driven by headcount × average salary over a standard 2,080-hour work year.
- **Pause / resume / reset** — all against elapsed time, so resume continues from where you
  paused rather than restarting at zero.
- **Shareable link** — all state (headcount, salary, start time) lives in the URL, so pasting
  the link into a screen-share or chat resumes the same live, already-ticking counter for
  anyone who opens it. A **Copy Link** button puts it on the clipboard.
- **Presenter mode** — a distraction-free view with nothing but the giant counter, meant to
  fill a shared screen; toggled from the URL so it survives a reload, and exits on Escape.
- **Milestone feedback** — the counter flashes red and a synthesized sound cue fires each time
  the total crosses a $1,000 threshold (with a persistent mute toggle).
- **Quick-fill presets & recall** — one-click meeting shapes, and the last values you entered
  are restored on reload.
- **Zero backend** — no server, no database, no accounts. State lives in the URL and browser
  timers; the whole thing is a static site.

## Stack

Vanilla JavaScript, HTML, and CSS — no framework, no build step. Runs as a static site so it
can be hosted anywhere, including as a static subpath deploy. Tests run on Node's built-in
test runner (`node:test`); linting via ESLint.

## Status

Core feature set is functional end to end: live counter, pause/resume/reset, shareable URL,
presenter mode, milestone feedback, presets, and audio. See
[`docs/VISION.md`](docs/VISION.md) for the product vision,
[`docs/DESIGN.md`](docs/DESIGN.md) for the visual direction,
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map, and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```sh
npm install
npm start   # serves site/ at http://localhost:8080
npm test    # runs the unit tests (node:test)
npm run lint
```

## Project structure

```
site/       static app — index.html, style.css, app.js, and pure modules
            (calc, ticker, milestone, audio, inputs, state)
tests/      node:test unit tests for every module + a headless app smoke test
scripts/    local dev tooling (static file server)
docs/       vision, design direction, architecture, and backlog
```

## License

MIT — see [`LICENSE`](LICENSE).
