// js/apps/music.js — relaxing ambient player. Sound is generated live by
// js/musicEngine.js (Web Audio) — 10 tracks that actually play.
import { el, setHTML } from '../dom.js';
import { playTrack, stopTrack, currentTrack, getAnalyser } from '../musicEngine.js';
import { on } from '../state.js';

const TRACKS = [
  { id: 'calmpad', name: 'Calm Piano Pad', vibe: 'Soft major chords', emoji: '🎹', grad: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { id: 'ocean', name: 'Ocean Waves', vibe: 'Rolling surf', emoji: '🌊', grad: 'linear-gradient(135deg,#2193b0,#6dd5ed)' },
  { id: 'rain', name: 'Rainfall', vibe: 'Gentle rain', emoji: '🌧️', grad: 'linear-gradient(135deg,#4b6cb7,#182848)' },
  { id: 'chimes', name: 'Wind Chimes', vibe: 'Pentatonic bells', emoji: '🎐', grad: 'linear-gradient(135deg,#f6d365,#fda085)' },
  { id: 'drone', name: 'Deep Drone', vibe: 'Low resonance', emoji: '🌌', grad: 'linear-gradient(135deg,#3a3d40,#181a1b)' },
  { id: 'bowl', name: 'Meditation Bowl', vibe: 'Singing bowl', emoji: '🧘', grad: 'linear-gradient(135deg,#c79081,#dfa579)' },
  { id: 'night', name: 'Night Sky', vibe: 'Minor pads & stars', emoji: '🌙', grad: 'linear-gradient(135deg,#0f2027,#2c5364)' },
  { id: 'forest', name: 'Forest Dawn', vibe: 'Wind & birdsong', emoji: '🌲', grad: 'linear-gradient(135deg,#5a3f37,#2c7744)' },
  { id: 'dream', name: 'Dream Pad', vibe: 'Warm synth wash', emoji: '💭', grad: 'linear-gradient(135deg,#8ec5fc,#3f2b96)' },
  { id: 'whitenoise', name: 'White Noise', vibe: 'Sleep & focus', emoji: '🔉', grad: 'linear-gradient(135deg,#bdc3c7,#2c3e50)' },
];

export function content(win, api) {
  let active = 0;
  let elapsed = 0;
  let timer = null, raf = null;

  const root = el('music-root');

  /* Hero / now-playing */
  const hero = el('music-hero');
  const art = el('music-art');
  const info = el('music-info');
  const canvas = el('music-viz', 'canvas');
  const controls = el('music-controls');
  hero.append(art, info, canvas, controls);

  /* Track list */
  const list = el('music-list');

  root.append(setHTML('music-head', '🎧 Relaxing Sounds'), hero, list);

  const isPlaying = () => currentTrack() === TRACKS[active].id;

  function renderHero() {
    const t = TRACKS[active];
    art.style.background = t.grad;
    art.textContent = t.emoji;
    info.innerHTML = `<div class="music-title">${t.name}</div>
      <div class="music-sub">Ambient · Relaxation</div>
      <div class="music-time">${fmt(elapsed)}</div>`;
    controls.innerHTML = `
      <button class="music-ctl" data-a="prev">⏮</button>
      <button class="music-ctl music-play" data-a="toggle">${isPlaying() ? '⏸' : '▶'}</button>
      <button class="music-ctl" data-a="next">⏭</button>`;
    controls.querySelector('[data-a="prev"]').addEventListener('click', () => skip(-1));
    controls.querySelector('[data-a="next"]').addEventListener('click', () => skip(1));
    controls.querySelector('[data-a="toggle"]').addEventListener('click', toggle);
    root.classList.toggle('playing', isPlaying());
  }

  function renderList() {
    list.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const row = el('music-row' + (i === active ? ' active' : ''));
      const playingHere = currentTrack() === t.id;
      row.innerHTML = `
        <div class="music-row-art" style="background:${t.grad}">${t.emoji}</div>
        <div class="music-row-meta"><div class="music-row-name">${t.name}</div><div class="music-row-vibe">${t.vibe}</div></div>
        <div class="music-row-eq ${playingHere ? 'on' : ''}"><i></i><i></i><i></i><i></i></div>`;
      row.addEventListener('click', () => { active = i; start(); });
      list.append(row);
    });
  }

  function start() {
    playTrack(TRACKS[active].id);
    elapsed = 0;
    startTimer();
    renderHero(); renderList();
  }
  function toggle() {
    if (isPlaying()) { stopTrack(); stopTimer(); }
    else { start(); return; }
    renderHero(); renderList();
  }
  function skip(d) {
    active = (active + d + TRACKS.length) % TRACKS.length;
    start();
  }

  function startTimer() { stopTimer(); timer = setInterval(() => { elapsed++; const te = info.querySelector('.music-time'); if (te) te.textContent = fmt(elapsed); }, 1000); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* Visualizer */
  const ctx2d = canvas.getContext('2d');
  const analyser = getAnalyser();
  const bins = new Uint8Array(analyser.frequencyBinCount);
  function drawViz() {
    raf = requestAnimationFrame(drawViz);
    if (!root.isConnected) { cleanup(); return; }
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx2d.clearRect(0, 0, w, h);
    analyser.getByteFrequencyData(bins);
    const N = 40, step = Math.floor(bins.length / N);
    const bw = w / N;
    for (let i = 0; i < N; i++) {
      const v = bins[i * step] / 255;
      const bh = Math.max(2, v * h * 0.9);
      const x = i * bw;
      const grad = ctx2d.createLinearGradient(0, h, 0, h - bh);
      grad.addColorStop(0, 'rgba(255,255,255,0.25)');
      grad.addColorStop(1, 'rgba(255,255,255,0.9)');
      ctx2d.fillStyle = grad;
      ctx2d.fillRect(x + bw * 0.18, h - bh, bw * 0.64, bh);
    }
  }

  function cleanup() {
    cancelAnimationFrame(raf); raf = null;
    stopTimer();
  }
  // Stop sound when the Music window closes.
  on('os:close', (e) => { if (e.detail && e.detail.winId === win.id) { stopTrack(); cleanup(); } });

  renderHero(); renderList(); drawViz();
  return root;
}
