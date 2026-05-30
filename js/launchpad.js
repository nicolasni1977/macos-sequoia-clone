// Launchpad — full-screen app grid with search and pagination.
import { APPS } from './apps.js';
import { openApp } from './windowManager.js';
import { on } from './state.js';
import { iconHTML } from './icons.js';

const overlay = document.getElementById('launchpad-overlay');
const grid = document.getElementById('launchpad-grid');
const pager = document.getElementById('launchpad-pager');
const input = document.getElementById('launchpad-input');

const PAGE_SIZE = 35;
let page = 0;
let filtered = APPS;
let isOpen = false;

export function initLaunchpad() {
  on('os:toggle-launchpad', toggle);
  input.addEventListener('input', () => { filter(input.value); });
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay || e.target === grid || e.target.id === 'launchpad-pager') close();
  });
  overlay.addEventListener('wheel', (e) => {
    if (filtered.length <= PAGE_SIZE) return;
    if (e.deltaY > 12 || e.deltaX > 12) changePage(1);
    else if (e.deltaY < -12 || e.deltaX < -12) changePage(-1);
  }, { passive: true });
}

function toggle() { isOpen ? close() : open(); }

function open() {
  isOpen = true;
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
  input.value = '';
  filtered = APPS;
  page = 0;
  render();
  setTimeout(() => input.focus(), 30);
}
export function close() {
  isOpen = false;
  overlay.classList.add('hidden');
  overlay.classList.remove('show');
}

function filter(q) {
  q = q.trim().toLowerCase();
  filtered = q ? APPS.filter((a) => a.name.toLowerCase().includes(q)) : APPS;
  page = 0;
  render();
}

function changePage(dir) {
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  page = Math.max(0, Math.min(page + dir, pages - 1));
  render();
}

function render() {
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(page, pages - 1);
  const slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  grid.innerHTML = '';
  slice.forEach((a) => {
    const item = document.createElement('div');
    item.className = 'lp-item';
    item.innerHTML = `<div class="lp-icon">${iconHTML(a.id, a.name)}</div><div class="lp-label">${a.name}</div>`;
    item.addEventListener('click', (e) => { e.stopPropagation(); openApp(a.id); close(); });
    grid.append(item);
  });

  pager.innerHTML = '';
  if (pages > 1) {
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('div');
      dot.className = 'lp-dot' + (i === page ? ' active' : '');
      dot.addEventListener('click', (e) => { e.stopPropagation(); page = i; render(); });
      pager.append(dot);
    }
  }
}
