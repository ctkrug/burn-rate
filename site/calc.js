// Pure calculation helpers for the ticker. No DOM access here so these stay
// trivially unit-testable and reusable from both the app and the tests.

/** Standard full-time work year: 40 hours/week * 52 weeks. */
export const WORK_HOURS_PER_YEAR = 2080;

/**
 * Dollars burned per second by a room of `headcount` people each earning
 * `avgAnnualSalary` per year, assuming a standard work year.
 */
export function costPerSecond(headcount, avgAnnualSalary) {
  if (!Number.isFinite(headcount) || !Number.isFinite(avgAnnualSalary)) {
    return 0;
  }
  if (headcount <= 0 || avgAnnualSalary <= 0) {
    return 0;
  }
  return (headcount * avgAnnualSalary) / WORK_HOURS_PER_YEAR / 3600;
}

/** Total dollars burned after `elapsedSeconds` at the given per-second rate. */
export function totalBurned(perSecondRate, elapsedSeconds) {
  if (!Number.isFinite(perSecondRate) || !Number.isFinite(elapsedSeconds)) {
    return 0;
  }
  return Math.max(0, perSecondRate * elapsedSeconds);
}

/** Formats a dollar amount for display, e.g. "$1,234.56". */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
