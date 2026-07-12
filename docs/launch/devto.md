---
title: "Burn Rate: a live meeting cost counter you can screen-share"
published: false
tags: javascript, webdev, webaudio, showdev
---

Every meeting cost calculator I have used works the same way. You fill in a form, click a
button, and get a single number after the fact. That number is easy to nod at and forget. I
wanted the opposite: a figure that climbs on screen *while the meeting is happening*, so the
room feels the cost with time still left to end the call early.

So I built [Burn Rate](https://apps.charliekrug.com/burn-rate/). Enter the headcount and average
salary, hit Start, and a dollar counter ticks up several times a second. Screen-share the tab
and everyone watches the same number rise. It is a static page: no server, no accounts, no
build step. Here are the three decisions that made it interesting to write.

## The URL is the entire state store

The counter has to be shareable, and I did not want a backend to make that happen. So the whole
state lives in the query string: `headcount`, `salary`, and an absolute `startedAt` timestamp.

The key detail is `startedAt`. If I had stored "seconds elapsed", a shared link would freeze the
moment it was copied. By storing the absolute start time instead, anyone who opens the link
computes elapsed time as `now - startedAt` and lands mid-tick, on the same total as everyone
else, continuing from the same instant. Paste the link into the meeting chat and the whole room
is looking at one synchronized counter.

I update the URL with `history.replaceState` on every state change so the address bar always
holds a working share link without adding history entries. Encoding and decoding are their own
tested module, and decoding is strict: a fractional headcount, a negative salary, or a garbage
param returns `null` and the app falls back to a fresh setup form rather than starting a broken
counter.

## Keep the logic out of the DOM so you can test it headless

There is no framework here, so it would have been easy to let `app.js` become one long file of
event handlers with the math tangled in. Instead every real decision lives in a DOM-free module:
`calc` (salary to dollars-per-second), `ticker` (a clock-driven stopwatch with an injectable
`now()`), `milestone` (threshold crossings), `state` (URL encode and decode), and `inputs`
(validation and presets). `app.js` is thin glue.

That split let me unit-test the interesting parts with zero browser, and because the ticker
takes an injectable clock, I can fast-forward time in a test without waiting. On top of that,
three suites stand up a tiny fake DOM and drive `app.js` end to end: the Start-to-climbing-number
flow, the pause/resume/reset/presenter state machine, and a shared link auto-resuming mid-tick.
The whole thing runs on Node's built-in test runner, no test framework installed.

## Milestones and sound, without a single audio file

Every time the total crosses a $1,000 boundary, the digits flash and a short cue plays. Two
small problems there.

First, detecting the crossing. The counter can jump many dollars between animation frames, so
checking whether the total equals a multiple of 1,000 would miss most milestones. Instead I
compare the *band index* on each side of a tick (`floor(total / 1000)`) and report how many
boundaries were passed, which also handles a single frame crossing several thresholds at a high
burn rate.

Second, the sound. Rather than ship audio files, every effect is synthesized from WebAudio
oscillators at runtime: a rising sawtooth on Start, a two-tone square blip on each milestone. No
binary assets, and the whole audio module is guarded so it stays silent (and never throws) in a
test environment with no `AudioContext`. The mute state persists in `localStorage`.

## What I would do differently

The salary-to-cost math assumes a flat 2,080-hour work year, which is honest but blunt. A nice
addition would be optional currency and region presets. I would also like a shared server clock
so links stay perfectly in sync even when a viewer's device clock is skewed, though that would
trade away the zero-backend simplicity I like most about it.

Code is on [GitHub](https://github.com/ctkrug/burn-rate) and the live version is at
[apps.charliekrug.com/burn-rate](https://apps.charliekrug.com/burn-rate/). If you try it in your
next standup, tell me what the number did to the meeting.
