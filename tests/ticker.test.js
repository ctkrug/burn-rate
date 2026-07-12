import { test } from "node:test";
import assert from "node:assert/strict";
import { createTicker } from "../site/ticker.js";

/** A controllable clock so tests advance time deterministically. */
function fakeClock(start = 0) {
  let t = start;
  const now = () => t;
  now.advance = (ms) => (t += ms);
  now.set = (ms) => (t = ms);
  return now;
}

test("total advances with elapsed time at the given rate", () => {
  const clock = fakeClock(1000);
  const ticker = createTicker(clock);
  ticker.start(2); // $2/second
  assert.equal(ticker.total(), 0);
  clock.advance(5000);
  assert.equal(ticker.total(), 10);
  assert.equal(ticker.elapsedSeconds(), 5);
});

test("pause freezes the total; resume continues from banked time", () => {
  const clock = fakeClock();
  const ticker = createTicker(clock);
  ticker.start(1);
  clock.advance(3000);
  ticker.pause();
  const frozen = ticker.total();
  assert.equal(frozen, 3);
  clock.advance(10000); // time passes while paused
  assert.equal(ticker.total(), 3, "paused total does not advance");
  ticker.resume();
  clock.advance(2000);
  assert.equal(ticker.total(), 5, "resumes from 3s, not from zero");
});

test("start with an earlier clock resumes an already-running counter", () => {
  const clock = fakeClock(10000);
  const ticker = createTicker(clock);
  // Shared link says the counter started 4s ago at $3/s.
  ticker.start(3, 6000);
  assert.equal(ticker.total(), 12);
});

test("reset returns to a fresh idle state", () => {
  const clock = fakeClock();
  const ticker = createTicker(clock);
  ticker.start(5);
  clock.advance(1000);
  ticker.reset();
  assert.equal(ticker.total(), 0);
  assert.equal(ticker.isRunning(), false);
  assert.equal(ticker.getRate(), 0);
});

test("pause is a no-op when not running; resume is a no-op with no rate", () => {
  const clock = fakeClock();
  const ticker = createTicker(clock);
  ticker.pause(); // nothing started yet
  assert.equal(ticker.total(), 0);
  ticker.resume(); // no rate set, must not start counting
  clock.advance(1000);
  assert.equal(ticker.isRunning(), false);
  assert.equal(ticker.total(), 0);
});

test("total never goes negative even with a negative rate", () => {
  const clock = fakeClock();
  const ticker = createTicker(clock);
  ticker.start(-5);
  clock.advance(1000);
  assert.equal(ticker.total(), 0);
});

test("a start clock in the future reads $0 until real time catches up", () => {
  // Models a shared link from a sharer whose clock runs ahead of the viewer's:
  // startedAt is in the future, so elapsed is negative and must clamp to 0.
  const clock = fakeClock(1000);
  const ticker = createTicker(clock);
  ticker.start(3, 6000); // started "5s from now"
  assert.equal(ticker.total(), 0, "no negative money");
  assert.equal(ticker.elapsedSeconds() < 0, true, "elapsed is negative pre-catchup");
  clock.advance(9000); // now 4s past the start
  assert.equal(ticker.total(), 12, "counts normally once time passes the start");
});

test("resume after a shared-link start continues from banked elapsed", () => {
  const clock = fakeClock(10000);
  const ticker = createTicker(clock);
  ticker.start(2, 6000); // 4s already elapsed -> $8
  assert.equal(ticker.total(), 8);
  ticker.pause();
  clock.advance(50000);
  ticker.resume();
  clock.advance(1000);
  assert.equal(ticker.total(), 10, "banks the 4s, adds 1s, ignores paused gap");
});
