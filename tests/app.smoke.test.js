// Headless smoke test for the DOM wiring. There is no browser in CI, so this
// stands up a minimal fake DOM, imports app.js (which runs init() on load), and
// drives the real Start -> requestAnimationFrame -> render path to prove the wow
// moment — a visibly climbing number — actually works end to end.

import { test } from "node:test";
import assert from "node:assert/strict";
import { costPerSecond, formatCurrency } from "../site/calc.js";

/* ---- A tiny DOM good enough for app.js ---- */

function makeEl() {
  const listeners = {};
  const el = {
    textContent: "",
    innerHTML: "",
    value: "",
    hidden: false,
    disabled: false,
    offsetWidth: 0,
    _attrs: {},
    classList: {
      _set: new Set(),
      add(c) {
        this._set.add(c);
      },
      remove(c) {
        this._set.delete(c);
      },
      contains(c) {
        return this._set.has(c);
      },
    },
    setAttribute(k, v) {
      this._attrs[k] = v;
    },
    getAttribute(k) {
      return this._attrs[k] ?? null;
    },
    addEventListener(type, fn) {
      (listeners[type] ||= []).push(fn);
    },
    appendChild() {},
    focus() {},
    emit(type, event = {}) {
      (listeners[type] || []).forEach((fn) => fn({ preventDefault() {}, ...event }));
    },
  };
  return el;
}

function installDom() {
  const registry = new Map();
  const getEl = (id) => {
    if (!registry.has(id)) registry.set(id, makeEl());
    return registry.get(id);
  };

  let rafCb = null;
  const realNow = Date.now;
  let clock = 1_000_000;

  const doc = {
    getElementById: getEl,
    createElement: () => makeEl(),
    addEventListener() {},
  };

  global.window = { AudioContext: undefined };
  global.document = doc;
  global.history = { replaceState() {} };
  global.location = { pathname: "/", search: "", origin: "http://test" };
  global.navigator = { clipboard: { writeText: async () => {} } };
  global.localStorage = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
    };
  })();
  global.requestAnimationFrame = (cb) => {
    rafCb = cb;
    return 1;
  };
  global.cancelAnimationFrame = () => {
    rafCb = null;
  };
  global.setTimeout = () => 0;
  global.clearTimeout = () => {};
  Date.now = () => clock;

  return {
    getEl,
    flushFrame: () => rafCb && rafCb(),
    advance: (ms) => (clock += ms),
    restore: () => {
      Date.now = realNow;
    },
  };
}

// The DOM must exist before app.js is imported, and ESM caches the module so
// init() runs exactly once — both tests share this single wired DOM.
const dom = installDom();
await import("../site/app.js");

test("Start begins a live, climbing counter matching the computed rate", () => {
  const digits = dom.getEl("ticker-digits");
  dom.getEl("headcount").value = "10";
  dom.getEl("salary").value = "120000";

  dom.getEl("start").emit("click");
  dom.flushFrame();
  const afterStart = digits.textContent;

  dom.advance(2000);
  dom.flushFrame();
  const afterTwoSeconds = digits.textContent;

  const rate = costPerSecond(10, 120000);
  assert.equal(afterTwoSeconds, formatCurrency(rate * 2));
  assert.notEqual(afterStart, afterTwoSeconds, "the number visibly climbs");

  // Controls flipped into the running state.
  assert.equal(dom.getEl("pause").hidden, false);
  assert.equal(dom.getEl("setup").hidden, true);
});

test("Start with a blank field shows an error instead of counting", () => {
  // Return to idle from the previous test, then try to start with blanks.
  dom.getEl("reset").emit("click");
  const digits = dom.getEl("ticker-digits");
  dom.getEl("headcount").value = "";
  dom.getEl("salary").value = "";

  dom.getEl("start").emit("click");
  dom.flushFrame();

  assert.ok(dom.getEl("headcount-error").textContent.length > 0);
  assert.equal(dom.getEl("setup").hidden, false, "did not start");
  assert.equal(digits.textContent, "$0.00");

  dom.restore();
});
