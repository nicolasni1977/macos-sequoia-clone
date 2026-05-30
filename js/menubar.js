// Menu bar: live clock, ever-changing active-app name + menus, functional
// Apple menu (About / Sleep / Restart / Shut Down / Lock Screen / Settings).
import { OS, on, emit, windowsOf } from './state.js';
import {
  openApp, closeWindow, minimizeActive, closeActive, toggleMaximize, quitActive,
} from './windowManager.js';
import { aboutThisMac, sleep, restart, shutDown, lockScreen } from './system.js';

const bar = document.getElementById('menubar');
const dropdown = document.getElementById('menu-dropdown');
const appNameEl = bar.querySelector('.mb-appname');
const clockEl = document.getElementById('status-clock');

let currentApp = 'finder';
let currentAppName = 'Finder';
let openName = null;

const sep = { sep: true };

const exec = (cmd) => () => { try { document.execCommand(cmd); } catch { /* no-op */ } };
const hasWindow = () => !!OS.activeWinId && OS.windows.has(OS.activeWinId);

function newWindow() {
  // Ask the focused app to make a new doc/window; fall back to opening the app.
  if (OS.activeWinId) emit('app:new', { appId: currentApp, winId: OS.activeWinId });
  openApp(currentApp);
}

// The Apple menu is constant; the rest change with the focused app.
function appleMenu() {
  return [
    { label: 'About This Mac', act: aboutThisMac },
    sep,
    { label: 'System Settings…', act: () => openApp('settings') },
    { label: 'App Store…', act: () => openApp('appstore') },
    sep,
    { label: 'Sleep', act: sleep },
    { label: 'Restart…', act: restart },
    { label: 'Shut Down…', act: shutDown },
    sep,
    { label: 'Lock Screen', sh: '⌃⌘Q', act: lockScreen },
    { label: 'Log Out Guest User…', act: lockScreen },
  ];
}

function menus() {
  const A = currentAppName;
  return {
    apple: appleMenu(),
    app: [
      { label: `About ${A}`, act: () => (currentApp === 'finder' ? aboutThisMac() : openApp('sysinfo')) },
      sep,
      { label: 'Settings…', sh: '⌘,', act: () => openApp('settings') },
      sep,
      { label: `Hide ${A}`, sh: '⌘H', act: minimizeActive, disabled: !hasWindow() },
      { label: 'Hide Others', sh: '⌥⌘H' },
      sep,
      { label: `Quit ${A}`, sh: '⌘Q', act: quitActive, disabled: !hasWindow() },
    ],
    file: [
      { label: 'New', sh: '⌘N', act: newWindow },
      { label: 'New Window', sh: '⇧⌘N', act: () => openApp(currentApp) },
      { label: 'Open…', sh: '⌘O', act: () => openApp('finder') },
      sep,
      { label: 'Close Window', sh: '⌘W', act: closeActive, disabled: !hasWindow() },
      { label: 'Save…', sh: '⌘S', disabled: true },
      { label: 'Print…', sh: '⌘P', disabled: true },
    ],
    edit: [
      { label: 'Undo', sh: '⌘Z', act: exec('undo') },
      { label: 'Redo', sh: '⇧⌘Z', act: exec('redo') },
      sep,
      { label: 'Cut', sh: '⌘X', act: exec('cut') },
      { label: 'Copy', sh: '⌘C', act: exec('copy') },
      { label: 'Paste', sh: '⌘V', act: exec('paste') },
      sep,
      { label: 'Select All', sh: '⌘A', act: exec('selectAll') },
    ],
    view: [
      { label: 'Show Toolbar' },
      { label: 'Hide Sidebar' },
      sep,
      { label: 'Enter Full Screen', sh: '⌃⌘F', disabled: !hasWindow(), act: () => OS.activeWinId && toggleMaximize(OS.activeWinId) },
    ],
    go: [
      { label: 'Back', sh: '⌘[' },
      { label: 'Forward', sh: '⌘]' },
      sep,
      { label: 'Applications', sh: '⇧⌘A', act: () => openApp('finder') },
      { label: 'Utilities', sh: '⇧⌘U', act: () => openApp('terminal') },
      { label: 'Downloads', sh: '⌥⌘L', act: () => openApp('finder') },
    ],
    window: [
      { label: 'Minimize', sh: '⌘M', act: minimizeActive, disabled: !hasWindow() },
      { label: 'Zoom', disabled: !hasWindow(), act: () => OS.activeWinId && toggleMaximize(OS.activeWinId) },
      sep,
      { label: 'Bring All to Front' },
    ],
    help: [
      { label: `${A} Help` },
      { label: 'Keyboard Shortcuts' },
    ],
  };
}

