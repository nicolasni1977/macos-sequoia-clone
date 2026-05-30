// Reusable contextual (right-click) menu, macOS style.
// Usage: showContextMenu(x, y, items)
//   items: array of { label, sh?, act?, disabled?, danger? } or { sep: true }
// Exposed to apps via api.contextMenu(items, ev).

let menuEl = null;
let onDismiss = null;

function ensureEl() {
  if (menuEl) return menuEl;
  menuEl = document.createElement('div');
  menuEl.id = 'context-menu';
  menuEl.className = 'context-menu hidden';
  document.body.append(menuEl);
  return menuEl;
}

export function hideContextMenu() {
  if (!menuEl) return;
  menuEl.classList.add('hidden');
  menuEl.innerHTML = '';
  if (onDismiss) { const fn = onDismiss; onDismiss = null; fn(); }
}

export function showContextMenu(x, y, items, opts = {}) {
  const elc = ensureEl();
  elc.innerHTML = '';
  onDismiss = opts.onDismiss || null;

  (items || []).forEach((it) => {
    if (!it) return;
    if (it.sep) {
      const s = document.createElement('div');
      s.className = 'ctx-sep';
      elc.append(s);
      return;
    }
    const row = document.createElement('div');
    row.className = 'ctx-row'
      + (it.disabled ? ' disabled' : '')
      + (it.danger ? ' danger' : '');
    const label = document.createElement('span');
    label.className = 'ctx-label';
    label.textContent = it.label;
    row.append(label);
    if (it.sh) {
      const sh = document.createElement('span');
      sh.className = 'ctx-shortcut';
      sh.textContent = it.sh;
      row.append(sh);
    }
    if (!it.disabled) {
      row.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        hideContextMenu();
        if (typeof it.act === 'function') it.act();
      });
    }
    elc.append(row);
  });

  // Show off-screen first to measure, then clamp into the viewport.
  elc.style.left = '-9999px';
  elc.style.top = '-9999px';
  elc.classList.remove('hidden');

  const rect = elc.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  let px = x, py = y;
  if (px + rect.width > vw - 6) px = Math.max(6, vw - rect.width - 6);
  if (py + rect.height > vh - 6) py = Math.max(6, vh - rect.height - 6);
  elc.style.left = px + 'px';
  elc.style.top = py + 'px';
}

// Global dismissal wiring (installed once).
let wired = false;
export function initContextMenu() {
  if (wired) return;
  wired = true;
  document.addEventListener('mousedown', (e) => {
    if (menuEl && !menuEl.classList.contains('hidden') && !e.target.closest('#context-menu')) {
      hideContextMenu();
    }
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuEl && !menuEl.classList.contains('hidden')) {
      hideContextMenu();
    }
  });
  window.addEventListener('blur', hideContextMenu);
  window.addEventListener('resize', hideContextMenu);
}

// Convenience: bind a right-click handler to an element.
// `itemsFor` may be an array or a function (ev) => array.
export function bindContextMenu(target, itemsFor, opts = {}) {
  target.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const items = typeof itemsFor === 'function' ? itemsFor(e) : itemsFor;
    if (!items || !items.length) return;
    showContextMenu(e.clientX, e.clientY, items, opts);
  });
}
