// js/apps/timemachine.js — Time Machine app
// Signature "stack of windows through time" view with timeline, animated
// snapshot browser, and Restore flow.
import { el, setHTML } from '../dom.js';

// ---------------------------------------------------------------------------
// Snapshot data — simulated backup dates with synthetic file contents
// ---------------------------------------------------------------------------
const SNAPSHOTS = (() => {
  const now = new Date(2026, 4, 30); // May 30 2026
  const snaps = [];
  // Generate 24 snapshots: today (hourly) + recent weeks + months
  const addSnap = (d, label) => snaps.push({ date: new Date(d), label });

  // Today — hourly for last 8 hours
  for (let h = 0; h < 8; h++) {
    const d = new Date(now);
    d.setHours(now.getHours() - h);
    d.setMinutes(0, 0, 0);
    addSnap(d, h === 0 ? 'Now' : `Today ${fmtTime(d)}`);
  }
  // Yesterday
  const yd = new Date(now); yd.setDate(yd.getDate() - 1);
  for (let h = 0; h < 3; h++) {
    const d = new Date(yd); d.setHours(12 - h * 4);
    addSnap(d, `Yesterday ${fmtTime(d)}`);
  }
  // Past days this week
  for (let i = 2; i < 7; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    addSnap(d, fmtDate(d));
  }
  // Past weeks
  for (let w = 1; w < 4; w++) {
    const d = new Date(now); d.setDate(d.getDate() - 7 * w);
    addSnap(d, fmtDate(d));
  }
  // Past months
  for (let m = 1; m < 6; m++) {
    const d = new Date(now); d.setMonth(d.getMonth() - m);
    addSnap(d, fmtDateLong(d));
  }
  return snaps;
})();

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtDateLong(d) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function fmtFull(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    + ' at ' + fmtTime(d);
}

// ---------------------------------------------------------------------------
// Synthetic file contents for each snapshot index
// ---------------------------------------------------------------------------
const FILE_SETS = [
  // index 0 — newest
  [
    { g: '📁', n: 'Projects', t: 'folder' },
    { g: '📄', n: 'Resume_v3.pdf', t: 'doc' },
    { g: '🖼️', n: 'Screenshot 2026-05-30.png', t: 'img' },
    { g: '📊', n: 'Budget_Q2.numbers', t: 'doc' },
    { g: '📁', n: 'Downloads', t: 'folder' },
    { g: '🎵', n: 'Playlist_May.m4a', t: 'audio' },
    { g: '📦', n: 'archive.zip', t: 'doc' },
    { g: '📝', n: 'Notes.txt', t: 'doc' },
    { g: '🖼️', n: 'Wallpaper.heic', t: 'img' },
    { g: '📁', n: 'Desktop', t: 'folder' },
    { g: '📄', n: 'Invoice_May.pdf', t: 'doc' },
    { g: '🗂️', n: 'Archive', t: 'folder' },
  ],
  [
    { g: '📁', n: 'Projects', t: 'folder' },
    { g: '📄', n: 'Resume_v3.pdf', t: 'doc' },
    { g: '🖼️', n: 'Screenshot 2026-05-29.png', t: 'img' },
    { g: '📊', n: 'Budget_Q2.numbers', t: 'doc' },
    { g: '📁', n: 'Downloads', t: 'folder' },
    { g: '🎵', n: 'Playlist_May.m4a', t: 'audio' },
    { g: '📝', n: 'Notes.txt', t: 'doc' },
    { g: '🖼️', n: 'Wallpaper.heic', t: 'img' },
    { g: '📁', n: 'Desktop', t: 'folder' },
    { g: '📄', n: 'Invoice_Apr.pdf', t: 'doc' },
  ],
  [
    { g: '📁', n: 'Projects', t: 'folder' },
    { g: '📄', n: 'Resume_v2.pdf', t: 'doc' },
    { g: '📊', n: 'Budget_Q1.numbers', t: 'doc' },
    { g: '📁', n: 'Downloads', t: 'folder' },
    { g: '📝', n: 'Notes.txt', t: 'doc' },
    { g: '🖼️', n: 'Wallpaper.heic', t: 'img' },
    { g: '📁', n: 'Desktop', t: 'folder' },
    { g: '📄', n: 'Invoice_Apr.pdf', t: 'doc' },
    { g: '🗂️', n: 'Archive', t: 'folder' },
  ],
];
// Older snapshots reuse earlier sets with minor variation
function filesFor(idx) {
  if (idx < FILE_SETS.length) return FILE_SETS[idx];
  // Remove 1-2 files for older snapshots to show content drift
  const base = FILE_SETS[FILE_SETS.length - 1];
  const drop = idx % 3;
  return base.slice(0, base.length - drop);
}

