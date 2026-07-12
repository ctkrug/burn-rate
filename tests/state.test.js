import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeState, decodeState } from "../site/state.js";

test("encodeState then decodeState round-trips the same values", () => {
  const original = { headcount: 12, salary: 145000, startedAt: 1751328000000 };
  const decoded = decodeState(encodeState(original));
  assert.deepEqual(decoded, original);
});

test("decodeState returns null for missing params", () => {
  assert.equal(decodeState(""), null);
  assert.equal(decodeState("headcount=5"), null);
});

test("decodeState returns null for non-positive or non-numeric values", () => {
  assert.equal(decodeState("headcount=0&salary=100000&startedAt=1"), null);
  assert.equal(decodeState("headcount=5&salary=-1&startedAt=1"), null);
  assert.equal(decodeState("headcount=abc&salary=100000&startedAt=1"), null);
});
