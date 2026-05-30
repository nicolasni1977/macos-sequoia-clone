// Control Center: a glass panel with Wi-Fi/Bluetooth/AirDrop toggles, a Focus
// toggle, brightness + volume sliders, an Appearance (light/dark) toggle wired
// to setAppearance, a Stage Manager toggle, and a Now-Playing stub. Toggle and
// slider states are persisted. Opened from the menu-bar control icon.
import { on, emit } from './state.js';
import { getSetting, setSetting, getAppearance, setAppearance } from './shell.js';
import { isStageOn } from './stageManager.js';
import { setVolume, playVolumeTick } from './musicEngine.js';

const panel = document.getElementById('control-center');
const btn = document.getElementById('status-control');
let isOpen = false;
let lastTick = 0;

const TOGGLES = [
  { key: 'wifi', name: 'Wi-Fi', ic: '📶', on: 'Home Network', off: 'Off', def: true },
  { key: 'bluetooth', name: 'Bluetooth', ic: '🔵', on: 'On', off: 'Off', def: true },
  { key: 'airdrop', name: 'AirDrop', ic: '📡', on: 'Everyone', off: 'Off', def: false },
  { key: 'focus', name: 'Focus', ic: '🌙', on: 'On', off: 'Off', def: false },
];

export function initControlCenter() {
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  on('os:toggle-control-center', toggle);

  // Outside-click / Escape close.
  document.addEventListener('mousedown', (e) => {
    if (isOpen && !e.target.closest('#control-center') && !e.target.closest('#status-control')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });

  // Keep the Stage Manager toggle in sync if changed elsewhere.
  on('os:stage-changed', () => { if (isOpen) syncStage(); });
}

function toggle() { isOpen ? close() : open(); }

function open() {
  build();
  isOpen = true;
  panel.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('show'));
  btn.classList.add('active');
}
function close() {
  isOpen = false;
  panel.classList.remove('show');
  btn.classList.remove('active');
  setTimeout(() => panel.classList.add('hidden'), 160);
}

function build() {
  panel.innerHTML = '';

  // --- Connectivity tile (Wi-Fi / Bluetooth / AirDrop) ---
  const conn = tile('span2');
  TOGGLES.filter((t) => t.key !== 'focus').forEach((t) => conn.append(toggleRow(t)));
  panel.append(conn);

  // --- Focus tile ---
  const focus = tile();
  focus.append(toggleRow(TOGGLES.find((t) => t.key === 'focus')));
  panel.append(focus);

  // --- Stage Manager tile ---
  const stage = tile();
  const stageRow = toggleRow({ key: 'stageManager', name: 'Stage Manager', ic: '🪟', on: 'On', off: 'Off', def: false }, () => isStageOn());
  stageRow.dataset.stage = '1';
  stage.append(stageRow);
  panel.append(stage);

  // --- Display brightness slider ---
  panel.append(sliderTile('brightness', 'Display', '🔆', 80));

  // --- Sound volume slider ---
  panel.append(sliderTile('volume', 'Sound', '🔊', 60));

  // --- Appearance toggle ---
  const appearance = tile('span2');
  const lbl = document.createElement('div');
  lbl.className = 'cc-slider-label';
  lbl.innerHTML = '🎨 Appearance';
  const seg = document.createElement('div');
  seg.className = 'cc-appearance';
  ['light', 'dark'].forEach((mode) => {
    const b = document.createElement('button');
    b.textContent = mode === 'light' ? 'Light' : 'Dark';
    b.classList.toggle('active', getAppearance() === mode);
    b.addEventListener('click', () => {
      setAppearance(mode);
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
    });
    seg.append(b);
  });
  appearance.append(lbl, seg);
  panel.append(appearance);
}

function tile(extra) {
  const t = document.createElement('div');
  t.className = 'cc-tile' + (extra ? ' ' + extra : '');
  return t;
}

function toggleRow(t, getState) {
  const stored = getState ? getState() : getSetting('cc:' + t.key, t.def);
  const row = document.createElement('div');
  row.className = 'cc-toggle' + (stored ? ' on' : '');
  row.innerHTML = `
    <div class="cc-ic">${t.ic}</div>
    <div class="cc-labels">
      <span class="cc-name">${t.name}</span>
      <span class="cc-state">${stored ? t.on : t.off}</span>
    </div>`;
  row.addEventListener('click', () => {
    const nowOn = !row.classList.contains('on');
    row.classList.toggle('on', nowOn);
    row.querySelector('.cc-state').textContent = nowOn ? t.on : t.off;
    if (row.dataset.stage) {
      emit('os:set-stage', { on: nowOn });
    } else {
      setSetting('cc:' + t.key, nowOn);
    }
  });
  return row;
}

function sliderTile(key, name, ic, def) {
  const t = tile('span2');
  const lbl = document.createElement('div');
  lbl.className = 'cc-slider-label';
  lbl.innerHTML = `${ic} ${name}`;
  const val = getSetting('cc:' + key, def);
  if (key === 'volume') setVolume(val / 100);
  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'cc-slider';
  input.min = '0'; input.max = '100'; input.value = String(val);
  input.addEventListener('input', () => {
    const v = parseInt(input.value, 10);
    setSetting('cc:' + key, v);
    if (key === 'brightness') applyBrightness(v);
    if (key === 'volume') {
      setVolume(v / 100);
      // Throttle the audible blip so dragging doesn't machine-gun the engine.
      const n = Date.now();
      if (n - lastTick > 120) { lastTick = n; playVolumeTick(); }
    }
  });
  t.append(lbl, input);
  return t;
}

// Visual brightness: dim the whole desktop with an overlay tint.
function applyBrightness(v) {
  let dim = document.getElementById('brightness-dim');
  if (!dim) {
    dim = document.createElement('div');
    dim.id = 'brightness-dim';
    dim.style.cssText = 'position:fixed;inset:0;z-index:7000;pointer-events:none;background:#000;transition:opacity 0.15s ease';
    document.body.append(dim);
  }
  // 100 -> 0 opacity, 0 -> 0.6 opacity (never fully black).
  dim.style.opacity = String(Math.max(0, (100 - v) / 100 * 0.6));
}

function syncStage() {
  const row = panel.querySelector('[data-stage]');
  if (!row) return;
  const onNow = isStageOn();
  row.classList.toggle('on', onNow);
  row.querySelector('.cc-state').textContent = onNow ? 'On' : 'Off';
}

// Restore persisted brightness on boot.
export function applyPersistedBrightness() {
  const v = getSetting('cc:brightness', 80);
  if (v < 100) applyBrightness(v);
}
