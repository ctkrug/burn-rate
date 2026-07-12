// State-machine coverage for the DOM wiring: drives the running-counter
// lifecycle (start -> pause -> resume -> reset), presenter mode, mute, copy,
// and milestone flash through a controllable fake DOM + clock. Node runs each
// test file in its own process, so app.js's one-time init() here is isolated
// from the other smoke files and starts from a blank URL (fresh idle).

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
    emit(type, event = {}) {
      (listeners[type] || []).forEach((fn) =>
        fn({ preventDefault() {}, ...event }),
      );
    },
  };
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
  const timers = [];
  const docListeners = {};
  const urls = [];
  const clipboard = { written: [] };

  global.window = { AudioContext: undefined };
  global.document = {
    getElementById: getEl,
    createElement: () => makeEl(),
    addEventListener: (type, fn) => (docListeners[type] ||= []).push(fn),
  };
  global.history = {
    replaceState(_s, _t, url) {
      urls.push(url);
    },
  };
  global.location = { pathname: "/", search: "", origin: "http://test" };
  global.navigator = {
    clipboard: { writeText: async (t) => clipboard.written.push(t) },
  };
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
  global.setTimeout = (fn) => {
    timers.push(fn);
    return timers.length;
  };
  global.clearTimeout = () => {};
  Date.now = () => clock;

  return {
    getEl,
    urls,
    clipboard,
    docListeners,
    flushFrame: () => rafCb && rafCb(),
    flushTimers: () => {
      const pending = timers.splice(0);
      pending.forEach((fn) => fn());
    },
    emitKey: (key) =>
      (docListeners.keydown || []).forEach((fn) => fn({ key })),
    advance: (ms) => (clock += ms),
    lastUrl: () => urls[urls.length - 1],
    restore: () => {
      Date.now = realNow;
    },
  };
}

const dom = installDom();
await import("../site/app.js");

function startRunning(headcount = "10", salary = "120000") {
  dom.getEl("headcount").value = headcount;
  dom.getEl("salary").value = salary;
  dom.getEl("start").emit("click");
  dom.flushFrame();
}

test("pause freezes the total, resume continues from banked time", () => {
  startRunning();
  dom.advance(2000);
  dom.flushFrame();
  const rate = costPerSecond(10, 120000);
  const atPause = dom.getEl("ticker-digits").textContent;
  assert.equal(atPause, formatCurrency(rate * 2));

  dom.getEl("pause").emit("click"); // pause
  assert.equal(dom.getEl("pause").textContent, "Resume");
  dom.advance(10000); // time passes while paused
  assert.equal(
    dom.getEl("ticker-digits").textContent,
    atPause,
    "paused total does not advance",
  );

  dom.getEl("pause").emit("click"); // resume
  assert.equal(dom.getEl("pause").textContent, "Pause");
  dom.advance(1000);
  dom.flushFrame();
  assert.equal(
    dom.getEl("ticker-digits").textContent,
    formatCurrency(rate * 3),
    "resumes from 2s, not from zero",
  );
});

test("reset returns to idle and clears the URL", () => {
  dom.getEl("reset").emit("click");
  assert.equal(dom.getEl("ticker-digits").textContent, "$0.00");
  assert.equal(dom.getEl("elapsed").textContent, "0:00");
  assert.equal(dom.getEl("setup").hidden, false, "setup re-shown");
  assert.equal(dom.getEl("pause").hidden, true, "pause hidden again");
  assert.equal(dom.lastUrl(), "/", "query stripped on reset");
});

test("presenter mode toggles the room class, URL flag, and Escape exits", () => {
  startRunning();
  dom.getEl("present").emit("click");
  assert.equal(dom.getEl("room").classList.contains("is-presenting"), true);
  assert.equal(dom.getEl("present").getAttribute("aria-pressed"), "true");
  assert.equal(dom.getEl("exit-present").hidden, false);
  assert.ok(dom.lastUrl().includes("present=1"), "presenter flag in URL");

  dom.emitKey("Escape");
  assert.equal(dom.getEl("room").classList.contains("is-presenting"), false);
  assert.equal(dom.getEl("exit-present").hidden, true);
  assert.ok(!dom.lastUrl().includes("present=1"), "flag cleared on exit");
  dom.getEl("reset").emit("click");
});

test("mute toggle flips the glyph, aria state, and persists to storage", () => {
  dom.getEl("mute").emit("click");
  assert.equal(dom.getEl("mute-glyph").textContent, "✗");
  assert.equal(dom.getEl("mute").getAttribute("aria-pressed"), "true");
  assert.equal(global.localStorage.getItem("burn-rate:muted"), "1");

  dom.getEl("mute").emit("click");
  assert.equal(dom.getEl("mute-glyph").textContent, "♪");
  assert.equal(dom.getEl("mute").getAttribute("aria-pressed"), "false");
  assert.equal(global.localStorage.getItem("burn-rate:muted"), "0");
});

test("copy link puts the shareable URL on the clipboard", async () => {
  startRunning("10", "120000");
  dom.getEl("copy-link").emit("click");
  await Promise.resolve(); // let the async clipboard write settle
  const url = dom.clipboard.written.at(-1);
  assert.ok(url.startsWith("http://test/?"), "absolute share URL");
  assert.ok(url.includes("headcount=10") && url.includes("salary=120000"));
  dom.getEl("reset").emit("click");
});

test("crossing a $1,000 milestone flashes the digits, then reverts", () => {
  // High rate so a single second clears a $1,000 band.
  startRunning("100000", "100000");
  dom.advance(1000);
  dom.flushFrame();
  const digits = dom.getEl("ticker-digits");
  assert.equal(digits.classList.contains("is-milestone"), true, "flashed");
  dom.flushTimers(); // fire the flash-clear timeout
  assert.equal(
    digits.classList.contains("is-milestone"),
    false,
    "reverts so reduced-motion returns to amber",
  );
  dom.getEl("reset").emit("click");
});

test("the running total is mirrored into the tab title and restored on reset", () => {
  startRunning("10", "120000");
  dom.advance(3000);
  dom.flushFrame();
  const rate = costPerSecond(10, 120000);
  assert.equal(document.title, `${formatCurrency(rate * 3)} · Burn Rate`);

  dom.getEl("reset").emit("click");
  assert.ok(document.title.startsWith("Burn Rate"), "base title restored");
});

test("pressing Enter in a field starts the counter (keyboard path)", () => {
  const headcount = dom.getEl("headcount");
  headcount.value = "10";
  dom.getEl("salary").value = "120000";
  headcount.emit("keydown", { key: "Enter" });
  dom.flushFrame();
  assert.equal(dom.getEl("setup").hidden, true, "started without a mouse");
  assert.equal(dom.getEl("pause").hidden, false);
  dom.getEl("reset").emit("click");
});

test("dom flows restore", () => {
  dom.restore();
});
