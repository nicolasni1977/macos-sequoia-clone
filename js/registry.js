// registry.js — THE app-module plugin API.
// One clear way to register an app. Registering an app automatically makes it
// available to the Dock (if dock:true), Launchpad and Spotlight, and lets the
// window manager open a managed window whose body the app renders into.

const apps = new Map();          // id -> appDef
const listeners = new Set();     // notified when the registry changes

// Normalize a raw app definition into a complete record with defaults.
function normalize(def) {
  if (!def || typeof def !== 'object') throw new Error('registerApp: definition required');
  if (!def.id) throw new Error('registerApp: app.id required');
  if (typeof def.mount !== 'function') throw new Error(`registerApp(${def.id}): mount() required`);
  return {
    id: def.id,
    title: def.title || def.id,
    icon: def.icon || '■',          // emoji/text glyph
    width: def.width || 720,
    height: def.height || 480,
    minWidth: def.minWidth || 320,
    minHeight: def.minHeight || 220,
    dock: def.dock !== false,            // default true: shows in dock
    showInLaunchpad: def.showInLaunchpad !== false,
    showInSpotlight: def.showInSpotlight !== false,
    keywords: def.keywords || [],        // extra spotlight search terms
    singleton: def.singleton !== false,  // default: one window per app
    resizable: def.resizable !== false,
    menus: def.menus || null,            // app-specific menu structure (see contract)
    quickLook: def.quickLook || null,    // optional (item) => html string
    mount: def.mount,
    onFocus: def.onFocus || null,
    onClose: def.onClose || null,
  };
}

// PUBLIC: register an app. Idempotent by id (re-register replaces).
export function registerApp(def) {
  const app = normalize(def);
  apps.set(app.id, app);
  emit();
  return app;
}

export function getApp(id) {
  return apps.get(id);
}

export function allApps() {
  return [...apps.values()];
}

export function dockApps() {
  return [...apps.values()].filter(a => a.dock);
}

export function launchpadApps() {
  return [...apps.values()].filter(a => a.showInLaunchpad);
}

export function spotlightApps() {
  return [...apps.values()].filter(a => a.showInSpotlight);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of listeners) {
    try { l(allApps()); } catch (e) { /* keep others alive */ }
  }
}
