# Vision

## The problem

Meetings cost money — real, calculable money in salaries — and almost nobody in the room feels
that cost while it's happening. Meeting-cost calculators exist, but they're all
after-the-fact: fill in a form, get a static total once the meeting is over. A number you read
in a spreadsheet on Friday doesn't change how a meeting runs on Tuesday.

## Who it's for

Anyone who runs, attends, or wants to needle their way out of meetings that run long: team
leads padding an agenda, engineers tired of status-update theater, anyone who wants a funny-but-
pointed prop to screen-share at the start of a call. It's a joke with real math behind it.

## The core idea

Enter the headcount and the average annual salary of the people in the room, hit start, and
screen-share the tab. A dollar figure — driven by headcount × average salary, converted to a
per-second burn rate — ticks upward multiple times a second for the whole room to watch. All
state (headcount, salary, start time) lives in the URL, so the link itself is the shareable
artifact: paste it in the meeting invite or the screen-share chat and anyone who opens it sees
the same counter, already running, continuing from the same start time.

## Key design decisions

- **Zero backend.** No server, no database, no accounts. The URL is the state store; timers and
  `requestAnimationFrame` (or `setInterval`) drive the tick. This keeps hosting trivial (a
  static site) and means the tool works the instant the link opens — no sign-in wall between
  "someone pastes a link" and "the room sees a number."
- **The tick is the product.** A static total was already available from a dozen other
  calculators; the wow moment is specifically a *live, visibly climbing* number — several
  updates per second, felt as motion, not just as a final figure. Every other feature (shareable
  URL, presenter mode, milestone flashes) exists to make that live number better to watch, not
  to replace it.
- **Screen-share-first design.** The UI is built to be projected: a single giant readout that
  fills the frame, a presenter mode that strips away setup chrome, and a retro LED-board
  aesthetic (see `docs/DESIGN.md`) that reads clearly from across a room, not just up close on
  a laptop.
- **Honest math, not a gimmick.** The per-second rate is a straightforward conversion of annual
  salary to a standard work-year (2080 hours), multiplied by headcount. No invented multipliers
  or fake "meeting tax" — the number is defensible if someone in the room asks "wait, is that
  actually right?"

## What "v1 done" looks like

- Entering a headcount and average salary and hitting Start produces a counter that visibly
  ticks up multiple times per second, matching the computed per-second rate.
- The running counter's state (headcount, salary, start time) is encoded in the URL; opening
  that URL in a new tab resumes the same live count rather than restarting it.
- Pause, resume, and reset all work correctly against elapsed time, not wall-clock drift.
- A presenter mode hides all non-essential chrome so the counter can fill a shared screen.
- The page follows `docs/DESIGN.md`'s retro-LED direction end to end: typography, tokens,
  milestone feedback, and synthesized (not file-based) sound, with a persistent mute toggle.
- The whole thing ships as a static site with no server dependency, deployable to a subpath.
