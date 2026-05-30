// Cmd+Tab (or Ctrl+Tab) application switcher: a centered horizontal row of
// open apps. Holding the modifier and pressing Tab cycles forward, Shift+Tab
// cycles backward. Releasing the modifier focuses the highlighted app.
import { runningAppIds, on } from './state.js';
import { openApp } from './windowManager.js';
import { APP_MAP } from './apps.js';

const root = document.getElementById('app-switcher');

let isOpen = false;
let order = [];     // app ids, most-recently-used first
let selected = 0;
const mru = [];     // most-recently-used app id history

export function initAppSwitcher() {
  // Track most-recently-used apps from the OS bus so Cmd+Tab order matches macOS.
  const bump = (e) => {
    const id = e.detail && e.detail.appId;
    if (!id) return;
    const i = mru.indexOf(id);
    if (i !== -1) mru.splice(i, 1);
    mru.unshift(id);
  };
  on('os:focus', bump);
  on('os:open', bump);

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keyup', onKeyUp, true);
}

export function isSwitcherOpen() { return isOpen; }

function buildOrder() {
  const running = [...runningAppIds()];
  // MRU first, then any running app not yet seen.
  const seen = new Set();
  const ordered = [];
  mru.forEach((id) => { if (running.includes(id) && !seen.has(id)) { seen.add(id); ordered.push(id); } });
  running.forEach((id) => { if (!seen.has(id)) { seen.add(id); ordered.push(id); } });
  return ordered;
}

function onKeyDown(e) {
  const mod = e.metaKey || e.ctrlKey;
  if (!mod || e.key !== 'Tab') return;
  e.preventDefault();
  e.stopPropagation();

  if (!isOpen) {
    order = buildOrder();
    if (order.length < 1) return;
    isOpen = true;
    selected = order.length > 1 ? 1 : 0; // start on the previous app
    render();
    root.classList.remove('hidden');
    requestAnimationFrame(() => root.classList.add('show'));
  } else {
    const dir = e.shiftKey ? -1 : 1;
    selected = (selected + dir + order.length) % order.length;
    highlight();
  }
}

function onKeyUp(e) {
  if (!isOpen) return;
  // Commit when the modifier (Cmd/Ctrl) is released.
  if (e.key === 'Meta' || e.key === 'Control') {
    commit();
  } else if (e.key === 'Escape') {
    cancel();
  }
}

function render() {
  root.innerHTML = '';
  order.forEach((id, i) => {
    const app = APP_MAP[id] || { name: id, glyph: '📦', icon: 'ic-generic' };
    const item = document.createElement('div');
    item.className = 'as-item' + (i === selected ? ' selected' : '');
    item.dataset.idx = i;
    item.innerHTML = `
      <div class="as-app-icon ${app.icon}">${app.glyph}</div>
      <div class="as-app-name">${app.name}</div>`;
    item.addEventListener('mousemove', () => { selected = i; highlight(); });
    item.addEventListener('click', () => { selected = i; commit(); });
    root.append(item);
  });
}

function highlight() {
  [...root.children].forEach((c, i) => c.classList.toggle('selected', i === selected));
}

function hide() {
  isOpen = false;
  root.classList.remove('show');
  setTimeout(() => { root.classList.add('hidden'); root.innerHTML = ''; }, 120);
}

function commit() {
  const id = order[selected];
  hide();
  if (id) openApp(id);
}
function cancel() { hide(); }
