// Wires the tested modules (ticker, milestone, audio, inputs, state) to the DOM.
// Deliberately thin: every non-trivial decision lives in a unit-tested module so
// this file is just event handlers, rendering, and the animation loop.

import { costPerSecond, formatCurrency } from "./calc.js";
import { createTicker } from "./ticker.js";
import { milestonesCrossed } from "./milestone.js";
import { createAudio } from "./audio.js";
import {
  validateInputs,
  loadLastInputs,
  saveLastInputs,
  PRESETS,
} from "./inputs.js";
import { decodeState, buildShareQuery, isPresenter } from "./state.js";

const $ = (id) => document.getElementById(id);
const els = {
  room: $("room"),
  setup: $("setup"),
  headcount: $("headcount"),
  salary: $("salary"),
  headcountError: $("headcount-error"),
  salaryError: $("salary-error"),
  presets: $("presets"),
  digits: $("ticker-digits"),
  costPerMin: $("cost-per-min"),
  elapsed: $("elapsed"),
  start: $("start"),
  pause: $("pause"),
  reset: $("reset"),
  copyLink: $("copy-link"),
  present: $("present"),
  mute: $("mute"),
  muteGlyph: $("mute-glyph"),
  exitPresent: $("exit-present"),
  live: $("live"),
};

const ticker = createTicker();
const audio = createAudio();

let current = null; // { headcount, salary, startedAt, rate } while running
let rafId = null;
let lastRenderedTotal = 0;
let lastMilestoneSound = 0;
let lastLiveUpdate = 0;
let presenting = false;
let copyTimer = null;

const MILESTONE_SOUND_MS = 400; // rate-limit stacked milestone blips
const LIVE_INTERVAL_MS = 5000; // throttle the SR live region

/* ---------- Rendering ---------- */

function renderDigits(total) {
  els.digits.textContent = formatCurrency(total);
}

function formatElapsed(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = String(whole % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateReadouts(total, elapsedSeconds) {
  const rate = ticker.getRate();
  els.costPerMin.textContent = formatCurrency(rate * 60);
  els.elapsed.textContent = formatElapsed(elapsedSeconds);
  els.digits.setAttribute("aria-label", `${formatCurrency(total)} burned`);
}

function flashMilestone() {
  els.digits.classList.remove("is-milestone");
  // Force reflow so the animation restarts on back-to-back milestones.
  void els.digits.offsetWidth;
  els.digits.classList.add("is-milestone");
}

/* ---------- The loop ---------- */

function tick() {
  const now = Date.now();
  const total = ticker.total();
  renderDigits(total);

  const crossed = milestonesCrossed(lastRenderedTotal, total);
  if (crossed > 0) {
    flashMilestone();
    if (now - lastMilestoneSound >= MILESTONE_SOUND_MS) {
      audio.play("milestone");
      lastMilestoneSound = now;
    }
  }

  const elapsedSeconds = ticker.elapsedSeconds();
  updateReadouts(total, elapsedSeconds);

  if (now - lastLiveUpdate >= LIVE_INTERVAL_MS) {
    els.live.textContent = `${formatCurrency(total)} spent after ${formatElapsed(
      elapsedSeconds,
    )}`;
    lastLiveUpdate = now;
  }

  lastRenderedTotal = total;
  if (ticker.isRunning()) {
    rafId = requestAnimationFrame(tick);
  }
}

function startLoop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  lastRenderedTotal = ticker.total();
  rafId = requestAnimationFrame(tick);
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/* ---------- URL sync ---------- */

function syncUrl() {
  if (!current) {
    history.replaceState(null, "", location.pathname);
    return;
  }
  const query = buildShareQuery(current, presenting);
  history.replaceState(null, "", `${location.pathname}?${query}`);
}

/* ---------- Validation UI ---------- */

function showErrors(errors) {
  els.headcountError.textContent = errors.headcount || "";
  els.salaryError.textContent = errors.salary || "";
  els.headcount.setAttribute("aria-invalid", errors.headcount ? "true" : "false");
  els.salary.setAttribute("aria-invalid", errors.salary ? "true" : "false");
}

/* ---------- Control state ---------- */

function showRunningControls(running) {
  els.setup.hidden = running;
  els.start.hidden = running;
  els.pause.hidden = !running;
  els.reset.hidden = !running;
  els.copyLink.hidden = !running;
  els.present.hidden = !running;
  els.headcount.disabled = running;
  els.salary.disabled = running;
}

/* ---------- Actions ---------- */

function beginFrom(state, { boot }) {
  current = { ...state, rate: costPerSecond(state.headcount, state.salary) };
  ticker.start(current.rate, state.startedAt);
  lastMilestoneSound = 0;
  lastLiveUpdate = 0;
  showRunningControls(true);
  els.pause.textContent = "Pause";
  if (boot) playBoot();
  syncUrl();
  startLoop();
}

function handleStart() {
  const result = validateInputs(els.headcount.value, els.salary.value);
  showErrors(result.errors);
  if (!result.valid) return;

  saveLastInputs(localStorage, result);
  audio.unlock();
  audio.play("start");
  beginFrom(
    { headcount: result.headcount, salary: result.salary, startedAt: Date.now() },
    { boot: true },
  );
}

function handlePauseResume() {
  if (ticker.isRunning()) {
    ticker.pause();
    stopLoop();
    renderDigits(ticker.total());
    els.pause.textContent = "Resume";
    audio.play("click");
  } else {
    ticker.resume();
    els.pause.textContent = "Pause";
    audio.play("start");
    startLoop();
  }
}

function handleReset() {
  stopLoop();
  ticker.reset();
  current = null;
  lastRenderedTotal = 0;
  renderDigits(0);
  els.costPerMin.textContent = formatCurrency(0);
  els.elapsed.textContent = "0:00";
  els.live.textContent = "";
  showRunningControls(false);
  exitPresenter();
  syncUrl();
  audio.play("click");
  els.headcount.focus();
}

async function handleCopyLink() {
  if (!current) return;
  const url = `${location.origin}${location.pathname}?${buildShareQuery(
    current,
    presenting,
  )}`;
  try {
    await navigator.clipboard.writeText(url);
    confirmCopy("Copied!");
  } catch {
    confirmCopy("Copy failed");
  }
}

function confirmCopy(message) {
  const original = "Copy Link";
  els.copyLink.textContent = message;
  els.copyLink.classList.add("is-confirmed");
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    els.copyLink.innerHTML = original;
    els.copyLink.classList.remove("is-confirmed");
  }, 1600);
}

