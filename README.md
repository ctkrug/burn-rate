# Burn Rate

A real-time dollar counter for meetings. Enter the headcount and the average salary in the
room, hit start, and screen-share the link — everyone watches the meeting's cost climb live,
several times a second, for as long as it runs.

## Why

Meeting cost calculators exist, but they all do the same thing: you fill in a form and get a
static total *after* the meeting ends. That's a spreadsheet, not a moment. Burn Rate is built
to be watched *during* the meeting — projected on a screen while the number ticks up in front
of the room. The static total never made anyone flinch. A live, climbing number does.

## Planned features

- **Live ticker** — a dollar figure that visibly increases multiple times per second once
  started, driven by headcount × average salary.
- **Shareable link** — all state (headcount, salary, start time) lives in the URL, so pasting
  the link into a screen-share or chat resumes the same live counter for anyone who opens it.
- **Presenter mode** — a distraction-free view with nothing but the giant counter, meant to
  fill a shared screen.
- **Milestone feedback** — the counter flashes and a synthesized sound cue fires as the total
  crosses round-number thresholds.
- **Zero backend** — no server, no database, no accounts. State lives in the URL and browser
  timers; the whole thing is a static site.

## Stack

Vanilla JavaScript, HTML, and CSS — no framework, no build step. Runs as a static site so it
can be hosted anywhere, including as a static subpath deploy. Tests run on Node's built-in
test runner (`node:test`); linting via ESLint.

## Status

Early scaffold. See [`docs/VISION.md`](docs/VISION.md) for the product vision and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## License

MIT — see [`LICENSE`](LICENSE).