// ---------------------------------------------------------------------------
// Main content function
// ---------------------------------------------------------------------------
export function content(win, api) {
  // Restore persisted snapshot index
  let currentIdx = api.load('snapIdx', 0);
  if (currentIdx < 0 || currentIdx >= SNAPSHOTS.length) currentIdx = 0;

  // ---- Root layout --------------------------------------------------------
  const root = el('tm-root');

  // Starfield background (canvas drawn once)
  const stars = el('tm-stars', 'canvas');
  root.append(stars);

  // Stack of "receding" Finder windows
  const stackWrap = el('tm-stack');
  root.append(stackWrap);

  // Active (foreground) Finder window
  const finderWin = el('tm-finder');
  finderWin.innerHTML = buildFinderHTML(currentIdx);
  stackWrap.append(finderWin);

  // Ghost windows behind (time-depth effect)
  const GHOST_COUNT = 5;
  const ghosts = [];
  for (let i = 0; i < GHOST_COUNT; i++) {
    const g = el('tm-ghost');
    g.dataset.depth = i + 1;
    g.innerHTML = buildFinderHTML(Math.min(currentIdx + i + 1, SNAPSHOTS.length - 1));
    stackWrap.append(g);
    ghosts.push(g);
  }

  // Right-edge timeline
  const timeline = el('tm-timeline');
  root.append(timeline);

  // Bottom bar with controls
  const bottomBar = el('tm-bottom');
  const snapLabel = el('tm-snap-label');
  snapLabel.textContent = fmtFull(SNAPSHOTS[currentIdx].date);

  const navRow = el('tm-nav-row');
  const prevBtn = el('tm-nav-btn', 'button');
  prevBtn.title = 'Go to newer snapshot';
  prevBtn.innerHTML = '&#8963;'; // up chevron ˄
  const nextBtn = el('tm-nav-btn', 'button');
  nextBtn.title = 'Go to older snapshot';
  nextBtn.innerHTML = '&#8964;'; // down chevron ˅
  const restoreBtn = el('tm-restore-btn', 'button');
  restoreBtn.textContent = 'Restore';
  const cancelBtn = el('tm-cancel-btn', 'button');
  cancelBtn.textContent = 'Cancel';

  navRow.append(prevBtn, nextBtn);
  bottomBar.append(navRow, snapLabel, restoreBtn, cancelBtn);
  root.append(bottomBar);

  // ---- Build timeline ticks -----------------------------------------------
  buildTimeline(timeline, currentIdx);

  // Timeline tick clicks bubble up as custom events
  timeline.addEventListener('tm-navigate', (e) => navigate(e.detail.idx));

  // ---- Draw stars ---------------------------------------------------------
  requestAnimationFrame(() => drawStars(stars));

  // ---- Navigation logic ---------------------------------------------------
  function navigate(newIdx) {
    if (newIdx < 0 || newIdx >= SNAPSHOTS.length) return;
    const dir = newIdx > currentIdx ? 1 : -1; // 1 = going older, -1 = going newer
    currentIdx = newIdx;
    api.store('snapIdx', currentIdx);

    // Animate stack
    stackWrap.classList.add(dir > 0 ? 'tm-slide-older' : 'tm-slide-newer');
    setTimeout(() => {
      stackWrap.classList.remove('tm-slide-older', 'tm-slide-newer');
      // Update content
      finderWin.innerHTML = buildFinderHTML(currentIdx);
      ghosts.forEach((g, i) => {
        g.innerHTML = buildFinderHTML(Math.min(currentIdx + i + 1, SNAPSHOTS.length - 1));
      });
    }, 300);

    snapLabel.textContent = fmtFull(SNAPSHOTS[currentIdx].date);
    buildTimeline(timeline, currentIdx);
    updateNavBtns();
  }

  function updateNavBtns() {
    prevBtn.disabled = currentIdx <= 0;
    nextBtn.disabled = currentIdx >= SNAPSHOTS.length - 1;
    prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
  }
  updateNavBtns();

  prevBtn.addEventListener('click', () => navigate(currentIdx - 1));
  nextBtn.addEventListener('click', () => navigate(currentIdx + 1));

  restoreBtn.addEventListener('click', () => {
    const snap = SNAPSHOTS[currentIdx];
    api.toast(`✅ "${fmtFull(snap.date)}" restored to your Mac!`, { duration: 3500 });
  });
  cancelBtn.addEventListener('click', () => api.close());

  // Keyboard: up/down arrows
  root.setAttribute('tabindex', '-1');
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); navigate(currentIdx - 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); navigate(currentIdx + 1); }
  });
  // Focus root so keys work
  setTimeout(() => root.focus(), 100);

  return root;
}