/* ---------- Presenter mode ---------- */

function enterPresenter() {
  presenting = true;
  els.room.classList.add("is-presenting");
  els.present.setAttribute("aria-pressed", "true");
  els.exitPresent.hidden = false;
  syncUrl();
}

function exitPresenter() {
  if (!presenting) return;
  presenting = false;
  els.room.classList.remove("is-presenting");
  els.present.setAttribute("aria-pressed", "false");
  els.exitPresent.hidden = true;
  syncUrl();
}

function togglePresenter() {
  presenting ? exitPresenter() : enterPresenter();
}

/* ---------- Mute ---------- */

function renderMute() {
  const muted = audio.isMuted();
  els.mute.setAttribute("aria-pressed", muted ? "true" : "false");
  els.mute.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  els.muteGlyph.textContent = muted ? "✗" : "♪";
}

function handleMute() {
  audio.toggleMute();
  renderMute();
}

/* ---------- Boot flicker ---------- */

function playBoot() {
  els.digits.textContent = "$8,888,888.88";
  els.digits.classList.remove("is-booting");
  void els.digits.offsetWidth;
  els.digits.classList.add("is-booting");
  setTimeout(() => {
    els.digits.classList.remove("is-booting");
    if (!ticker.isRunning()) renderDigits(0);
  }, 400);
}

/* ---------- Presets ---------- */

function renderPresets() {
  for (const preset of PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset";
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      els.headcount.value = String(preset.headcount);
      els.salary.value = String(preset.salary);
      showErrors({});
    });
    els.presets.appendChild(button);
  }
}

/* ---------- Init ---------- */

function restoreLastInputs() {
  const last = loadLastInputs(localStorage);
  if (last) {
    els.headcount.value = String(last.headcount);
    els.salary.value = String(last.salary);
  }
}

function resumeFromUrl() {
  const state = decodeState(location.search);
  if (!state) return false;
  els.headcount.value = String(state.headcount);
  els.salary.value = String(state.salary);
  if (isPresenter(location.search)) enterPresenter();
  beginFrom(state, { boot: false });
  return true;
}

function bindEvents() {
  els.setup.addEventListener("submit", (e) => e.preventDefault());
  els.start.addEventListener("click", handleStart);
  els.pause.addEventListener("click", handlePauseResume);
  els.reset.addEventListener("click", handleReset);
  els.copyLink.addEventListener("click", handleCopyLink);
  els.present.addEventListener("click", togglePresenter);
  els.exitPresent.addEventListener("click", exitPresenter);
  els.mute.addEventListener("click", handleMute);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") exitPresenter();
  });
  for (const input of [els.headcount, els.salary]) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleStart();
      }
    });
  }
}

function init() {
  renderMute();
  renderPresets();
  bindEvents();
  if (!resumeFromUrl()) {
    restoreLastInputs();
    playBoot();
  }
}

init();
