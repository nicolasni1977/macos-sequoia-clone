// Menu-bar Battery and Wi-Fi dropdown panels, each anchored under its status
// icon. These replace the earlier behaviour where the icons opened Control
// Center: the battery icon now shows a battery panel, the Wi-Fi icon a Wi-Fi
// panel with a toggle + network list.
import { emit } from './state.js';
import { getSetting, setSetting } from './shell.js';
import { openApp } from './windowManager.js';

let openId = null;

const OTHER_NETWORKS = [
  { name: 'CoffeeBar Guest', bars: 2, secure: false },
  { name: 'Nexus-5G', bars: 3, secure: true },
  { name: 'Apartment 4B', bars: 1, secure: true },
  { name: 'xfinitywifi', bars: 2, secure: false },
];

function bars(n) {
  let s = '<span class="sp-bars">';
  for (let i = 1; i <= 4; i++) s += `<i class="${i <= n ? 'on' : ''}"></i>`;
  return s + '</span>';
}

function panelEl(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'status-panel hidden';
    document.body.append(el);
  }
  return el;
}

/* ---------------- Battery ---------------- */
function buildBattery(el) {
  const pct = 82;
  el.innerHTML = `
    <div class="sp-title">Battery</div>
    <div class="sp-batt">
      <div class="sp-batt-bar"><span style="width:${pct}%"></span></div>
      <span class="sp-pct">${pct}%</span>
    </div>
    <div class="sp-sub">Power Source: Battery</div>
    <div class="sp-divider"></div>
    <div class="sp-label">Using Significant Energy</div>
    <div class="sp-muted">No Apps Using Significant Energy</div>
    <div class="sp-divider"></div>
    <div class="sp-link" data-settings>Battery Settings…</div>`;
  el.querySelector('[data-settings]').addEventListener('click', () => { close(); openApp('settings'); });
}

/* ---------------- Wi-Fi ---------------- */
function buildWifi(el) {
  const on = getSetting('cc:wifi', true);
  const current = getSetting('wifi:network', 'Home Network');
  el.innerHTML = `
    <div class="sp-title-row">
      <span class="sp-title">Wi-Fi</span>
      <span class="sp-switch${on ? ' on' : ''}" data-toggle role="switch" aria-checked="${on}"></span>
    </div>
    <div class="sp-wifi-on" ${on ? '' : 'hidden'}>
      <div class="sp-label">Known Network</div>
      <div class="sp-net current">
        <span class="sp-check">✓</span>
        <span class="sp-net-name">${current}</span>
        <span class="sp-net-meta">${'🔒'} ${bars(3)}</span>
      </div>
      <div class="sp-divider"></div>
      <div class="sp-label">Other Networks</div>
      <div class="sp-net-list"></div>
      <div class="sp-divider"></div>
      <div class="sp-link" data-settings>Wi-Fi Settings…</div>
    </div>
    <div class="sp-wifi-off" ${on ? 'hidden' : ''}>
      <div class="sp-muted">Wi-Fi is turned off.</div>
    </div>`;

  el.querySelector('[data-toggle]').addEventListener('click', (e) => {
    e.stopPropagation();
    setSetting('cc:wifi', !getSetting('cc:wifi', true));
    buildWifi(el);
  });

  const list = el.querySelector('.sp-net-list');
  if (list) {
    OTHER_NETWORKS.forEach((nw) => {
      const row = document.createElement('div');
      row.className = 'sp-net';
      row.innerHTML = `<span class="sp-check"></span><span class="sp-net-name">${nw.name}</span>`
        + `<span class="sp-net-meta">${nw.secure ? '🔒 ' : ''}${bars(nw.bars)}</span>`;
      row.addEventListener('click', () => {
        setSetting('wifi:network', nw.name);
        setSetting('cc:wifi', true);
        emit('os:toast', { msg: 'Connected to “' + nw.name + '”' });
        buildWifi(el);
      });
      list.append(row);
    });
  }
  const set = el.querySelector('[data-settings]');
  if (set) set.addEventListener('click', () => { close(); openApp('settings'); });
}

const PANELS = {
  battery: { id: 'battery-center', btnId: 'status-battery', build: buildBattery },
  wifi: { id: 'wifi-center', btnId: 'status-wifi', build: buildWifi },
};

function open(key) {
  close();
  const { id, btnId, build } = PANELS[key];
  const el = panelEl(id);
  build(el);
  const btn = document.getElementById(btnId);
  const r = btn.getBoundingClientRect();
  // Right-align the panel under its icon, clamped to the viewport.
  el.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  btn.classList.add('active');
  openId = key;
}

function close() {
  if (!openId) return;
  const { id, btnId } = PANELS[openId];
  const el = document.getElementById(id);
  const btn = document.getElementById(btnId);
  if (el) { el.classList.remove('show'); setTimeout(() => el.classList.add('hidden'), 160); }
  if (btn) btn.classList.remove('active');
  openId = null;
}

function toggle(key) { openId === key ? close() : open(key); }

export function initStatusMenus() {
  Object.entries(PANELS).forEach(([key, { btnId }]) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(key); });
  });
  document.addEventListener('mousedown', (e) => {
    if (!openId) return;
    const { id, btnId } = PANELS[openId];
    if (!e.target.closest('#' + id) && !e.target.closest('#' + btnId)) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openId) close(); });
}
