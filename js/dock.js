// Dock with physics-based magnification (cosine-falloff around the cursor).
import { DOCK_LAYOUT, APP_MAP } from './apps.js';
import { openApp, closeWindow } from './windowManager.js';
import { on, emit, runningAppIds, windowsOf } from './state.js';
import { showContextMenu } from './contextmenu.js';
import { iconHTML, injectIconDefs } from './icons.js';

const dock = document.getElementById('dock');

let BASE = 52;       // resting icon size (px); refreshed from --dock-base each build
let MAX = 92;        // fully magnified size (px)
const RADIUS = 170;  // px of cursor influence to each side

// Resting size is driven by the --dock-base CSS custom property, which the
// Desktop & Dock settings pane updates via shell.setDockSize().
function readBase() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--dock-base');
  const n = parseInt(raw, 10);
  BASE = (Number.isFinite(n) && n >= 32 && n <= 88) ? n : 52;
  MAX = Math.round(BASE * 1.77); // keep the same resting:magnified ratio (~92/52)
}

const items = []; // { el, iconEl, appId, special }

const SPECIAL_ICONS = {
  launchpad: { name: 'Launchpad', icon: 'ic-creative', glyph: '🚀' },
  trash: { name: 'Trash', icon: 'ic-trash', glyph: '🗑️' },
};

export function buildDock() {
  injectIconDefs();
  readBase();
  dock.innerHTML = '';
  items.length = 0;

  DOCK_LAYOUT.forEach((entry) => {
    if (entry === 'sep') {
      dock.append(Object.assign(document.createElement('div'), { className: 'dock-sep' }));
      return;
    }
    const meta = APP_MAP[entry] || SPECIAL_ICONS[entry];
    if (!meta) return;

    const item = document.createElement('div');
    item.className = 'dock-item';
    item.dataset.app = entry;

    const tip = document.createElement('div');
    tip.className = 'dock-tooltip';
    tip.textContent = meta.name;

    const icon = document.createElement('div');
    icon.className = 'dock-icon';
    icon.innerHTML = iconHTML(entry, meta.name);

    const ind = document.createElement('div');
    ind.className = 'dock-indicator';

    item.append(tip, icon, ind);
    item.addEventListener('click', () => handleClick(entry, item));
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showDockMenu(entry, meta, e);
    });
    dock.append(item);

    items.push({ el: item, iconEl: icon, appId: entry, special: !!SPECIAL_ICONS[entry] && !APP_MAP[entry] });
  });

  resetSizes();
  wireMagnify();
  refreshRunning();
}

function sizeItem(it, w) {
  it.el.style.width = w + 'px';
  it.iconEl.style.width = w + 'px';
  it.iconEl.style.height = w + 'px';
  it.iconEl.style.fontSize = (w * 0.6) + 'px';
  it.iconEl.style.borderRadius = (w * 0.23) + 'px';
}
function resetSizes() { items.forEach((it) => sizeItem(it, BASE)); }

function influence(dist) {
  const d = Math.abs(dist);
  if (d > RADIUS) return 0;
  return (Math.cos((d / RADIUS) * Math.PI) + 1) / 2; // 1 at cursor → 0 at radius edge
}

function wireMagnify() {
  let raf = null, lastX = 0, inside = false;

  function apply() {
    raf = null;
    if (!inside) return;
    const centers = items.map((it) => { const r = it.el.getBoundingClientRect(); return r.left + r.width / 2; });
    items.forEach((it, i) => {
      const f = influence(lastX - centers[i]);
      sizeItem(it, BASE + (MAX - BASE) * f);
    });
  }

  dock.addEventListener('mousemove', (e) => {
    inside = true;
    lastX = e.clientX;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  dock.addEventListener('mouseleave', () => { inside = false; resetSizes(); });
}

function handleClick(entry, itemEl) {
  if (entry === 'launchpad') { emit('os:toggle-launchpad'); return; }

  const wasRunning = runningAppIds().has(entry);
  if (!wasRunning) {
    itemEl.classList.add('bouncing');
    setTimeout(() => itemEl.classList.remove('bouncing'), 640);
  }
  openApp(entry);
}

function showDockMenu(entry, meta, e) {
  const running = runningAppIds().has(entry);
  let items;

  if (entry === 'launchpad') {
    items = [{ label: 'Open Launchpad', act: () => emit('os:toggle-launchpad') }];
  } else if (entry === 'trash') {
    items = [
      { label: 'Open', act: () => openApp('trash') },
      { sep: true },
      { label: 'Empty Trash', danger: true, act: () => emit('os:empty-trash') },
    ];
  } else {
    items = [];
    if (running) {
      items.push({ label: 'Show All Windows', act: () => openApp(entry) });
      items.push({ sep: true });
    }
    items.push({ label: 'Options', disabled: true });
    items.push({ label: 'Show in Finder', act: () => openApp('finder') });
    items.push({ sep: true });
    items.push({ label: 'Open', act: () => openApp(entry) });
    if (running) {
      items.push({ sep: true });
      items.push({
        label: `Quit ${meta.name}`, danger: true,
        act: () => windowsOf(entry).forEach((w) => closeWindow(w.id)),
      });
    }
  }
  // Anchor the menu just above the icon, accounting for the dock at the bottom.
  showContextMenu(e.clientX, e.clientY, items);
}

function refreshRunning() {
  const running = runningAppIds();
  items.forEach((it) => {
    if (it.appId === 'launchpad') return;
    it.el.classList.toggle('running', running.has(it.appId));
  });
}

['os:open', 'os:close', 'os:minimize', 'os:restore'].forEach((evt) => on(evt, refreshRunning));

// Rebuild (with new resting size) when the Dock size setting changes.
on('os:dock-size', () => buildDock());
