import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateInputs,
  loadLastInputs,
  saveLastInputs,
  PRESETS,
} from "../site/inputs.js";

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test("accepts a valid headcount and salary", () => {
  const r = validateInputs("10", "120000");
  assert.equal(r.valid, true);
  assert.equal(r.headcount, 10);
  assert.equal(r.salary, 120000);
  assert.deepEqual(r.errors, {});
});

test("tolerates $ and comma formatting in the salary", () => {
  const r = validateInputs("8", "$145,000");
  assert.equal(r.valid, true);
  assert.equal(r.salary, 145000);
});

test("blank fields produce field-specific errors, not a silent start", () => {
  const r = validateInputs("", "");
  assert.equal(r.valid, false);
  assert.ok(r.errors.headcount);
  assert.ok(r.errors.salary);
});

test("zero and negative values are rejected", () => {
  assert.equal(validateInputs("0", "100000").valid, false);
  assert.equal(validateInputs("10", "-5").valid, false);
});

test("non-numeric values are rejected", () => {
  const r = validateInputs("abc", "lots");
  assert.equal(r.valid, false);
  assert.ok(r.errors.headcount);
  assert.ok(r.errors.salary);
});

test("fractional headcount is rejected as not-a-whole-person", () => {
  const r = validateInputs("2.5", "100000");
  assert.equal(r.valid, false);
  assert.ok(r.errors.headcount);
});

test("every preset validates", () => {
  assert.ok(PRESETS.length >= 2);
  for (const preset of PRESETS) {
    const r = validateInputs(preset.headcount, preset.salary);
    assert.equal(r.valid, true, `preset ${preset.label} should be valid`);
  }
});

test("whitespace-only fields are rejected, not treated as valid", () => {
  const r = validateInputs("   ", "\t");
  assert.equal(r.valid, false);
  assert.ok(r.errors.headcount);
  assert.ok(r.errors.salary);
});

test("unicode digits and emoji are rejected", () => {
  // Arabic-Indic digits and an emoji are not parseable as Number.
  assert.equal(validateInputs("١٠", "120000").valid, false);
  assert.equal(validateInputs("10", "💰").valid, false);
});

test("surrounding whitespace around a real number is tolerated", () => {
  const r = validateInputs("  10  ", "  120000  ");
  assert.equal(r.valid, true);
  assert.equal(r.headcount, 10);
  assert.equal(r.salary, 120000);
});

test("Infinity and huge overflow strings are rejected", () => {
  assert.equal(validateInputs("Infinity", "120000").valid, false);
  assert.equal(validateInputs("10", "1e400").valid, false); // -> Infinity
});

test("save then load round-trips the last inputs", () => {
  const storage = memStorage();
  saveLastInputs(storage, { headcount: 12, salary: 130000 });
  assert.deepEqual(loadLastInputs(storage), { headcount: 12, salary: 130000 });
});

test("load returns null when nothing is stored or data is corrupt", () => {
  assert.equal(loadLastInputs(memStorage()), null);
  assert.equal(loadLastInputs(memStorage({ "burn-rate:last-inputs": "{" })), null);
});

test("load rejects hand-edited storage that fails validation", () => {
  // Someone edits localStorage to junk values; restore must decline, not
  // repopulate the form with a fractional or negative headcount.
  const frac = memStorage({
    "burn-rate:last-inputs": JSON.stringify({ headcount: 2.5, salary: 100000 }),
  });
  assert.equal(loadLastInputs(frac), null);
  const neg = memStorage({
    "burn-rate:last-inputs": JSON.stringify({ headcount: -3, salary: -1 }),
  });
  assert.equal(loadLastInputs(neg), null);
});

test("persistence helpers no-op without storage", () => {
  assert.doesNotThrow(() => saveLastInputs(null, { headcount: 1, salary: 1 }));
  assert.equal(loadLastInputs(null), null);
});
