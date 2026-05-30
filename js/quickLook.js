// Quick Look: pressing Space when an element marked [data-quicklook] is selected
// (carries class .ql-selected) opens a centered preview overlay. Space or Esc
// closes. Exposed to apps via api.quickLook(content).
//
// `content` may be:
//   - a string            -> shown as a document/text preview
//   - an HTMLElement       -> embedded directly
//   - { type, title, ... } -> structured: 'image' | 'doc' | 'info'
import { on } from './state.js';

const root = document.getElementById('quicklook');
const titleEl = root.querySelector('.ql-title');
const bodyEl = root.querySelector('.ql-body');
let isOpen = false;

export function initQuickLook() {
  root.querySelector('.ql-close').addEventListener('click', close);
  root.addEventListener('mousedown', (e) => { if (e.target === root) close(); });
  on('os:quicklook', (e) => quickLook(e.detail && e.detail.content));

  // Space toggles Quick Look for the currently selected ql item.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(); return; }
    if (e.code !== 'Space') return;
    // Let Cmd/Ctrl+Space (Spotlight) through untouched.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Don't hijack space while typing.
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName))) return;

    if (isOpen) { e.preventDefault(); close(); return; }
    const sel = document.querySelector('[data-quicklook].ql-selected') || document.querySelector('[data-quicklook]:hover');
    if (sel) {
      e.preventDefault();
      quickLook(parseTarget(sel));
    }
  });
}

export function isQuickLookOpen() { return isOpen; }

function parseTarget(elm) {
  const raw = elm.getAttribute('data-quicklook');
  if (!raw || raw === 'auto') {
    // Derive a sensible preview from the element's own content.
    const name = elm.getAttribute('data-ql-name')
      || (elm.querySelector('span') ? elm.querySelector('span').textContent : elm.textContent.trim());
    const glyph = elm.getAttribute('data-ql-glyph') || (elm.querySelector('.ff-glyph, .di-glyph') || {}).textContent || '📄';
    return { type: 'info', title: name, glyph, name };
  }
  try { return JSON.parse(raw); } catch { return { type: 'doc', title: 'Preview', text: raw }; }
}

export function quickLook(content) {
  bodyEl.innerHTML = '';
  let title = 'Preview';

  if (content == null) {
    bodyEl.innerHTML = '<div class="ql-doc">Nothing to preview.</div>';
  } else if (typeof content === 'string') {
    bodyEl.innerHTML = `<div class="ql-doc">${content}</div>`;
  } else if (content instanceof HTMLElement) {
    bodyEl.append(content);
  } else if (typeof content === 'object') {
    title = content.title || title;
    bodyEl.append(renderStructured(content));
  }

  titleEl.textContent = title;
  isOpen = true;
  root.classList.remove('hidden');
  requestAnimationFrame(() => root.classList.add('show'));
}

function renderStructured(c) {
  const wrap = document.createElement('div');
  if (c.type === 'image') {
    const img = document.createElement('div');
    img.className = 'ql-image';
    img.style.background = c.gradient || 'linear-gradient(135deg,#a18cd1,#fbc2eb)';
    img.textContent = c.caption || c.title || '';
    wrap.append(img);
  } else if (c.type === 'info') {
    const info = document.createElement('div');
    info.className = 'ql-info';
    const rows = (c.rows || [
      ['Kind', c.kind || 'Document'],
      ['Size', c.size || '—'],
      ['Created', c.created || 'Today'],
    ]).map(([k, v]) => `<div class="ql-row"><span>${k}</span><span>${v}</span></div>`).join('');
    info.innerHTML = `
      <div class="ql-glyph">${c.glyph || '📄'}</div>
      <div class="ql-name">${c.name || c.title || 'Item'}</div>
      ${rows}`;
    wrap.append(info);
  } else {
    const doc = document.createElement('div');
    doc.className = 'ql-doc';
    doc.innerHTML = (c.title ? `<h1>${c.title}</h1>` : '') + (c.text || '');
    wrap.append(doc);
  }
  return wrap;
}

export function close() {
  if (!isOpen) return;
  isOpen = false;
  root.classList.remove('show');
  setTimeout(() => { root.classList.add('hidden'); bodyEl.innerHTML = ''; }, 160);
}
