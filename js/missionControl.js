// Mission Control: tile all open (non-minimized) windows in a scaled overview
// on a dimmed backdrop. Click a tile to focus that window and exit; Esc exits.
// Triggered by F3 or Ctrl+ArrowUp (and the 'missioncontrol' app).
import { OS, on } from './state.js';
import { focusWindow } from './windowManager.js';

const root = document.getElementById('mission-control');
const stage = root.querySelector('.mc-stage');
const MENUBAR_H = 26;
let isOpen = false;

export function initMissionControl() {
  on('os:toggle-mission-control', toggle);
  root.addEventListener('click', (e) => { if (e.target === root || e.target === stage) close(); });
}

export function isMissionControlOpen() { return isOpen; }

function toggle() { isOpen ? close() : open(); }

export function open() {
  if (isOpen) return;
  const wins = [...OS.windows.values()].filter((w) => !w.minimized);
  layout(wins);
  isOpen = true;
  root.classList.remove('hidden');
  requestAnimationFrame(() => root.classList.add('show'));
}

export function close() {
  if (!isOpen) return;
  isOpen = false;
  root.classList.remove('show');
  setTimeout(() => { root.classList.add('hidden'); stage.innerHTML = ''; }, 220);
}

// Pack tiles into a responsive grid that fits the viewport, then place each
// tile so its aspect ratio matches its source window.
function layout(wins) {
  stage.innerHTML = '';
  if (!wins.length) {
    const empty = document.createElement('div');
    empty.className = 'mc-empty';
    empty.textContent = 'No open windows';
    stage.append(empty);
    return;
  }

  const padTop = MENUBAR_H + 40;
  const padBottom = 120;
  const padX = 60;
  const areaW = window.innerWidth - padX * 2;
  const areaH = window.innerHeight - padTop - padBottom;

  const n = wins.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  const gap = 26;

  wins.forEach((win, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ww = win.el.offsetWidth || 640;
    const wh = win.el.offsetHeight || 460;

    // Scale to fit the cell (minus gap), preserving aspect ratio.
    const maxW = cellW - gap, maxH = cellH - gap;
    const scale = Math.min(maxW / ww, maxH / wh, 1);
    const tw = ww * scale, th = wh * scale;

    const cx = padX + col * cellW + cellW / 2;
    const cy = padTop + row * cellH + cellH / 2;

    const tile = document.createElement('div');
    tile.className = 'mc-tile';
    tile.style.left = Math.round(cx - tw / 2) + 'px';
    tile.style.top = Math.round(cy - th / 2) + 'px';
    tile.style.width = ww + 'px';
    tile.style.height = wh + 'px';
    tile.style.transform = `scale(${scale})`;

    // Live clone of the window so the overview reflects real content.
    const clone = win.el.cloneNode(true);
    clone.style.position = 'static';
    clone.style.left = clone.style.top = '0';
    clone.style.margin = '0';
    clone.style.width = ww + 'px';
    clone.style.height = wh + 'px';
    clone.style.boxShadow = 'none';
    clone.style.transition = 'none';
    clone.classList.remove('active', 'opening', 'closing', 'minimizing');
    clone.querySelectorAll('.resize-handle').forEach((h) => h.remove());
    tile.append(clone);

    const label = document.createElement('div');
    label.className = 'mc-tile-title';
    const titleEl = win.el.querySelector('.titlebar-title');
    label.textContent = titleEl ? titleEl.textContent : win.appId;
    tile.append(label);

    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      focusWindow(win.id);
    });
    stage.append(tile);
  });
}
