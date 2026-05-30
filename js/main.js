// Boot sequence + global wiring.
import { buildDock } from './dock.js';
import { initMenubar } from './menubar.js';
import { initSpotlight, close as closeSpotlight } from './spotlight.js';
import { initLaunchpad, close as closeLaunchpad } from './launchpad.js';
import {
  openApp, minimizeActive, closeActive, quitActive,
} from './windowManager.js';
import { emit, on, OS } from './state.js';
import { initShell, toast } from './shell.js';
import { initContextMenu, showContextMenu, bindContextMenu, hideContextMenu } from './contextmenu.js';
import { initMissionControl, close as closeMissionControl, isMissionControlOpen } from './missionControl.js';
import { initStageManager } from './stageManager.js';
import { initAppSwitcher } from './appSwitcher.js';
import { initControlCenter, applyPersistedBrightness } from './controlCenter.js';
import { initStatusMenus } from './statusMenus.js';
import { initNotificationCenter } from './notificationCenter.js';
import { initQuickLook, close as closeQuickLook } from './quickLook.js';
import { playStartupChime } from './sound.js';
import { iconHTML, injectIconDefs } from './icons.js';

function buildDesktopIcons() {
  const host = document.getElementById('desktop-icons');
  const openFinderAt = (path) => { openApp('finder'); emit('os:finder-navigate', { path }); };
  const icons = [
    { icon: 'machd', glyph: '💽', name: 'Macintosh HD', kind: 'Volume', open: () => openFinderAt([]) },
    { icon: 'chess', glyph: '♞', name: 'Chess', kind: 'Application', open: () => openApp('chess') },
    { icon: 'halcyon', glyph: '🎧', name: 'iPod', kind: 'Application', open: () => openApp('halcyon') },
  ];
  icons.forEach((ic) => {
    const d = document.createElement('div');
    d.className = 'desktop-icon';
    d.setAttribute('data-quicklook', JSON.stringify({
      type: 'info', title: ic.name, glyph: ic.glyph, name: ic.name,
      rows: [['Kind', ic.kind], ['Where', 'Desktop']],
    }));
    d.innerHTML = `<div class="di-glyph">${iconHTML(ic.icon, ic.name)}</div><span>${ic.name}</span>`;
    d.addEventListener('click', () => {
      host.querySelectorAll('.desktop-icon.ql-selected').forEach((x) => x.classList.remove('ql-selected'));
      d.classList.add('ql-selected');
    });
    d.addEventListener('dblclick', () => ic.open());
    // Touch: a single tap opens (double-tap is awkward on phones).
    d.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') ic.open(); });
    bindContextMenu(d, () => [
      { label: 'Open', act: () => ic.open() },
      { label: 'Get Info', sh: '⌘I', act: () => toast(`${ic.name}`) },
      { sep: true },
      { label: 'Rename', disabled: true },
      ...(ic.kind === 'Trash' ? [{ sep: true }, { label: 'Empty Trash', danger: true, act: () => emit('os:empty-trash') }] : []),
    ]);
    host.append(d);
  });
}

// Right-click on the empty desktop / wallpaper.
function wireDesktopContextMenu() {
  const desktop = document.getElementById('desktop');
  desktop.addEventListener('contextmenu', (e) => {
    // Only the bare desktop — let windows, dock, icons handle their own.
    if (e.target.closest('.window') || e.target.closest('#dock-container')
      || e.target.closest('.desktop-icon') || e.target.closest('#menubar')) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Folder', sh: '⇧⌘N', act: () => toast('New Folder created on Desktop') },
      { label: 'Get Info', act: () => toast('Desktop — macOS Sequoia (Web Clone)') },
      { sep: true },
      { label: 'Change Wallpaper…', act: () => openApp('settings') },
      { sep: true },
      { label: 'Use Stacks', act: () => toast('Stacks enabled') },
      { label: 'Sort By', disabled: true },
      { label: 'Clean Up', act: () => toast('Desktop cleaned up') },
      { label: 'Show View Options', disabled: true },
    ]);
  });
}

