// Window manager: create / focus / drag / resize / minimize / maximize / close.
import { OS, nextZ, emit, windowsOf } from './state.js';
import { APP_MAP, el } from './apps.js';
import {
  toast, appStore, appLoad, theme,
  setWallpaper, setAppearance, getAppearance, getWallpaper, WALLPAPERS,
  getSetting, setSetting, setDockSize,
} from './shell.js';
import { showContextMenu, bindContextMenu } from './contextmenu.js';
import { trashContent } from './trash.js';

const layer = document.getElementById('windows-layer');
const MENUBAR_H = 26;
let openCount = 0;

const SPECIALS = {
  trash: {
    id: 'trash', name: 'Trash', icon: 'ic-trash', glyph: '🗑️', size: [620, 460],
    content: (win, api) => trashContent(win, api),
  },
};

export function openApp(id) {
  const app = APP_MAP[id] || SPECIALS[id];
  if (!app) return null;
  const existing = windowsOf(id)[0];
  if (existing) {
    if (existing.minimized) unminimize(existing);
    focusWindow(existing.id);
    return existing;
  }
  return createWindow(app);
}

function createWindow(app) {
  const id = 'win-' + (++OS.winSeq);
  const [w, h] = app.size || [640, 460];
  const maxW = window.innerWidth, maxH = window.innerHeight;
  const width = Math.min(w, maxW - 40);
  const height = Math.min(h, maxH - MENUBAR_H - 40);

  // Cascade around center
  const offset = (openCount % 6) * 28;
  let x = Math.round((maxW - width) / 2 + offset - 70);
  let y = Math.round((maxH - height) / 2 + offset - 60);
  x = Math.max(8, Math.min(x, maxW - width - 8));
  y = Math.max(MENUBAR_H + 6, Math.min(y, maxH - 120));
  openCount++;

  const elw = el('window opening');
  elw.dataset.winId = id;
  elw.dataset.appId = app.id;
  Object.assign(elw.style, { left: x + 'px', top: y + 'px', width: width + 'px', height: height + 'px', zIndex: nextZ() });

  const titlebar = el('titlebar');
  const lights = el('traffic-lights');
  lights.innerHTML = `
    <span class="tl tl-close" data-act="close"><span class="tl-glyph">×</span></span>
    <span class="tl tl-min" data-act="min"><span class="tl-glyph">−</span></span>
    <span class="tl tl-max" data-act="max"><span class="tl-glyph">+</span></span>`;
  const title = el('titlebar-title');
  title.textContent = app.name;
  titlebar.append(lights, title);

  const body = el('window-body');
  // Per-app CSS scoping hook: every app's body carries class "app-<id>".
  body.classList.add('app-' + app.id);
  elw.append(titlebar, body);

  const win = { id, appId: app.id, el: elw, body, titlebar, x, y, w: width, h: height, prev: null, minimized: false, maximized: false, fixed: !!app.fixed };
  OS.windows.set(id, win);

  // Content — the full app api contract (see APP_CONTRACT.md).
  const api = {
    openApp,
    close: () => closeWindow(id),
    setTitle: (t) => { title.textContent = t; },
    toast,
    store: (key, val) => appStore(app.id, key, val),
    load: (key, fallback) => appLoad(app.id, key, fallback),
    theme,
    setWallpaper,
    setAppearance,
    getSetting,
    setSetting,
    // Extras used by the System Settings app:
    getAppearance,
    getWallpaper,
    wallpapers: WALLPAPERS,
    setDockSize,
    // Contextual menu service: api.contextMenu(items, ev)
    contextMenu: (items, ev) => {
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      const x = ev ? ev.clientX : 100;
      const y = ev ? ev.clientY : 100;
      showContextMenu(x, y, items);
    },
    // Quick Look service: api.quickLook(content) — string | HTMLElement |
    // { type:'image'|'doc'|'info', ... }. See js/quickLook.js.
    quickLook: (content) => emit('os:quicklook', { content }),
  };
  try {
    const content = app.content(win, api);
    if (content) body.append(content);
  } catch (err) {
    body.append(Object.assign(el('wb-pad'), { textContent: 'Failed to load app: ' + err.message }));
    console.error(err);
  }

  // Resize handles
  if (!app.fixed) {
    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((dir) => {
      const handle = el('resize-handle rh-' + dir);
      handle.addEventListener('pointerdown', (e) => startResize(e, win, dir));
      elw.append(handle);
    });
  }

  layer.append(elw);

  // Wire interactions
  lights.querySelectorAll('.tl').forEach((b) => {
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const act = b.dataset.act;
      if (act === 'close') closeWindow(id);
      else if (act === 'min') minimizeWindow(id);
      else if (act === 'max') toggleMaximize(id);
    });
  });
  titlebar.addEventListener('dblclick', (e) => { if (!e.target.closest('.tl')) toggleMaximize(id); });
  titlebar.addEventListener('pointerdown', (e) => { if (!e.target.closest('.tl')) startDrag(e, win); });
  elw.addEventListener('pointerdown', () => focusWindow(id));

  // Right-click on the titlebar: window controls.
  bindContextMenu(titlebar, () => [
    { label: 'Minimize', sh: '⌘M', act: () => minimizeWindow(id) },
    { label: win.maximized ? 'Restore' : 'Zoom', disabled: win.fixed, act: () => toggleMaximize(id) },
    { sep: true },
    { label: 'Move Window to Center', act: () => centerWindow(id) },
    { sep: true },
    { label: 'Close Window', sh: '⌘W', act: () => closeWindow(id) },
  ]);

  focusWindow(id);
  emit('os:open', { appId: app.id, winId: id });
  setTimeout(() => elw.classList.remove('opening'), 280);
  return win;
}

