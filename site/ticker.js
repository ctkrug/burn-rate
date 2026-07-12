// A clock-driven stopwatch for the burn counter. It keeps its own notion of
// elapsed time so pause/resume/reset operate against *elapsed* time rather than
// wall-clock drift, and so a shared link can resume an already-running counter
// from an absolute start timestamp. The clock is injectable (defaults to
// Date.now) which keeps the whole state machine unit-testable without real time.

/**
 * @param {() => number} now - returns the current time in ms (injectable).
 * @returns a ticker whose total() is `rate * elapsedSeconds`.
 */
export function createTicker(now = () => Date.now()) {
  let rate = 0; // dollars per second
  let running = false;
  let segmentStart = 0; // clock value when the current running segment began
  let bankedMs = 0; // elapsed time accumulated from previous segments

  function elapsedMs() {
    return running ? bankedMs + (now() - segmentStart) : bankedMs;
  }

  return {
    /**
     * Begin counting at `perSecondRate`. Pass an earlier `startClock` (e.g. a
     * startedAt decoded from a shared URL) to resume an already-running counter.
     */
    start(perSecondRate, startClock = now()) {
      rate = perSecondRate;
      running = true;
      segmentStart = startClock;
      bankedMs = 0;
    },
    /** Freeze elapsed time; total() stops advancing until resume(). */
    pause() {
      if (!running) return;
      bankedMs += now() - segmentStart;
      running = false;
    },
    /** Continue from the banked elapsed time, not from zero. */
    resume() {
      if (running || rate === 0) return;
      segmentStart = now();
      running = true;
    },
    /** Return to a fresh idle state. */
    reset() {
      rate = 0;
      running = false;
      segmentStart = 0;
      bankedMs = 0;
    },
    isRunning() {
      return running;
    },
    getRate() {
      return rate;
    },
    elapsedSeconds() {
      return elapsedMs() / 1000;
    },
    /** Dollars burned so far, never negative. */
    total() {
      return Math.max(0, (rate * elapsedMs()) / 1000);
    },
  };
}