// Empty Trash, triggered from the Dock or desktop Trash icon.
function wireTrash() {
  on('os:empty-trash', () => {
    toast('Trash emptied', { duration: 1800 });
    // Reflect in any open Trash window.
    OS.windows.forEach((w) => {
      if (w.appId === 'trash') {
        const p = w.body.querySelector('p');
        if (p) p.textContent = 'The Trash is empty.';
      }
    });
  });
}

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key.toLowerCase();

    // Spotlight: Cmd/Ctrl + Space
    if (mod && e.code === 'Space') { e.preventDefault(); emit('os:toggle-spotlight'); return; }
    // Launchpad: F4
    if (e.key === 'F4') { e.preventDefault(); emit('os:toggle-launchpad'); return; }
    // Mission Control: F3 or Ctrl + ArrowUp
    if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) { e.preventDefault(); emit('os:toggle-mission-control'); return; }
    // Stage Manager toggle: Cmd/Ctrl + Shift + S (also toggled from Control Center).
    if (mod && e.shiftKey && k === 's') { e.preventDefault(); emit('os:toggle-stage'); return; }

    if (mod) {
      // Minimize: Cmd/Ctrl + M
      if (k === 'm') { e.preventDefault(); minimizeActive(); return; }
      // Hide (treated as minimize): Cmd/Ctrl + H
      if (k === 'h') { e.preventDefault(); minimizeActive(); return; }
      // Close active window: Cmd/Ctrl + W
      if (k === 'w') { e.preventDefault(); closeActive(); return; }
      // Quit active app (close all its windows): Cmd/Ctrl + Q
      if (k === 'q') { e.preventDefault(); quitActive(); return; }
      // New: Cmd/Ctrl + N — let the focused app react.
      if (k === 'n') {
        e.preventDefault();
        if (OS.activeWinId) {
          const w = OS.windows.get(OS.activeWinId);
          emit('app:new', { appId: w ? w.appId : null, winId: OS.activeWinId });
          if (w) openApp(w.appId);
        }
        return;
      }
    }

    // Escape closes overlays / context menus
    if (e.key === 'Escape') { closeSpotlight(); closeLaunchpad(); hideContextMenu(); closeMissionControl(); closeQuickLook(); }
  });
}

function boot() {
  // Apply persisted appearance (light/dark), wallpaper, and Dock size before
  // painting the chrome (the dock reads --dock-base when it builds).
  initShell();
  injectIconDefs();
  playStartupChime();

  initContextMenu();
  buildDock();
  initMenubar();
  initSpotlight();
  initLaunchpad();
  initMissionControl();
  initStageManager();
  initAppSwitcher();
  initControlCenter();
  initStatusMenus();
  initNotificationCenter();
  initQuickLook();
  applyPersistedBrightness();
  buildDesktopIcons();
  wireDesktopContextMenu();
  wireTrash();
  wireKeyboard();

  // Bridge: let any module raise a toast via the OS bus.
  on('os:toast', (e) => toast((e.detail && e.detail.msg) || ''));

  // Fade the boot screen, then open a Finder window for a lived-in desktop.
  const bootScreen = document.getElementById('boot-screen');
  setTimeout(() => {
    bootScreen.classList.add('fade');
    setTimeout(() => bootScreen.remove(), 650);
    // Desktop boots into Finder; phones boot straight into the iPod app.
    if (window.innerWidth > 640) openApp('finder');
    else openApp('halcyon');
  }, 1700);

  // Only close overlays on a real width change (orientation / window resize),
  // NOT the height change from a mobile soft keyboard opening — that was
  // closing Spotlight the instant its input focused on phones.
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) > 80) { closeSpotlight(); closeLaunchpad(); }
    lastW = window.innerWidth;
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
