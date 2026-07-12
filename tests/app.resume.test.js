// Auto-resume path: opening a shared link should stand the counter up already
// running, mid-tick, from the encoded startedAt — without a Start click. The
// URL must be set BEFORE app.js is imported (init() reads location.search once),
// so this lives in its own file (each test file is a separate process).

import { test } from "node:test";
import assert from "node:assert/strict";
import { costPerSecond, formatCurrency } from "../site/calc.js";

function makeEl() {
  const listeners = {};
  return {
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
  };
}

const registry = new Map();
const getEl = (id) => {
  if (!registry.has(id)) registry.set(id, makeEl());
  return registry.get(id);
};
let rafCb = null;
const realNow = Date.now;
// The sharer started the counter 4 seconds before this viewer opened the link.
const START = 1_000_000;
let clock = START + 4000;

global.window = { AudioContext: undefined };
global.document = {
  getElementById: getEl,
  createElement: () => makeEl(),
  addEventListener() {},
};
global.history = { replaceState() {} };
global.location = {
  pathname: "/",
  search: `?headcount=8&salary=150000&startedAt=${START}&present=1`,
  origin: "http://test",
};
global.navigator = { clipboard: { writeText: async () => {} } };
global.localStorage = (() => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: () => {} };
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

await import("../site/app.js");

test("a shared link auto-resumes a running counter mid-tick", () => {
  rafCb && rafCb();
  const rate = costPerSecond(8, 150000);
  const digits = getEl("ticker-digits");
  // 4 seconds were already elapsed when the link opened.
  assert.equal(digits.textContent, formatCurrency(rate * 4));
  // Running controls, not the setup form.
  assert.equal(getEl("setup").hidden, true);
  assert.equal(getEl("pause").hidden, false);
  // Presenter flag in the link is honored.
  assert.equal(getEl("room").classList.contains("is-presenting"), true);
});

test("the resumed counter keeps climbing", () => {
  const before = getEl("ticker-digits").textContent;
  clock += 3000;
  rafCb && rafCb();
  assert.notEqual(getEl("ticker-digits").textContent, before);
  Date.now = realNow;
});