// ---------------------------------------------------------------------------
// Build the inner Finder window HTML for a given snapshot index
// ---------------------------------------------------------------------------
function buildFinderHTML(idx) {
  const snap = SNAPSHOTS[Math.min(idx, SNAPSHOTS.length - 1)];
  const files = filesFor(idx);
  const fileItems = files.map(f =>
    `<div class="tm-ff"><span class="tm-ff-glyph">${f.g}</span><span class="tm-ff-name">${f.n}</span></div>`
  ).join('');

  return `
    <div class="tm-finder-titlebar">
      <span class="tm-tl-dot" style="background:#ff5f57"></span>
      <span class="tm-tl-dot" style="background:#febc2e"></span>
      <span class="tm-tl-dot" style="background:#28c840"></span>
      <span class="tm-finder-title">Documents — ${snap.label}</span>
    </div>
    <div class="tm-finder-sidebar">
      <div class="tm-sb-item tm-sb-active">📄 Documents</div>
      <div class="tm-sb-item">🖥️ Desktop</div>
      <div class="tm-sb-item">⬇️ Downloads</div>
      <div class="tm-sb-item">☁️ iCloud Drive</div>
      <div class="tm-sb-item">🕘 Recents</div>
    </div>
    <div class="tm-finder-body">
      <div class="tm-finder-toolbar">
        <span class="tm-tb-nav">◀ ▶</span>
        <span class="tm-tb-path">📄 Documents</span>
        <span class="tm-tb-spacer"></span>
        <span class="tm-tb-view">⊞ ≡</span>
      </div>
      <div class="tm-finder-grid">${fileItems}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Build the right-edge timeline
// ---------------------------------------------------------------------------
function buildTimeline(container, selectedIdx) {
  container.innerHTML = '';

  // Group label + ticks
  const groups = [
    { label: 'Today', items: SNAPSHOTS.filter(s => isToday(s.date)) },
    { label: 'Yesterday', items: SNAPSHOTS.filter(s => isYesterday(s.date)) },
    { label: 'This Week', items: SNAPSHOTS.filter(s => isThisWeek(s.date) && !isToday(s.date) && !isYesterday(s.date)) },
    { label: 'Earlier', items: SNAPSHOTS.filter(s => !isThisWeek(s.date)) },
  ].filter(g => g.items.length > 0);

  groups.forEach(group => {
    const label = el('tm-tl-group');
    label.textContent = group.label;
    container.append(label);

    group.items.forEach(snap => {
      const idx = SNAPSHOTS.indexOf(snap);
      const tick = el('tm-tl-tick');
      if (idx === selectedIdx) tick.classList.add('tm-tl-selected');
      const dot = el('tm-tl-dot-el');
      const lbl = el('tm-tl-tick-label');
      lbl.textContent = snap.label === 'Now' ? 'Now' : fmtTime(snap.date).replace(' ', ' ');
      tick.append(dot, lbl);
      tick.addEventListener('click', () => {
        // Navigate from parent — dispatch a custom event
        container.dispatchEvent(new CustomEvent('tm-navigate', { bubbles: true, detail: { idx } }));
      });
      container.append(tick);
    });
  });
}

// ---- Date helpers ----------------------------------------------------------
const DAY = 86400000;
const now_ = new Date(2026, 4, 30);

function startOf(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function isToday(d) { return startOf(d) === startOf(now_); }
function isYesterday(d) { return startOf(d) === startOf(now_) - DAY; }
function isThisWeek(d) { return startOf(d) >= startOf(now_) - 6 * DAY; }

// ---- Star canvas -----------------------------------------------------------
function drawStars(canvas) {
  const W = canvas.offsetWidth || 900;
  const H = canvas.offsetHeight || 600;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Deep space gradient
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
  grad.addColorStop(0, '#0d1a2e');
  grad.addColorStop(0.6, '#060c18');
  grad.addColorStop(1, '#020509');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  const rng = mulberry32(42);
  for (let i = 0; i < 280; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = rng() * 1.2 + 0.2;
    const a = rng() * 0.7 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    ctx.fill();
  }

  // Nebula wisps
  for (let n = 0; n < 4; n++) {
    const nx = rng() * W;
    const ny = rng() * H;
    const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 120 + rng() * 80);
    const hue = [220, 260, 200, 240][n];
    ng.addColorStop(0, `hsla(${hue},70%,60%,0.04)`);
    ng.addColorStop(1, 'transparent');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, W, H);
  }
}

// Seeded random (Mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
