// Shell services: appearance (light/dark), wallpaper presets, generic settings,
// namespaced per-app storage, dock size, and stacked toast notifications.
// These power the extended `api` passed to every app's content(win, api).
import { el } from './dom.js';
import { emit } from './state.js';

/* =========================================================
   localStorage helpers (safe, namespaced)
   ========================================================= */
const LS_PREFIX = 'macclone:';

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function lsSet(key, val) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch { /* quota / private mode */ }
}

// Per-app namespaced store/load (used by api.store / api.load).
export function appStore(appId, key, val) { lsSet('app:' + appId + ':' + key, val); }
export function appLoad(appId, key, fallback) { return lsGet('app:' + appId + ':' + key, fallback); }

/* =========================================================
   Generic settings bag (used by api.getSetting / api.setSetting)
   ========================================================= */
export function getSetting(key, fallback) { return lsGet('setting:' + key, fallback); }
export function setSetting(key, val) {
  lsSet('setting:' + key, val);
  emit('os:setting', { key, val });
}

/* =========================================================
   Appearance: light / dark — toggles class "dark" on <html>
   ========================================================= */
export function getAppearance() {
  return lsGet('appearance', 'light') === 'dark' ? 'dark' : 'light';
}
export function setAppearance(mode) {
  const dark = mode === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  lsSet('appearance', dark ? 'dark' : 'light');
  emit('os:appearance', { mode: dark ? 'dark' : 'light' });
}
export function theme() { return getAppearance(); } // convenience for api.theme()

/* =========================================================
   Wallpaper presets (pure CSS gradients — no external images) + setter
   ========================================================= */
export const WALLPAPERS = [
  { id: 'sequoia',  name: 'Sequoia Sunrise', dark: false, css: 'linear-gradient(160deg,#1b2a6b 0%,#3b2a8c 28%,#7d3aa8 52%,#c0468f 72%,#e98a5b 100%)' },
  { id: 'aurora',   name: 'Aurora',          dark: true,  css: 'linear-gradient(160deg,#0b1437 0%,#15357a 35%,#1f7a8c 70%,#34d0c0 100%)' },
  { id: 'dune',     name: 'Dune',            dark: false, css: 'linear-gradient(160deg,#3a1c1c 0%,#8a3b2e 40%,#d96f3a 70%,#f2c14e 100%)' },
  { id: 'twilight', name: 'Twilight',        dark: true,  css: 'linear-gradient(160deg,#10052b 0%,#3a0f6b 40%,#7a1f9c 70%,#d14fa6 100%)' },
  { id: 'meadow',   name: 'Meadow',          dark: false, css: 'linear-gradient(160deg,#0a3d2e 0%,#1f7a4d 40%,#6fbf5a 75%,#d6e85a 100%)' },
  { id: 'graphite', name: 'Graphite',        dark: true,  css: 'linear-gradient(160deg,#1a1c20 0%,#2c2f36 45%,#454a54 75%,#6b7280 100%)' },
];

// The app theme follows the wallpaper (dark wallpapers → dark UI).
export function wallpaperIsDark(css) {
  const wp = WALLPAPERS.find((w) => w.css === css);
  return wp ? !!wp.dark : false;
}

// Default boot wallpaper: Graphite.
const DEFAULT_WALLPAPER = (WALLPAPERS.find((w) => w.id === 'graphite') || WALLPAPERS[0]).css;
export function getWallpaper() { return lsGet('wallpaper', DEFAULT_WALLPAPER); }
export function setWallpaper(css) {
  const wp = document.querySelector('.wallpaper');
  if (wp) wp.style.background = css;
  lsSet('wallpaper', css);
  setAppearance(wallpaperIsDark(css) ? 'dark' : 'light');
  emit('os:wallpaper', { css });
}

/* =========================================================
   Dock size — drives the --dock-base CSS custom property.
   dock.js reads this var when (re)building the dock.
   ========================================================= */
export function getDockSize() { return parseInt(getSetting('dockSize', 56), 10) || 56; }
export function setDockSize(px) {
  const n = Math.max(36, Math.min(80, Math.round(px)));
  document.documentElement.style.setProperty('--dock-base', n + 'px');
  setSetting('dockSize', n);
  emit('os:dock-size', { px: n });
}

/* =========================================================
   Toasts: stacked, top-right, auto-dismissing notifications
   ========================================================= */
let toastHost = null;
function ensureToastHost() {
  if (toastHost && document.body.contains(toastHost)) return toastHost;
  toastHost = document.getElementById('toast-host') || el('toast-host');
  toastHost.id = 'toast-host';
  if (!toastHost.parentNode) document.body.append(toastHost);
  return toastHost;
}
export function toast(msg, opts = {}) {
  const host = ensureToastHost();
  const t = el('toast');
  t.textContent = String(msg);
  host.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  const dismiss = () => {
    if (t.dataset.gone) return;
    t.dataset.gone = '1';
    t.classList.remove('show');
    t.classList.add('hide');
    setTimeout(() => t.remove(), 260);
  };
  t.addEventListener('click', dismiss);
  setTimeout(dismiss, opts.duration || 2600);
  return dismiss;
}

/* =========================================================
   Boot: apply persisted appearance + wallpaper + dock size.
   ========================================================= */
export function initShell() {
  const wpCss = getWallpaper();
  const wp = document.querySelector('.wallpaper');
  if (wp) wp.style.background = wpCss;
  // Appearance inherits the wallpaper theme (Graphite default → dark).
  setAppearance(wallpaperIsDark(wpCss) ? 'dark' : 'light');
  document.documentElement.style.setProperty('--dock-base', getDockSize() + 'px');
}
