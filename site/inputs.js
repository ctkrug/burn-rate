// Setup-form logic: parse and validate the headcount / salary fields, offer
// one-click presets, and remember the last-entered values. Pure functions plus a
// thin storage wrapper so validation and persistence are unit-testable without a
// DOM. The app layer only renders the results these functions return.

const LAST_KEY = "burn-rate:last-inputs";

/** One-click quick-fill scenarios for common meeting shapes. */
export const PRESETS = [
  { label: "Standup · 6 @ $130k", headcount: 6, salary: 130000 },
  { label: "Team sync · 10 @ $120k", headcount: 10, salary: 120000 },
  { label: "All-hands · 40 @ $110k", headcount: 40, salary: 110000 },
];

/**
 * Validate the raw form fields.
 * @param {string|number} headcountRaw
 * @param {string|number} salaryRaw
 * @returns {{valid: boolean, headcount: number, salary: number,
 *            errors: {headcount?: string, salary?: string}}}
 */
export function validateInputs(headcountRaw, salaryRaw) {
  const errors = {};

  const headcount = toNumber(headcountRaw);
  if (isBlank(headcountRaw)) {
    errors.headcount = "Enter how many people are in the room.";
  } else if (!Number.isFinite(headcount) || headcount <= 0) {
    errors.headcount = "Headcount must be a positive number.";
  } else if (!Number.isInteger(headcount)) {
    errors.headcount = "Headcount must be a whole number of people.";
  }

  const salary = toNumber(salaryRaw);
  if (isBlank(salaryRaw)) {
    errors.salary = "Enter an average annual salary.";
  } else if (!Number.isFinite(salary) || salary <= 0) {
    errors.salary = "Salary must be a positive dollar amount.";
  }

  return { valid: Object.keys(errors).length === 0, headcount, salary, errors };
}

function isBlank(value) {
  return value === "" || value === null || value === undefined;
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (isBlank(value)) return NaN;
  // Tolerate "$120,000" and "120k"-free numeric strings with commas/spaces.
  const cleaned = String(value).replace(/[$,\s]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

/** Persist the last valid inputs so a reload restores them. */
export function saveLastInputs(storage, { headcount, salary }) {
  if (!storage) return;
  try {
    storage.setItem(LAST_KEY, JSON.stringify({ headcount, salary }));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Restore the last inputs, or null when none/invalid. */
export function loadLastInputs(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { valid, headcount, salary } = validateInputs(
      parsed.headcount,
      parsed.salary,
    );
    return valid ? { headcount, salary } : null;
  } catch {
    return null;
  }
}
