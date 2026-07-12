import { test } from "node:test";
import assert from "node:assert/strict";
import { costPerSecond, totalBurned, formatCurrency } from "../site/calc.js";

test("costPerSecond computes dollars/second from headcount and salary", () => {
  // 1 person at $2,080/yr and 2080 work-hours/yr is exactly $1/hr = 1/3600 $/s.
  const rate = costPerSecond(1, 2080);
  assert.ok(Math.abs(rate - 1 / 3600) < 1e-9);
});

test("costPerSecond scales linearly with headcount", () => {
  const one = costPerSecond(1, 120000);
  const ten = costPerSecond(10, 120000);
  assert.ok(Math.abs(ten - one * 10) < 1e-9);
});

test("costPerSecond returns 0 for non-positive or invalid input", () => {
  assert.equal(costPerSecond(0, 100000), 0);
  assert.equal(costPerSecond(10, -1), 0);
  assert.equal(costPerSecond(NaN, 100000), 0);
  assert.equal(costPerSecond(10, undefined), 0);
});

test("totalBurned multiplies rate by elapsed seconds", () => {
  assert.equal(totalBurned(2, 10), 20);
  assert.equal(totalBurned(2, 0), 0);
});

test("totalBurned never goes negative", () => {
  assert.equal(totalBurned(-5, 10), 0);
});

test("formatCurrency renders USD with two decimal places", () => {
  assert.equal(formatCurrency(1234.5), "$1,234.50");
  assert.equal(formatCurrency(0), "$0.00");
  assert.equal(formatCurrency(NaN), "$0.00");
});

test("costPerSecond returns 0 for non-finite Infinity inputs", () => {
  assert.equal(costPerSecond(Infinity, 100000), 0);
  assert.equal(costPerSecond(10, Infinity), 0);
  assert.equal(costPerSecond(-Infinity, 100000), 0);
});

test("costPerSecond stays finite for huge but valid inputs", () => {
  const rate = costPerSecond(1e6, 1e9);
  assert.ok(Number.isFinite(rate) && rate > 0);
});

test("totalBurned returns 0 for non-finite rate or elapsed", () => {
  assert.equal(totalBurned(Infinity, 10), 0);
  assert.equal(totalBurned(2, Infinity), 0);
  assert.equal(totalBurned(NaN, 10), 0);
  assert.equal(totalBurned(2, NaN), 0);
});

test("formatCurrency coerces Infinity to $0.00 rather than '$∞'", () => {
  assert.equal(formatCurrency(Infinity), "$0.00");
  assert.equal(formatCurrency(-Infinity), "$0.00");
});
