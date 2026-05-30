// Generative ambient music engine (Web Audio). Each "track" is an algorithm that
// produces continuous relaxing sound until stopped — original, no sampled assets.

let actx = null, master = null, analyser = null;
let currentStop = null, currentId = null;

function ensure() {
  if (actx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  actx = new AC();
  master = actx.createGain();
  master.gain.value = 0.5;
  analyser = actx.createAnalyser();
  analyser.fftSize = 256;
  master.connect(analyser);
  analyser.connect(actx.destination);
}

function noiseBuffer(ac, seconds = 3) {
  const len = Math.floor(ac.sampleRate * seconds);
  const b = ac.createBuffer(1, len, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function makeReverb(ac, seconds = 3, decay = 2.4) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  const cv = ac.createConvolver(); cv.buffer = buf; return cv;
}
const fadeOut = (ac, gain, t = 1) => {
  gain.gain.cancelScheduledValues(ac.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + t);
};

/* ---------- Builders ---------- */
function buildPad(ac, out, { chords, type = 'triangle', cut = 1500, gain = 0.16, rate = 9 }) {
  const g = ac.createGain(); g.gain.value = 0.0001; g.connect(out);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 2.5);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.connect(g);
  const lfo = ac.createOscillator(); lfo.frequency.value = 0.05;
  const lfoG = ac.createGain(); lfoG.gain.value = cut * 0.4; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
  const voices = chords[0].map((f) => {
    const o1 = ac.createOscillator(); o1.type = type; o1.frequency.value = f;
    const o2 = ac.createOscillator(); o2.type = type; o2.frequency.value = f * 1.004;
    const vg = ac.createGain(); vg.gain.value = 0.5; o1.connect(vg); o2.connect(vg); vg.connect(lp);
    o1.start(); o2.start();
    return { o1, o2 };
  });
  let ci = 0;
  const iv = setInterval(() => {
    ci = (ci + 1) % chords.length;
    const ch = chords[ci];
    voices.forEach((v, i) => {
      const f = ch[i % ch.length];
      v.o1.frequency.linearRampToValueAtTime(f, ac.currentTime + 2);
      v.o2.frequency.linearRampToValueAtTime(f * 1.004, ac.currentTime + 2);
    });
  }, rate * 1000);
  return () => { clearInterval(iv); fadeOut(ac, g); setTimeout(() => { voices.forEach((v) => { try { v.o1.stop(); v.o2.stop(); } catch {} }); try { lfo.stop(); } catch {} }, 1100); };
}

function buildNoise(ac, out, { filter = 'lowpass', freq = 500, q = 0.7, gain = 0.16, swell = 0 }) {
  const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 3); src.loop = true;
  const f = ac.createBiquadFilter(); f.type = filter; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = 0.0001; g.connect(out);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 2);
  src.connect(f); f.connect(g); src.start();
  let lfo = null;
  if (swell) { lfo = ac.createOscillator(); lfo.frequency.value = swell; const lg = ac.createGain(); lg.gain.value = gain * 0.6; lfo.connect(lg); lg.connect(g.gain); lfo.start(); }
  return () => { if (lfo) try { lfo.stop(); } catch {} fadeOut(ac, g); setTimeout(() => { try { src.stop(); } catch {} }, 1100); };
}

function buildBells(ac, out, { scale, gain = 0.32, every = [1.5, 4], harm = [1, 2, 3], decay = 3, reverb = true }) {
  const g = ac.createGain(); g.gain.value = gain; g.connect(out);
  if (reverb) { const cv = makeReverb(ac); const rg = ac.createGain(); rg.gain.value = 0.6; g.connect(cv); cv.connect(rg); rg.connect(out); }
  let timer = null, alive = true;
  const ring = () => {
    if (!alive) return;
    const base = scale[Math.floor(Math.random() * scale.length)];
    const t = ac.currentTime;
    harm.forEach((h, i) => {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = base * h;
      const og = ac.createGain(); og.gain.setValueAtTime(0.0001, t);
      og.gain.linearRampToValueAtTime(0.5 / (i + 1), t + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + decay + 0.1);
    });
    timer = setTimeout(ring, (every[0] + Math.random() * (every[1] - every[0])) * 1000);
  };
  ring();
  return () => { alive = false; clearTimeout(timer); fadeOut(ac, g, 0.6); };
}

