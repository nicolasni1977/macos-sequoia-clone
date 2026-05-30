// Central runtime state + tiny event bus.
export const OS = {
  windows: new Map(),   // winId -> win object
  zCounter: 100,
  activeWinId: null,
  winSeq: 0,
};

const target = document.createElement('div');

export function emit(name, detail) {
  target.dispatchEvent(new CustomEvent(name, { detail }));
}
export function on(name, handler) {
  target.addEventListener(name, handler);
}

export function nextZ() {
  OS.zCounter += 1;
  return OS.zCounter;
}

export function windowsOf(appId) {
  return [...OS.windows.values()].filter((w) => w.appId === appId);
}

export function runningAppIds() {
  const ids = new Set();
  OS.windows.forEach((w) => ids.add(w.appId));
  return ids;
}