export function focusWindow(id) {
  const win = OS.windows.get(id);
  if (!win) return;
  if (OS.activeWinId === id && win.el.style.zIndex == OS.zCounter) {
    // already top; still ensure active styling
  }
  OS.windows.forEach((w) => w.el.classList.toggle('active', w.id === id));
  win.el.style.zIndex = nextZ();
  OS.activeWinId = id;
  emit('os:focus', { appId: win.appId, winId: id });
}

export function closeWindow(id) {
  const win = OS.windows.get(id);
  if (!win) return;
  win.el.classList.add('closing');
  const appId = win.appId;
  setTimeout(() => {
    win.el.remove();
    OS.windows.delete(id);
    emit('os:close', { appId, winId: id });
    focusTopMost();
  }, 170);
}

export function minimizeWindow(id) {
  const win = OS.windows.get(id);
  if (!win || win.minimized) return;
  win.minimized = true;
  win.el.classList.add('minimizing');
  setTimeout(() => { win.el.style.display = 'none'; win.el.classList.remove('minimizing'); }, 280);
  emit('os:minimize', { appId: win.appId, winId: id });
  focusTopMost(id);
}

function unminimize(win) {
  win.minimized = false;
  win.el.style.display = 'flex';
  win.el.classList.add('opening');
  setTimeout(() => win.el.classList.remove('opening'), 280);
  emit('os:restore', { appId: win.appId, winId: win.id });
}

export function toggleMaximize(id) {
  const win = OS.windows.get(id);
  if (!win || win.fixed) return;
  if (win.maximized) {
    const p = win.prev;
    Object.assign(win.el.style, { left: p.x + 'px', top: p.y + 'px', width: p.w + 'px', height: p.h + 'px' });
    win.el.classList.remove('maximized');
    win.maximized = false;
  } else {
    win.prev = { x: parseInt(win.el.style.left), y: parseInt(win.el.style.top), w: win.el.offsetWidth, h: win.el.offsetHeight };
    Object.assign(win.el.style, { left: '0px', top: MENUBAR_H + 'px', width: window.innerWidth + 'px', height: (window.innerHeight - MENUBAR_H) + 'px' });
    win.el.classList.add('maximized');
    win.maximized = true;
  }
  focusWindow(id);
}

function focusTopMost(exclude) {
  let top = null, topZ = -1;
  OS.windows.forEach((w) => {
    if (w.id === exclude || w.minimized) return;
    const z = parseInt(w.el.style.zIndex) || 0;
    if (z > topZ) { topZ = z; top = w; }
  });
  if (top) focusWindow(top.id);
  else { OS.activeWinId = null; emit('os:focus', { appId: 'finder', winId: null }); }
}

/* ---- Dragging ---- */
function startDrag(e, win) {
  if (win.maximized) toggleMaximize(win.id);
  focusWindow(win.id);
  const startX = e.clientX, startY = e.clientY;
  const origX = parseInt(win.el.style.left), origY = parseInt(win.el.style.top);
  win.el.classList.add('dragging');
  document.body.style.cursor = 'default';

  function move(ev) {
    let nx = origX + (ev.clientX - startX);
    let ny = origY + (ev.clientY - startY);
    nx = Math.max(-win.el.offsetWidth + 80, Math.min(nx, window.innerWidth - 80));
    ny = Math.max(MENUBAR_H, Math.min(ny, window.innerHeight - 36));
    win.el.style.left = nx + 'px';
    win.el.style.top = ny + 'px';
  }
  function up() {
    win.el.classList.remove('dragging');
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
  }
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

/* ---- Resizing ---- */
function startResize(e, win, dir) {
  e.preventDefault();
  e.stopPropagation();
  focusWindow(win.id);
  const startX = e.clientX, startY = e.clientY;
  const ox = parseInt(win.el.style.left), oy = parseInt(win.el.style.top);
  const ow = win.el.offsetWidth, oh = win.el.offsetHeight;
  const minW = 300, minH = 180;
  win.el.classList.add('resizing');

  function move(ev) {
    const dx = ev.clientX - startX, dy = ev.clientY - startY;
    let nx = ox, ny = oy, nw = ow, nh = oh;
    if (dir.includes('e')) nw = Math.max(minW, ow + dx);
    if (dir.includes('s')) nh = Math.max(minH, oh + dy);
    if (dir.includes('w')) { nw = Math.max(minW, ow - dx); nx = ox + (ow - nw); }
    if (dir.includes('n')) { nh = Math.max(minH, oh - dy); ny = oy + (oh - nh); if (ny < MENUBAR_H) { nh -= (MENUBAR_H - ny); ny = MENUBAR_H; } }
    Object.assign(win.el.style, { left: nx + 'px', top: ny + 'px', width: nw + 'px', height: nh + 'px' });
  }
  function up() {
    win.el.classList.remove('resizing');
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
  }
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

export function centerWindow(id) {
  const win = OS.windows.get(id);
  if (!win) return;
  if (win.maximized) toggleMaximize(id);
  const w = win.el.offsetWidth, h = win.el.offsetHeight;
  const x = Math.max(8, Math.round((window.innerWidth - w) / 2));
  const y = Math.max(MENUBAR_H + 6, Math.round((window.innerHeight - h) / 2));
  win.el.style.left = x + 'px';
  win.el.style.top = y + 'px';
  focusWindow(id);
}

export function minimizeActive() { if (OS.activeWinId) minimizeWindow(OS.activeWinId); }
export function closeActive() { if (OS.activeWinId) closeWindow(OS.activeWinId); }
// Quit: close every window belonging to the active app.
export function quitActive() {
  const active = OS.activeWinId ? OS.windows.get(OS.activeWinId) : null;
  if (!active) return;
  windowsOf(active.appId).forEach((w) => closeWindow(w.id));
}
