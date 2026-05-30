// Synthesized system sounds (Web Audio) — original chimes, no sampled assets.
// Startup chime plays on boot/restart/power-on; restart & shutdown have their own.

let actx = null;
let startupDone = false;

function ctx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  return actx;
}

// A short decaying-noise impulse → cheap, lush reverb tail (gives the chime air).
function makeReverb(ac, seconds = 2.6, decay = 2.2) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const cv = ac.createConvolver();
  cv.buffer = buf;
  return cv;
}

function voice(ac, dest, freq, t0, dur, gain, type = 'triangle') {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/* ---------- Startup chime ---------- */
function chime() {
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime + 0.02;
  const master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
  const verb = makeReverb(ac); const vg = ac.createGain(); vg.gain.value = 0.5;
  verb.connect(vg); vg.connect(ac.destination);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.exponentialRampToValueAtTime(7500, t + 0.6);
  lp.connect(master); lp.connect(verb);

  // A bright, warm major add-9 chord (G B D G A) with a little detune shimmer.
  const chord = [196.0, 246.94, 293.66, 392.0, 587.33];
  chord.forEach((f) => {
    voice(ac, lp, f, t, 2.6, 0.16, 'triangle');
    voice(ac, lp, f * 1.003, t, 2.6, 0.10, 'sine');     // detuned shimmer
  });
  // a soft low foundation
  voice(ac, master, 98.0, t, 2.4, 0.10, 'sine');
}

export function playStartupChime() {
  const ac = ctx(); if (!ac) return;
  const go = () => { if (startupDone) return; startupDone = true; chime(); };
  if (ac.state === 'running') { go(); return; }
  // Autoplay policy: try to resume now, and also on the first user gesture.
  ac.resume().then(() => { if (ac.state === 'running') go(); }).catch(() => {});
  const onGesture = () => {
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, onGesture));
    ac.resume().finally(go);
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, onGesture, { once: true }));
}

// Lets restart/power-on replay the chime.
export function replayStartupChime() { startupDone = false; playStartupChime(); }

/* ---------- Restart sound (quick downward whoosh + rising blip) ---------- */
export function playRestartSound() {
  const ac = ctx(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime + 0.01;
  const master = ac.createGain(); master.gain.value = 0.4; master.connect(ac.destination);

  // filtered noise whoosh
  const len = Math.floor(ac.sampleRate * 0.5);
  const nb = ac.createBuffer(1, len, ac.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < len; i++) nd[i] = (Math.random() * 2 - 1);
  const noise = ac.createBufferSource(); noise.buffer = nb;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(1800, t);
  bp.frequency.exponentialRampToValueAtTime(300, t + 0.45);
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  noise.connect(bp); bp.connect(ng); ng.connect(master);
  noise.start(t); noise.stop(t + 0.55);

  // a rising confirmation tone
  const o = ac.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(330, t + 0.18);
  o.frequency.exponentialRampToValueAtTime(660, t + 0.5);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.24);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g); g.connect(master);
  o.start(t + 0.18); o.stop(t + 0.65);
}

/* ---------- Shutdown sound (descending power-down + low thud) ---------- */
export function playShutdownSound() {
  const ac = ctx(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime + 0.01;
  const master = ac.createGain(); master.gain.value = 0.45; master.connect(ac.destination);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.connect(master);

  // descending sweep — the "powering down" glide
  const o = ac.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.7);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  o.connect(g); g.connect(lp);
  o.start(t); o.stop(t + 0.85);

  // a soft low thud at the end
  const th = ac.createOscillator(); th.type = 'sine';
  th.frequency.setValueAtTime(120, t + 0.6);
  th.frequency.exponentialRampToValueAtTime(45, t + 0.95);
  const tg = ac.createGain();
  tg.gain.setValueAtTime(0.0001, t + 0.6);
  tg.gain.exponentialRampToValueAtTime(0.4, t + 0.66);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
  th.connect(tg); tg.connect(master);
  th.start(t + 0.6); th.stop(t + 1.05);
}
