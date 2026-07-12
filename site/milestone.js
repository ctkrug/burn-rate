// Detects when the running total crosses a fixed-dollar increment (default
// $1,000). The counter jumps by many cents per frame, so a naive equality check
// would miss thresholds; this compares the milestone *index* on either side of a
// tick and reports how many boundaries were passed. Kept pure so both the flash
// and the synth blip can be driven off one well-tested function.

export const MILESTONE_STEP = 1000;

/**
 * Number of `step`-sized thresholds strictly crossed moving from `prevTotal` to
 * `currTotal`. Returns 0 when the total holds, moves backward, or stays within
 * the same band. A single frame can cross several boundaries at a high rate.
 *
 * @param {number} prevTotal
 * @param {number} currTotal
 * @param {number} [step]
 * @returns {number}
 */
export function milestonesCrossed(prevTotal, currTotal, step = MILESTONE_STEP) {
  if (
    !Number.isFinite(prevTotal) ||
    !Number.isFinite(currTotal) ||
    !Number.isFinite(step) ||
    step <= 0 ||
    currTotal <= prevTotal
  ) {
    return 0;
  }
  const prevBand = Math.floor(prevTotal / step);
  const currBand = Math.floor(currTotal / step);
  return Math.max(0, currBand - prevBand);
}