function buildRows(rows) {
  dropdown.innerHTML = '';
  rows.forEach((r) => {
    if (r.sep) { dropdown.append(Object.assign(document.createElement('div'), { className: 'menu-sep' })); return; }
    const row = document.createElement('div');
    row.className = 'menu-row' + (r.disabled ? ' disabled' : '');
    row.innerHTML = `<span>${r.label}</span>${r.sh ? `<span class="shortcut">${r.sh}</span>` : ''}`;
    if (!r.disabled) {
      row.addEventListener('click', () => { closeMenu(); r.act && r.act(); });
    }
    dropdown.append(row);
  });
}

function openMenu(name, itemEl) {
  const all = menus();
  const rows = all[name];
  if (!rows) return;
  openName = name;
  buildRows(rows);
  const rect = itemEl.getBoundingClientRect();
  dropdown.style.left = Math.max(4, rect.left) + 'px';
  dropdown.style.top = '26px';
  dropdown.classList.remove('hidden');
  bar.querySelectorAll('.mb-item').forEach((b) => b.classList.toggle('active', b === itemEl));
}

function closeMenu() {
  openName = null;
  dropdown.classList.add('hidden');
  bar.querySelectorAll('.mb-item').forEach((b) => b.classList.remove('active'));
}

function setActiveApp(id) {
  currentApp = id || 'finder';
  import('./apps.js').then(({ APP_MAP }) => {
    currentAppName = (APP_MAP[currentApp] && APP_MAP[currentApp].name) || 'Finder';
    appNameEl.textContent = currentAppName;
    // If a menu is open, refresh it live so labels (e.g. "Quit X") update.
    if (openName) {
      const itemEl = bar.querySelector(`.mb-item[data-menu="${openName}"]`);
      if (itemEl) openMenu(openName, itemEl);
    }
  });
}

export function initMenubar() {
  // Menu items
  bar.querySelectorAll('.mb-item[data-menu]').forEach((item) => {
    const name = item.dataset.menu;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openName === name) closeMenu();
      else openMenu(name, item);
    });
    item.addEventListener('mouseenter', () => { if (openName && openName !== name) openMenu(name, item); });
  });

  // Status items
  document.getElementById('status-search').addEventListener('click', (e) => { e.stopPropagation(); emit('os:toggle-spotlight'); });

  // Close on outside click
  document.addEventListener('mousedown', (e) => {
    if (openName && !e.target.closest('#menu-dropdown') && !e.target.closest('#menubar')) closeMenu();
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openName) closeMenu(); });

  // Ever-changing menu bar: react to focus / open / close on the OS bus.
  on('os:focus', (e) => setActiveApp(e.detail && e.detail.appId));
  on('os:open', (e) => setActiveApp(e.detail && e.detail.appId));
  on('os:close', () => {
    // After a close, the window manager re-focuses the topmost (or finder).
    const active = OS.activeWinId ? OS.windows.get(OS.activeWinId) : null;
    setActiveApp(active ? active.appId : 'finder');
  });

  startClock();
}

function startClock() {
  const tick = () => {
    const d = new Date();
    const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
    const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    clockEl.textContent = `${wd} ${t}`;
  };
  tick();
  setInterval(tick, 1000);
}