function buildDrone(ac, out, { root = 110, gain = 0.17, ratios = [1, 1.5, 2] }) {
  const g = ac.createGain(); g.gain.value = 0.0001; g.connect(out);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 3);
  const os = ratios.map((r, i) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = root * r;
    const og = ac.createGain(); og.gain.value = 0.5 / (i + 1); o.connect(og); og.connect(g); o.start(); return o;
  });
  const lfo = ac.createOscillator(); lfo.frequency.value = 0.12; const lg = ac.createGain(); lg.gain.value = gain * 0.3; lfo.connect(lg); lg.connect(g.gain); lfo.start();
  return () => { try { lfo.stop(); } catch {} fadeOut(ac, g, 1.4); setTimeout(() => os.forEach((o) => { try { o.stop(); } catch {} }), 1500); };
}

const combine = (...stops) => () => stops.forEach((s) => { try { s(); } catch {} });

/* ---------- Tracks ---------- */
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
const HIGH = [659.25, 783.99, 880.0, 1046.5, 1318.5];

const TRACKS = {
  calmpad: (ac, out) => buildPad(ac, out, { chords: [[130.81, 164.81, 196, 246.94], [174.61, 220, 261.63, 329.63], [220, 261.63, 329.63, 392], [196, 246.94, 293.66, 392]], type: 'triangle', cut: 1700, gain: 0.17 }),
  ocean: (ac, out) => buildNoise(ac, out, { filter: 'lowpass', freq: 440, q: 0.5, gain: 0.2, swell: 0.09 }),
  rain: (ac, out) => combine(
    buildNoise(ac, out, { filter: 'highpass', freq: 1400, q: 0.4, gain: 0.07 }),
    buildNoise(ac, out, { filter: 'lowpass', freq: 700, q: 0.5, gain: 0.05, swell: 0.3 }),
    buildBells(ac, out, { scale: HIGH, gain: 0.05, every: [0.18, 0.5], harm: [1], decay: 0.25, reverb: false }),
  ),
  chimes: (ac, out) => buildBells(ac, out, { scale: PENTA, gain: 0.34, every: [1.3, 3.2] }),
  drone: (ac, out) => buildDrone(ac, out, { root: 98, gain: 0.18, ratios: [1, 1.5, 2, 3] }),
  bowl: (ac, out) => combine(
    buildDrone(ac, out, { root: 130.81, gain: 0.12, ratios: [1, 2.0, 3.01] }),
    buildBells(ac, out, { scale: [130.81, 196, 261.63], gain: 0.3, every: [4, 8], harm: [1, 2.7, 4.2], decay: 6 }),
  ),
  night: (ac, out) => combine(
    buildPad(ac, out, { chords: [[110, 130.81, 164.81, 220], [146.83, 174.61, 220, 293.66], [98, 130.81, 196, 246.94]], type: 'sine', cut: 1100, gain: 0.16, rate: 11 }),
    buildBells(ac, out, { scale: HIGH, gain: 0.16, every: [3, 7], harm: [1, 2], decay: 4 }),
  ),
  forest: (ac, out) => combine(
    buildNoise(ac, out, { filter: 'lowpass', freq: 520, q: 0.4, gain: 0.08, swell: 0.07 }),
    buildBells(ac, out, { scale: [880, 1046.5, 1318.5, 1567.98], gain: 0.06, every: [0.8, 2.5], harm: [1, 2.02], decay: 0.4, reverb: true }),
  ),
  dream: (ac, out) => buildPad(ac, out, { chords: [[174.61, 261.63, 349.23, 440], [196, 293.66, 392, 493.88], [146.83, 220, 293.66, 440], [164.81, 246.94, 329.63, 415.3]], type: 'sawtooth', cut: 900, gain: 0.12, rate: 8 }),
  whitenoise: (ac, out) => buildNoise(ac, out, { filter: 'lowpass', freq: 5200, q: 0.2, gain: 0.13 }),
};

/* ---------- Public API ---------- */
export function playTrack(id) {
  ensure();
  if (actx.state === 'suspended') actx.resume();
  stopTrack();
  const build = TRACKS[id];
  if (!build) return false;
  currentStop = build(actx, master);
  currentId = id;
  return true;
}
export function stopTrack() {
  if (currentStop) { try { currentStop(); } catch {} currentStop = null; }
  currentId = null;
}
export function currentTrack() { return currentId; }
export function getAnalyser() { ensure(); return analyser; }
export function resumeAudio() { ensure(); if (actx.state === 'suspended') return actx.resume(); }
