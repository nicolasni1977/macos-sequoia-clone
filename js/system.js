// System-level actions wired from the Apple menu:
// About This Mac, Sleep, Restart, Shut Down, Lock Screen.
import { emit } from './state.js';
import { playRestartSound, playShutdownSound, replayStartupChime } from './sound.js';

let layer = null;

function ensureLayer() {
  if (layer) return layer;
  layer = document.createElement('div');
  layer.id = 'system-layer';
  document.body.append(layer);
  return layer;
}

/* ---------- About This Mac ---------- */
export function aboutThisMac() {
  const host = ensureLayer();
  // Reuse a single about sheet.
  const existing = host.querySelector('.about-mac-backdrop');
  if (existing) { existing.remove(); }

  const backdrop = document.createElement('div');
  backdrop.className = 'about-mac-backdrop';
  const sheet = document.createElement('div');
  sheet.className = 'about-mac';
  sheet.innerHTML = `
    <button class="about-close" title="Close">×</button>
    <div class="about-logo"></div>
    <div class="about-os">macOS Sequoia</div>
    <div class="about-ver">Version 15.0 — Web Clone</div>
    <div class="about-specs">
      <div class="about-row"><span>MacBook Pro</span><span>14-inch, 2024</span></div>
      <div class="about-row"><span>Chip</span><span>Apple Silicon (emulated)</span></div>
      <div class="about-row"><span>Memory</span><span>16 GB</span></div>
      <div class="about-row"><span>Startup Disk</span><span>Macintosh HD</span></div>
      <div class="about-row"><span>Serial Number</span><span>C0FFEE2026</span></div>
    </div>
    <div class="about-actions">
      <button class="about-btn" data-act="more">More Info…</button>
    </div>`;
  backdrop.append(sheet);
  host.append(backdrop);

  const close = () => backdrop.remove();
  sheet.querySelector('.about-close').addEventListener('click', close);
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  sheet.querySelector('[data-act="more"]').addEventListener('click', () => {
    close();
    import('./windowManager.js').then(({ openApp }) => openApp('sysinfo'));
  });
  const onEsc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
  document.addEventListener('keydown', onEsc);
}

/* ---------- Sleep (dim until click/key) ---------- */
export function sleep() {
  const host = ensureLayer();
  if (host.querySelector('.sleep-overlay')) return;
  const ov = document.createElement('div');
  ov.className = 'sleep-overlay';
  host.append(ov);
  requestAnimationFrame(() => ov.classList.add('on'));
  const wake = () => {
    ov.classList.remove('on');
    setTimeout(() => ov.remove(), 400);
    document.removeEventListener('keydown', wake);
  };
  // Delay listeners so the click that closed the menu doesn't immediately wake.
  setTimeout(() => {
    ov.addEventListener('mousedown', wake);
    document.addEventListener('keydown', wake);
  }, 150);
}

/* ---------- Lock Screen ---------- */
export function lockScreen() {
  const host = ensureLayer();
  if (host.querySelector('.lock-overlay')) return;
  const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const ov = document.createElement('div');
  ov.className = 'lock-overlay';
  ov.innerHTML = `
    <div class="lock-clock">
      <div class="lock-date">${date}</div>
      <div class="lock-time">${time}</div>
    </div>
    <div class="lock-user">
      <div class="lock-avatar">🦊</div>
      <div class="lock-name">Guest User</div>
      <form class="lock-form">
        <input class="lock-input" type="password" placeholder="Enter Password" autocomplete="off" />
        <div class="lock-hint">Press Enter or click to unlock</div>
      </form>
    </div>`;
  host.append(ov);
  requestAnimationFrame(() => ov.classList.add('on'));

  const unlock = () => {
    ov.classList.remove('on');
    setTimeout(() => ov.remove(), 450);
  };
  ov.querySelector('.lock-form').addEventListener('submit', (e) => { e.preventDefault(); unlock(); });
  // Clicking the clock area also unlocks (classic behavior).
  ov.querySelector('.lock-clock').addEventListener('click', unlock);
  setTimeout(() => ov.querySelector('.lock-input').focus(), 200);
}

/* ---------- Restart / Shut Down ---------- */
export function restart() { confirmAction('Restart', 'Are you sure you want to restart your computer now?', () => { playRestartSound(); reboot('Restarting…'); }); }
export function shutDown() { confirmAction('Shut Down', 'Are you sure you want to shut down your computer now?', () => { playShutdownSound(); reboot('Shutting Down…', true); }); }

function confirmAction(title, message, onConfirm) {
  const host = ensureLayer();
  const backdrop = document.createElement('div');
  backdrop.className = 'sys-confirm-backdrop';
  const box = document.createElement('div');
  box.className = 'sys-confirm';
  box.innerHTML = `
    <div class="sys-confirm-logo"></div>
    <div class="sys-confirm-msg">${message}</div>
    <div class="sys-confirm-actions">
      <button class="sys-btn" data-act="cancel">Cancel</button>
      <button class="sys-btn primary" data-act="ok">${title}</button>
    </div>`;
  backdrop.append(box);
  host.append(backdrop);
  const close = () => backdrop.remove();
  box.querySelector('[data-act="cancel"]').addEventListener('click', close);
  box.querySelector('[data-act="ok"]').addEventListener('click', () => { close(); onConfirm(); });
}

function reboot(label, stayOff = false) {
  const host = ensureLayer();
  const screen = document.createElement('div');
  screen.className = 'reboot-screen';
  screen.innerHTML = `<div class="boot-logo"></div>
    <div class="reboot-label">${label}</div>
    <div class="boot-progress"><div class="boot-progress-bar"></div></div>`;
  host.append(screen);

  // Close every window so the desktop re-boots clean.
  import('./state.js').then(({ OS }) => {
    OS.windows.forEach((w) => { w.el.remove(); });
    OS.windows.clear();
    OS.activeWinId = null;
    emit('os:close', { appId: 'finder', winId: null });
  });

  if (stayOff) {
    // Shut Down: linger on a dark screen, then offer to power back on.
    setTimeout(() => {
      screen.innerHTML = `<div class="reboot-power">⏻</div><div class="reboot-label">Click to power on</div>`;
      screen.classList.add('powered-off');
      screen.addEventListener('click', () => { screen.remove(); rebootFinish(); });
    }, 1600);
    return;
  }
  setTimeout(() => { screen.remove(); rebootFinish(); }, 2200);
}

function rebootFinish() {
  replayStartupChime();
  import('./windowManager.js').then(({ openApp }) => openApp('finder'));
}
