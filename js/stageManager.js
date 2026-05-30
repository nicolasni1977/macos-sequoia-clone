// Stage Manager: when on, shows recent-app thumbnail cards down the left edge
// and centers the focused window. Toggling off restores. State is persisted via
// the shell settings bag and toggled from Control Center (or a key).
import { OS, on, emit, windowsOf } from './state.js';
import { focusWindow, centerWindow } from './windowManager.js';
import { getSetting, setSetting } from './shell.js';
import { APP_MAP } from './apps.js';

const strip = document.getElementById('stage-strip');
let enabled = false;
const mru = []; // most-recently-focused app ids

export function initStageManager() {
  enabled = !!getSetting('stageManager', false);

  on('os:toggle-stage', () => setStage(!enabled));
  on('os:set-stage', (e) => setStage(!!(e.detail && e.detail.on)));

  // Track recency + keep the strip fresh as windows come and go.
  ['os:focus', 'os:open'].forEach((evt) => on(evt, (e) => {
    const id = e.detail && e.detail.appId;
    if (id) {
      const i = mru.indexOf(id);
      if (i !== -1) mru.splice(i, 1);
      mru.unshift(id);
    }
    if (enabled) { refresh(); centerActive(); }
  }));
  ['os:close', 'os:minimize', 'os:restore'].forEach((evt) => on(evt, () => { if (enabled) refresh(); }));

  // Apply persisted state on boot (after the first window opens).
  if (enabled) setStage(true, true);
}

export function isStageOn() { return enabled; }

function setStage(on, silent) {
  enabled = on;
  setSetting('stageManager', on);
  document.body.classList.toggle('stage-on', on);
  strip.classList.toggle('hidden', !on);
  if (on) { refresh(); centerActive(); }
  emit('os:stage-changed', { on });
}

function centerActive() {
  if (OS.activeWinId) centerWindow(OS.activeWinId);
}

// Build cards for every running app except the one currently focused.
function refresh() {
  if (!enabled) return;
  const active = OS.activeWinId ? OS.windows.get(OS.activeWinId) : null;
  const activeApp = active ? active.appId : null;

  // Distinct running apps in recency order.
  const running = new Set([...OS.windows.values()].map((w) => w.appId));
  const orderedApps = [];
  mru.forEach((id) => { if (running.has(id) && !orderedApps.includes(id)) orderedApps.push(id); });
  running.forEach((id) => { if (!orderedApps.includes(id)) orderedApps.push(id); });

  strip.innerHTML = '';
  orderedApps.filter((id) => id !== activeApp).forEach((id) => {
    const app = APP_MAP[id] || { name: id, glyph: '📦' };
    const card = document.createElement('div');
    card.className = 'stage-card';
    card.innerHTML = `
      <div class="stage-card-bar">
        <span class="dot" style="background:var(--tl-red)"></span>
        <span class="dot" style="background:var(--tl-yellow)"></span>
        <span class="dot" style="background:var(--tl-green)"></span>
      </div>
      <div class="stage-card-body">
        <span class="stage-card-glyph">${app.glyph}</span>
        <span class="stage-card-name">${app.name}</span>
      </div>`;
    card.addEventListener('click', () => {
      const win = windowsOf(id)[0];
      if (win) {
        if (win.minimized) emit('os:restore', { appId: id, winId: win.id });
        win.el.style.display = 'flex';
        win.minimized = false;
        focusWindow(win.id);
      }
    });
    strip.append(card);
  });
}
