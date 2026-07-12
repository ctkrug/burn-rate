import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeState,
  decodeState,
  isPresenter,
  buildShareQuery,
} from "../site/state.js";

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

test("decodeState rejects a fractional headcount from a tampered link", () => {
  // validateInputs requires a whole number of people; a decoded link must not
  // slip past that and run a "2.5 people" counter.
  assert.equal(decodeState("headcount=2.5&salary=100000&startedAt=1"), null);
});

test("decodeState accepts a whole-number headcount", () => {
  assert.deepEqual(decodeState("headcount=3&salary=100000&startedAt=5"), {
    headcount: 3,
    salary: 100000,
    startedAt: 5,
  });
});

test("isPresenter detects the present=1 flag", () => {
  assert.equal(isPresenter("present=1"), true);
  assert.equal(isPresenter("headcount=5&present=1"), true);
  assert.equal(isPresenter("headcount=5"), false);
  assert.equal(isPresenter(""), false);
});

test("buildShareQuery encodes state and optional presenter flag", () => {
  const state = { headcount: 10, salary: 120000, startedAt: 1751328000000 };
  const plain = buildShareQuery(state);
  assert.deepEqual(decodeState(plain), state);
  assert.equal(isPresenter(plain), false);

  const shared = buildShareQuery(state, true);
  assert.deepEqual(decodeState(shared), state);
  assert.equal(isPresenter(shared), true);
});
