// Shared, persistent Trash store + the Trash window UI.
// Any app can drop an item here via addToTrash(); the Trash window renders it
// live and persists across reloads (localStorage).
import { el, setHTML } from './dom.js';
import { emit, on } from './state.js';

const KEY = 'os.trash';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* quota / private mode */ }
}

let items = read();

export function getTrash() { return items.slice(); }
export function trashCount() { return items.length; }

export function addToTrash(item) {
  items.push({
    name: item.name || 'Untitled',
    glyph: item.glyph || '📄',
    kind: item.kind || 'Document',
    from: item.from || '',
    ts: Date.now(),
  });
  write(items);
  emit('os:trash-changed', { count: items.length });
}

export function emptyTrash() {
  if (!items.length) return;
  items = [];
  write(items);
  emit('os:trash-changed', { count: 0 });
}

export function putBack(index) {
  if (index < 0 || index >= items.length) return null;
  const [it] = items.splice(index, 1);
  write(items);
  emit('os:trash-changed', { count: items.length });
  return it;
}

export function deleteForever(index) {
  if (index < 0 || index >= items.length) return;
  items.splice(index, 1);
  write(items);
  emit('os:trash-changed', { count: items.length });
}

// The Dock / desktop "Empty Trash" menu items emit this on the OS bus.
on('os:empty-trash', emptyTrash);

/* =========================================================
   Trash window content
   ========================================================= */
export function trashContent(win, api) {
  const root = el('trash-root');

  const toolbar = el('trash-toolbar');
  const title = el('trash-title');
  const emptyBtn = el('trash-empty-btn', 'button');
  emptyBtn.textContent = 'Empty';
  toolbar.append(title, el('trash-spacer'), emptyBtn);

  const body = el('trash-body');
  root.append(toolbar, body);

  emptyBtn.addEventListener('click', () => {
    if (!items.length) return;
    emit('os:empty-trash');
  });

  function render() {
    const list = getTrash();
    title.textContent = `Trash — ${list.length} item${list.length === 1 ? '' : 's'}`;
    emptyBtn.disabled = list.length === 0;
    body.innerHTML = '';

    if (!list.length) {
      body.append(setHTML('trash-empty-state',
        '<div class="trash-empty-glyph">🗑️</div><div class="trash-empty-title">Trash is Empty</div>' +
        '<div class="trash-empty-sub">Items you move to the Trash will appear here.</div>'));
      return;
    }

    const grid = el('trash-grid');
    list.forEach((it, i) => {
      const tile = el('trash-file');
      tile.innerHTML = `<div class="trash-file-glyph">${it.glyph}</div><span class="trash-file-name">${it.name}</span>`;
      tile.title = it.from ? `From ${it.from}` : it.kind;
      tile.addEventListener('click', () => {
        grid.querySelectorAll('.trash-file.sel').forEach((x) => x.classList.remove('sel'));
        tile.classList.add('sel');
      });
      tile.addEventListener('dblclick', () => doPutBack(i));
      bindMenu(tile, i);
      grid.append(tile);
    });
    body.append(grid);
  }

  function doPutBack(i) {
    const it = putBack(i);
    if (it) api.toast(`“${it.name}” put back`);
  }

  function bindMenu(tile, i) {
    const items2 = () => [
      { label: 'Put Back', act: () => doPutBack(i) },
      { sep: true },
      { label: 'Delete Immediately…', danger: true, act: () => { const it = getTrash()[i]; deleteForever(i); if (it) api.toast(`“${it.name}” deleted`); } },
    ];
    tile.addEventListener('contextmenu', (e) => {
      if (api.contextMenu) api.contextMenu(items2(), e);
    });
  }

  on('os:trash-changed', render);
  render();
  return root;
}
