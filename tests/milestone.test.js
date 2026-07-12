import { test } from "node:test";
import assert from "node:assert/strict";
import { milestonesCrossed, MILESTONE_STEP } from "../site/milestone.js";

test("reports one crossing when the total passes a boundary", () => {
  assert.equal(milestonesCrossed(999, 1001), 1);
  assert.equal(milestonesCrossed(1999.5, 2000.01), 1);
});

test("reports zero when staying within the same band", () => {
  assert.equal(milestonesCrossed(1200, 1900), 0);
  assert.equal(milestonesCrossed(0, 999.99), 0);
});

test("counts multiple boundaries cleared in a single tick", () => {
  assert.equal(milestonesCrossed(500, 3500), 3);
});

test("exact boundary values count as crossed once", () => {
  // Moving from just under $1000 to exactly $1000 enters a new band.
  assert.equal(milestonesCrossed(999.99, 1000), 1);
});

test("no crossing for held or backward totals", () => {
  assert.equal(milestonesCrossed(1500, 1500), 0);
  assert.equal(milestonesCrossed(2500, 1200), 0);
});

test("respects a custom step size", () => {
  assert.equal(milestonesCrossed(400, 600, 500), 1);
  assert.equal(milestonesCrossed(400, 450, 500), 0);
});

test("returns zero for invalid input instead of throwing", () => {
  assert.equal(milestonesCrossed(NaN, 1000), 0);
  assert.equal(milestonesCrossed(0, Infinity), 0);
  assert.equal(milestonesCrossed(0, 1000, 0), 0);
});

test("MILESTONE_STEP default is $1000", () => {
  assert.equal(MILESTONE_STEP, 1000);
  assert.equal(milestonesCrossed(0, 1000), 1);
});

test("property: crossings are additive across an intermediate point", () => {
  // For a<=b<=c, splitting the interval at b must count the same crossings —
  // this is what makes a per-frame check equivalent to one big jump.
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 400; i++) {
    const a = rand() * 20000;
    const b = a + rand() * 20000;
    const c = b + rand() * 20000;
    assert.equal(
      milestonesCrossed(a, c),
      milestonesCrossed(a, b) + milestonesCrossed(b, c),
      `additivity failed for ${a},${b},${c}`,
    );
  }
});
