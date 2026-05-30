// Safari — a working browser shell with real iframe navigation.
// Cross-origin sites that send X-Frame-Options / frame-ancestors CSP cannot be
// embedded; we detect that and offer "Open in new tab" as a graceful fallback.

let uid = 0;
const el = (cls, tag = 'div') => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

const FAVORITES = [
  { name: 'Example',   url: 'https://example.com',                 glyph: '🌐', bg: '#5b8def' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/macOS', glyph: '📖', bg: '#3a3a3c' },
  { name: 'MDN',       url: 'https://developer.mozilla.org',       glyph: '📘', bg: '#1b1b1b' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com',      glyph: '🟧', bg: '#ff6600' },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org',   glyph: '🗺️', bg: '#7ebc6f' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com',             glyph: '🦆', bg: '#de5833' },
  { name: 'Wikipedia ◎', url: 'https://www.wikipedia.org',         glyph: '🌍', bg: '#0a64e6' },
  { name: 'CodePen',   url: 'https://codepen.io',                  glyph: '✏️', bg: '#111' },
];

const START = 'about:start';

// Web search → DuckDuckGo's no-JS HTML results, which render cleanly inside the
// proxied iframe. (Google rewrites its embedded page to a "trouble accessing"
// notice via JS; type "google.com" in the bar to use Google directly.)
function webSearch(q) {
  return 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q);
}

// Route any real URL through the same-origin proxy so it can be framed.
// /api/proxy works both locally (server.py) and on Vercel (serverless function).
function proxied(url) {
  return '/api/proxy?url=' + encodeURIComponent(url);
}

function normalize(input) {
  const t = (input || '').trim();
  if (!t) return START;
  if (/^https?:\/\//i.test(t)) return t;
  // a bare domain (has a dot, no spaces) → treat as a website URL
  if (/^[^\s]+\.[^\s]{2,}(\/.*)?$/.test(t)) return 'https://' + t;
  // anything else is a search query
  return webSearch(t);
}

function prettyTitle(url) {
  if (url === START) return 'Start Page';
  try {
    const u = new URL(url);
    const q = u.searchParams.get('q');
    if (q && (u.hostname.includes('google') || u.hostname.includes('duckduckgo'))) {
      return q;
    }
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function createSafari() {
  const root = el('safari');

  // ---- Tab bar ----
  const tabbar = el('safari-tabbar');
  const newTabBtn = el('safari-newtab');
  newTabBtn.textContent = '+';
  newTabBtn.title = 'New Tab';
  tabbar.append(newTabBtn);

  // ---- Toolbar ----
  const toolbar = el('safari-toolbar');
  const nav = el('safari-nav');
  const backBtn = navBtn('M11 4 5 10l6 6', 'Back');
  const fwdBtn = navBtn('M5 4l6 6-6 6', 'Forward');
  const reloadBtn = navBtn(null, 'Reload');
  reloadBtn.innerHTML =
    '<svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M14.5 4.5A6.5 6.5 0 1 0 15.5 9"/><path d="M15.5 3v3.2h-3.2"/></svg>';
  nav.append(backBtn, fwdBtn, reloadBtn);

  const address = el('safari-address');
  address.innerHTML =
    '<span class="lock">🔒</span><input type="text" spellcheck="false" autocomplete="off" placeholder="Search or enter website name" />';
  const input = address.querySelector('input');

  const shareBtn = navBtn(null, 'Open in new tab');
  shareBtn.innerHTML =
    '<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v9"/><path d="M5.5 5.5 9 2l3.5 3.5"/><path d="M4 10v4h10v-4"/></svg>';

  toolbar.append(nav, address, shareBtn);

  const progress = el('safari-progress');

  // ---- Content area ----
  const frameWrap = el('safari-frame-wrap');
  const iframe = document.createElement('iframe');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  // No allow-same-origin: proxied pages get an opaque origin and cannot read
  // the clone's own localStorage (Trash, settings, etc.).
  iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');

  const start = buildStartPage((url) => go(url));
  const blocked = el('safari-blocked');
  blocked.innerHTML =
    '<div class="sb-glyph">🛡️</div><h2>Safari Can’t Open This Page Here</h2>' +
    '<p>This website doesn’t allow itself to be embedded in a frame (X-Frame-Options / CSP). You can still open it in a real browser tab.</p>' +
    '<button class="open-btn">Open in New Tab</button>';

  frameWrap.append(iframe, start, blocked);
  root.append(tabbar, toolbar, progress, frameWrap);

  // ---- Tab + history model ----
  const tabs = [];
  let active = -1;
  let loadTimer = null;

  function makeTab(url = START) {
    return { id: ++uid, url, history: [url], idx: 0, titleEl: null, el: null };
  }
  function current() { return tabs[active]; }

  function renderTabs() {
    [...tabbar.querySelectorAll('.safari-tab')].forEach((n) => n.remove());
    tabs.forEach((tab, i) => {
      const t = el('safari-tab');
      if (i === active) t.classList.add('active');
      const title = el('tab-title', 'span');
      title.textContent = prettyTitle(tab.url);
      tab.titleEl = title;
      const close = el('tab-close', 'span');
      close.textContent = '×';
      close.addEventListener('mousedown', (e) => { e.stopPropagation(); closeTab(i); });
      t.append(title, close);
      t.addEventListener('mousedown', () => selectTab(i));
      tabbar.insertBefore(t, newTabBtn);
      tab.el = t;
    });
  }

  function selectTab(i) {
    active = i;
    renderTabs();
    render();
  }

  function closeTab(i) {
    tabs.splice(i, 1);
    if (tabs.length === 0) tabs.push(makeTab());
    active = Math.max(0, Math.min(active, tabs.length - 1));
    renderTabs();
    render();
  }

  function addTab() {
    tabs.push(makeTab());
    active = tabs.length - 1;
    renderTabs();
    render();
    input.focus();
  }

  // ---- Navigation ----
  function go(raw) {
    const url = normalize(raw);
    const tab = current();
    if (url === tab.url) { load(url); return; }
    tab.history = tab.history.slice(0, tab.idx + 1);
    tab.history.push(url);
    tab.idx = tab.history.length - 1;
    tab.url = url;
    load(url);
    updateChrome();
  }

  function back() {
    const tab = current();
    if (tab.idx > 0) { tab.idx--; tab.url = tab.history[tab.idx]; load(tab.url); updateChrome(); }
  }
  function forward() {
    const tab = current();
    if (tab.idx < tab.history.length - 1) { tab.idx++; tab.url = tab.history[tab.idx]; load(tab.url); updateChrome(); }
  }

  function load(url) {
    clearTimeout(loadTimer);
    blocked.classList.remove('show');
    if (url === START) {
      iframe.classList.add('hidden');
      start.classList.remove('hidden');
      progress.classList.remove('loading');
      progress.style.width = '0';
      return;
    }
    start.classList.add('hidden');
    iframe.classList.remove('hidden');
    progress.classList.add('loading');
    progress.style.width = '18%';
    requestAnimationFrame(() => (progress.style.width = '72%'));
    iframe.src = proxied(url);
    // The proxy always returns something (page or error), so this is just a
    // long safety net in case the request hangs entirely.
    loadTimer = setTimeout(() => {
      progress.classList.remove('loading');
      progress.style.width = '0';
      blocked.classList.add('show');
    }, 22000);
  }

  iframe.addEventListener('load', () => {
    if (iframe.classList.contains('hidden')) return;
    clearTimeout(loadTimer);
    progress.style.width = '100%';
    setTimeout(() => { progress.classList.remove('loading'); progress.style.width = '0'; }, 250);
  });

  function updateChrome() {
    const tab = current();
    input.value = tab.url === START ? '' : tab.url;
    backBtn.classList.toggle('disabled', tab.idx === 0);
    fwdBtn.classList.toggle('disabled', tab.idx >= tab.history.length - 1);
    if (tab.titleEl) tab.titleEl.textContent = prettyTitle(tab.url);
  }

  function render() {
    const tab = current();
    load(tab.url);
    updateChrome();
  }

  // ---- Events ----
  backBtn.addEventListener('click', back);
  fwdBtn.addEventListener('click', forward);
  reloadBtn.addEventListener('click', () => load(current().url));
  newTabBtn.addEventListener('click', addTab);
  shareBtn.addEventListener('click', () => {
    const u = current().url;
    if (u !== START) window.open(u, '_blank', 'noopener');
  });
  blocked.querySelector('.open-btn').addEventListener('click', () => {
    const u = current().url;
    if (u !== START) window.open(u, '_blank', 'noopener');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { go(input.value); iframe.focus?.(); }
  });
  input.addEventListener('focus', () => input.select());

  // ---- Boot first tab ----
  tabs.push(makeTab());
  active = 0;
  renderTabs();
  render();

  return root;

  function navBtn(path, title) {
    const b = el('sf-btn', 'button');
    b.title = title;
    if (path) {
      b.innerHTML = `<svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
    }
    return b;
  }
}

function buildStartPage(go) {
  const start = el('safari-start');

  // Prominent search box (searches go to Google).
  const search = el('safari-start-search');
  search.style.cssText = 'max-width:560px;margin:0 auto 28px;display:flex;align-items:center;gap:10px;background:#fff;border:0.5px solid rgba(0,0,0,0.12);border-radius:13px;padding:12px 16px;box-shadow:0 6px 20px rgba(0,0,0,0.10);';
  search.innerHTML = '<span style="font-size:17px;opacity:0.5">🔍</span>';
  const sinput = el(null, 'input');
  sinput.type = 'text';
  sinput.placeholder = 'Search the web or enter website name';
  sinput.spellcheck = false;
  sinput.autocomplete = 'off';
  sinput.style.cssText = 'flex:1;font-size:15px;color:#222;background:transparent;border:none;outline:none;';
  sinput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && sinput.value.trim()) go(sinput.value); });
  search.append(sinput);

  const h = el(null, 'h1');
  h.textContent = 'Favorites';
  const grid = el('safari-favorites');
  FAVORITES.forEach((f) => {
    const fav = el('safari-fav');
    const tile = el('fav-tile');
    tile.style.background = f.bg;
    tile.textContent = f.glyph;
    const name = el('fav-name');
    name.textContent = f.name;
    fav.append(tile, name);
    fav.addEventListener('click', () => go(f.url));
    grid.append(fav);
  });
  start.append(search, h, grid);
  return start;
}
