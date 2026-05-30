// Spotlight — fuzzy app search + quick calculator, launched with Cmd+Space.
import { APPS } from './apps.js';
import { openApp } from './windowManager.js';
import { on } from './state.js';
import { iconHTML } from './icons.js';

const overlay = document.getElementById('spotlight-overlay');
const input = document.getElementById('spotlight-input');
const resultsEl = document.getElementById('spotlight-results');

let results = [];   // [{type, app?, value?}]
let selected = 0;
let isOpen = false;
let openedAt = 0;

export function initSpotlight() {
  on('os:toggle-spotlight', toggle);

  input.addEventListener('input', () => runSearch(input.value));
  input.addEventListener('keydown', onKey);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay && Date.now() - openedAt > 300) close(); });
}

function toggle() { isOpen ? close() : open(); }

function open() {
  isOpen = true;
  openedAt = Date.now();
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
  input.value = '';
  resultsEl.innerHTML = '';
  results = [];
  setTimeout(() => input.focus(), 20);
}
export function close() {
  isOpen = false;
  overlay.classList.add('hidden');
  overlay.classList.remove('show');
  input.blur();
}

function runSearch(q) {
  q = q.trim();
  results = [];
  if (!q) { resultsEl.innerHTML = ''; return; }

  // Quick calculator
  if (/^[0-9+\-*/(). %]+$/.test(q) && /[+\-*/]/.test(q)) {
    try {
      const val = Function('"use strict";return (' + q.replace(/%/g, '/100') + ')')();
      if (typeof val === 'number' && isFinite(val)) results.push({ type: 'calc', value: val });
    } catch { /* not a valid expression */ }
  }

  const ql = q.toLowerCase();
  const starts = [], includes = [];
  APPS.forEach((a) => {
    const n = a.name.toLowerCase();
    if (n.startsWith(ql)) starts.push(a);
    else if (n.includes(ql)) includes.push(a);
  });
  [...starts, ...includes].slice(0, 8).forEach((a) => results.push({ type: 'app', app: a }));

  render();
}

function render() {
  resultsEl.innerHTML = '';
  selected = 0;
  if (!results.length) return;

  results.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'spot-result' + (i === 0 ? ' selected' : '');
    if (r.type === 'calc') {
      li.innerHTML = `<div class="spot-ic">${iconHTML('calculator')}</div>
        <div class="spot-meta"><span class="spot-name">${formatNum(r.value)}</span><span class="spot-kind">Calculator</span></div>`;
    } else {
      const a = r.app;
      li.innerHTML = `<div class="spot-ic">${iconHTML(a.id, a.name)}</div>
        <div class="spot-meta"><span class="spot-name">${a.name}</span><span class="spot-kind">Application</span></div>`;
    }
    li.addEventListener('mousemove', () => setSelected(i));
    li.addEventListener('click', () => activate(i));
    resultsEl.append(li);
  });
}

function formatNum(n) { return (Math.round(n * 1e8) / 1e8).toLocaleString(); }

function setSelected(i) {
  selected = i;
  [...resultsEl.children].forEach((c, j) => c.classList.toggle('selected', j === i));
}

function onKey(e) {
  if (e.key === 'Escape') { close(); return; }
  if (!results.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(Math.min(selected + 1, results.length - 1)); scrollSel(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(Math.max(selected - 1, 0)); scrollSel(); }
  else if (e.key === 'Enter') { e.preventDefault(); activate(selected); }
}
function scrollSel() { resultsEl.children[selected]?.scrollIntoView({ block: 'nearest' }); }

function activate(i) {
  const r = results[i];
  if (!r) return;
  if (r.type === 'app') { openApp(r.app.id); close(); }
  else if (r.type === 'calc') { input.value = String(r.value); runSearch(input.value); }
}
