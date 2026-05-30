// App registry: 54 apps + content renderers. All content is original placeholder
// material and CSS/emoji approximations — no proprietary assets.
import { createSafari } from './safari.js';
// el/setHTML now live in dom.js; re-exported here so existing imports
// (e.g. windowManager.js `import { el } from './apps.js'`) keep working.
import { el, setHTML } from './dom.js';
export { el, setHTML };

// Upgraded app modules (js/apps/*.js) — each exports content(win, api) => Element.
import { content as mapsContent } from './apps/maps.js';
import { content as facetimeContent } from './apps/facetime.js';import { content as stocksContent } from './apps/stocks.js';
import { content as newsContent } from './apps/news.js';
import { content as weatherContent } from './apps/weather.js';
import { content as remindersContent } from './apps/reminders.js';
import { content as photosContent } from './apps/photos.js';
import { content as previewContent } from './apps/preview.js';
import { content as siriContent } from './apps/siri.js';
import { content as timemachineContent } from './apps/timemachine.js';import { content as mailContent } from './apps/mail.js';
import { content as messagesContent } from './apps/messages.js';
import { content as finderContent } from './apps/finder.js';
import { content as grapherContent } from './apps/grapher.js';
import { content as homeContent } from './apps/home.js';
import { content as podcastsContent } from './apps/podcasts.js';
import { content as dictionaryContent } from './apps/dictionary.js';
import { content as diskutilityContent } from './apps/diskutility.js';
import { content as chessAppContent } from './apps/chess.js';
import { content as booksAppContent } from './apps/books.js';
import { content as musicAppContent } from './apps/music.js';
import { content as halcyonContent } from './apps/halcyon.js';

/* =========================================================
   Rich content renderers
   ========================================================= */

function placeholder(app) {
  return () => {
    const c = el('wb-center');
    c.innerHTML = `<div class="big-glyph">${app.glyph}</div><h2>${app.name}</h2>
      <p>${app.blurb || `${app.name} is part of this macOS clone. The full app experience isn’t implemented, but the window, Dock, and window management are fully functional.`}</p>`;
    return c;
  };
}

function calculatorContent() {
  const root = el('calc');
  const display = el('calc-display'); display.textContent = '0';
  const keys = el('calc-keys');
  root.append(display, keys);

  let cur = '0', prev = null, op = null, fresh = true;
  const layout = [
    ['AC', 'fn'], ['+/-', 'fn'], ['%', 'fn'], ['÷', 'op'],
    ['7', ''], ['8', ''], ['9', ''], ['×', 'op'],
    ['4', ''], ['5', ''], ['6', ''], ['−', 'op'],
    ['1', ''], ['2', ''], ['3', ''], ['+', 'op'],
    ['0', 'zero'], ['.', ''], ['=', 'op'],
  ];
  const fmt = (n) => {
    if (!isFinite(n)) return 'Error';
    const s = (Math.round(n * 1e10) / 1e10).toString();
    return s.length > 9 ? Number(n).toPrecision(7).replace(/\.?0+$/, '') : s;
  };
  const compute = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : a / b;

  layout.forEach(([label, kind]) => {
    const k = el('calc-key' + (kind ? ' ' + kind : ''));
    k.textContent = label;
    k.addEventListener('click', () => {
      if (/[0-9]/.test(label)) {
        cur = fresh || cur === '0' ? label : cur + label; fresh = false;
      } else if (label === '.') {
        if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.';
      } else if (label === 'AC') {
        cur = '0'; prev = null; op = null; fresh = true;
      } else if (label === '+/-') {
        cur = (parseFloat(cur) * -1).toString();
      } else if (label === '%') {
        cur = (parseFloat(cur) / 100).toString();
      } else if (['+', '−', '×', '÷'].includes(label)) {
        if (op && !fresh) { prev = compute(prev, parseFloat(cur), op); cur = fmt(prev); }
        else prev = parseFloat(cur);
        op = label; fresh = true;
        keys.querySelectorAll('.op').forEach((o) => o.classList.remove('active'));
        k.classList.add('active');
      } else if (label === '=') {
        if (op != null) { cur = fmt(compute(prev, parseFloat(cur), op)); op = null; fresh = true; }
      }
      if (label !== '=' && !['+', '−', '×', '÷'].includes(label)) {
        keys.querySelectorAll('.op').forEach((o) => o.classList.remove('active'));
      }
      display.textContent = cur;
    });
    keys.append(k);
  });
  return root;
}

function notesContent() {
  const root = el('app-split');
  const notes = [
    { t: 'Welcome', b: '<h1>Welcome 👋</h1><p>This is a fully editable note. Click and type anywhere.</p><p>Your text stays for the session.</p>' },
    { t: 'Grocery List', b: '<h1>Grocery List</h1><p>• Coffee beans<br>• Oat milk<br>• Sourdough<br>• Tomatoes<br>• Olive oil</p>' },
    { t: 'Project Ideas', b: '<h1>Project Ideas</h1><p>1. Build a desktop clone in the browser<br>2. Physics-based dock<br>3. Working window manager</p>' },
    { t: 'Meeting Notes', b: '<h1>Standup — Today</h1><p>Discussed roadmap, window manager, and the Dock magnification curve.</p>' },
  ];
  const list = el('notes-list');
  const editor = el('notes-editor');
  const edit = el(null); edit.contentEditable = 'true';
  editor.append(edit);
  root.append(list, editor);

  let active = 0;
  function open(i) {
    active = i;
    [...list.children].forEach((c, j) => c.classList.toggle('active', j === i));
    edit.innerHTML = notes[i].b;
  }
  notes.forEach((n, i) => {
    const item = el('note-item');
    item.innerHTML = `<div class="note-title">${n.t}</div><div class="note-preview">${n.b.replace(/<[^>]+>/g, ' ').trim().slice(0, 40)}</div>`;
    item.addEventListener('click', () => open(i));
    list.append(item);
  });
  edit.addEventListener('input', () => { notes[active].b = edit.innerHTML; });
  open(0);
  return root;
}

function terminalContent(win, api) {
  const root = el('terminal');
  const user = 'guest', host = 'macbook';
  const print = (html, cls = 'term-line') => { const l = el(cls); l.innerHTML = html; root.append(l); };
  const banner = `Last login: ${new Date().toDateString()} on ttys000`;
  print(banner);
  print(`Type <span class="term-path">help</span> to see available commands.`);

  function newPrompt() {
    const line = el('term-input-line');
    line.innerHTML = `<span class="term-prompt">${user}@${host}</span><span class="term-path">~ %</span>`;
    const input = el('term-input', 'input');
    input.spellcheck = false; input.autocomplete = 'off';
    line.append(input);
    root.append(line);
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value;
        input.disabled = true;
        run(cmd);
        newPrompt();
        root.scrollTop = root.scrollHeight;
      }
    });
  }
  function run(cmd) {
    const [c, ...args] = cmd.trim().split(/\s+/);
    const arg = args.join(' ');
    switch (c) {
      case '': break;
      case 'help':
        print('Commands: help, ls, pwd, whoami, date, echo, open &lt;app&gt;, neofetch, clear'); break;
      case 'ls':
        print('Applications  Desktop  Documents  Downloads  Library  Movies  Music  Pictures  Public'); break;
      case 'pwd': print(`/Users/${user}`); break;
      case 'whoami': print(user); break;
      case 'date': print(new Date().toString()); break;
      case 'echo': print(arg.replace(/[<>]/g, '')); break;
      case 'clear': root.querySelectorAll('.term-line, .term-input-line').forEach((n) => n.remove()); break;
      case 'neofetch':
        print(`<span class="term-path">${user}@${host}</span>\nOS: macOS Sequoia (web clone)\nShell: zsh\nDE: Aqua\nApps: ${APPS.length}\nResolution: ${window.innerWidth}x${window.innerHeight}`);
        break;
      case 'open': {
        const found = APPS.find((a) => a.id === arg.toLowerCase() || a.name.toLowerCase() === arg.toLowerCase());
        if (found) { api.openApp(found.id); print(`Opening ${found.name}…`); }
        else print(`open: ${arg}: app not found`);
        break;
      }
      default: print(`zsh: command not found: ${c}`);
    }
  }
  newPrompt();
  root.addEventListener('mousedown', (e) => {
    if (e.target === root) root.querySelector('.term-input-line:last-child input')?.focus();
  });
  return root;
}

function settingsContent(win, api) {
  const root = el('app-split');
  const cats = [
    ['account', '👤', 'Apple Account'], ['wifi', '📶', 'Wi-Fi'], ['bluetooth', '🔵', 'Bluetooth'],
    ['network', '🌐', 'Network'], ['general', '⚙️', 'General'], ['appearance', '🎨', 'Appearance'],
    ['display', '🖥️', 'Displays'], ['wallpaper', '🏞️', 'Wallpaper'], ['dock', '📊', 'Desktop & Dock'],
    ['privacy', '🔒', 'Privacy & Security'], ['battery', '🔋', 'Battery'], ['sound', '🔊', 'Sound'],
  ];
  const sb = el('app-sidebar');
  cats.forEach(([id, ic, label], i) => {
    const r = el('sb-row' + (i === 0 ? ' active' : ''));
    r.dataset.id = id;
    r.innerHTML = `<span class="sb-ic">${ic}</span>${label}`;
    sb.append(r);
  });
  const main = el('app-main');
  root.append(sb, main);

  const panes = {
    account: `<div class="settings-pane"><h2>Apple Account</h2><div class="sub">Sign in to use iCloud and more.</div>
      <div class="settings-card"><div class="settings-row"><div style="display:flex;gap:14px;align-items:center"><div class="settings-avatar">🦊</div><div><div style="font-weight:600">Guest User</div><div style="color:#888;font-size:12px">guest@icloud.com</div></div></div></div></div></div>`,
    general: `<div class="settings-pane"><h2>General</h2><div class="sub">macOS Sequoia 15.0 — Web Clone</div>
      <div class="settings-card">${row('Name', 'MacBook Pro')}${row('macOS', 'Sequoia 15.0')}${row('Chip', 'Apple Silicon (emulated)')}${row('Memory', '16 GB')}</div></div>`,
    // appearance / wallpaper / dock are built live below (see show()).
  };
  function defPane(label) {
    return `<div class="settings-pane"><h2>${label}</h2><div class="sub">Settings for ${label}.</div>
      <div class="settings-card">${toggleRow('Enabled', true)}${toggleRow('Notify me', false)}${row('Status', 'Connected')}</div></div>`;
  }
  function row(k, v) { return `<div class="settings-row"><span>${k}</span><span style="color:#888">${v}</span></div>`; }
  function toggleRow(k, on) { return `<div class="settings-row"><span>${k}</span><span class="toggle${on ? ' on' : ''}"></span></div>`; }

  function show(id, label) {
    if (id === 'appearance') return buildAppearance();
    if (id === 'wallpaper') return buildWallpaper();
    if (id === 'dock') return buildDockPane();
    main.innerHTML = panes[id] || defPane(label);
    bindToggles();
  }
  function bindToggles() {
    main.querySelectorAll('.toggle').forEach((t) => t.addEventListener('click', () => t.classList.toggle('on')));
  }

  /* ---- Live: Appearance (toggles real dark mode) ---- */
  function buildAppearance() {
    main.innerHTML = `<div class="settings-pane"><h2>Appearance</h2>
      <div class="sub">Customize the look of windows, menus, and the Dock.</div>
      <div class="settings-card"><div class="settings-row"><span>Appearance</span>
        <span class="seg-control" id="appearance-seg">
          <button data-mode="light">Light</button><button data-mode="dark">Dark</button>
        </span></div></div></div>`;
    const seg = main.querySelector('#appearance-seg');
    const sync = () => {
      const cur = api.getAppearance();
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.mode === cur));
    };
    seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      api.setAppearance(b.dataset.mode); sync();
      api.toast(b.dataset.mode === 'dark' ? 'Dark Mode on' : 'Light Mode on');
    }));
    sync();
  }

  /* ---- Live: Wallpaper (clickable gradient presets) ---- */
  function buildWallpaper() {
    main.innerHTML = `<div class="settings-pane"><h2>Wallpaper</h2>
      <div class="sub">Choose a desktop background.</div>
      <div class="wallpaper-grid" id="wp-grid"></div></div>`;
    const grid = main.querySelector('#wp-grid');
    const current = api.getWallpaper();
    api.wallpapers.forEach((wp) => {
      const cell = el('wp-swatch' + (wp.css === current ? ' active' : ''));
      cell.style.background = wp.css;
      cell.innerHTML = `<span class="wp-name">${wp.name}</span>`;
      cell.addEventListener('click', () => {
        api.setWallpaper(wp.css);
        grid.querySelectorAll('.wp-swatch').forEach((s) => s.classList.remove('active'));
        cell.classList.add('active');
        api.toast('Wallpaper: ' + wp.name);
      });
      grid.append(cell);
    });
  }

  /* ---- Live: Desktop & Dock (working size slider) ---- */
  function buildDockPane() {
    const size = api.getSetting('dockSize', 56);
    main.innerHTML = `<div class="settings-pane"><h2>Desktop &amp; Dock</h2>
      <div class="sub">Adjust the Dock size and behavior.</div>
      <div class="settings-card">
        <div class="settings-row"><span>Size</span>
          <span class="slider-wrap"><span>Small</span>
            <input type="range" id="dock-size" min="36" max="80" step="2" value="${size}">
            <span>Large</span></span></div>
        ${toggleRow('Magnification', true)}
        ${toggleRow('Automatically hide and show the Dock', false)}
        ${toggleRow('Animate opening applications', true)}
      </div></div>`;
    main.querySelector('#dock-size').addEventListener('input', (e) => {
      api.setDockSize(parseInt(e.target.value, 10));
    });
    bindToggles();
  }
  sb.querySelectorAll('.sb-row').forEach((r) => r.addEventListener('click', () => {
    sb.querySelectorAll('.sb-row').forEach((x) => x.classList.remove('active'));
    r.classList.add('active');
    show(r.dataset.id, r.textContent.trim());
  }));
  show('account', 'Apple Account');
  return root;
}

function calendarContent() {
  const root = el('cal');
  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth();
  const head = el('cal-head');
  const grid = el('cal-grid');
  root.append(head, grid);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const events = { 8: 'Standup', 14: 'Design Review', 22: 'Launch 🚀', [now.getDate()]: 'Today’s Plan' };

  function render() {
    head.innerHTML = `<h2>${monthNames[m]} ${y}</h2><div><span class="cal-nav">‹</span> &nbsp; <span class="cal-nav">›</span></div>`;
    head.querySelectorAll('.cal-nav')[0].addEventListener('click', () => { m--; if (m < 0) { m = 11; y--; } render(); });
    head.querySelectorAll('.cal-nav')[1].addEventListener('click', () => { m++; if (m > 11) { m = 0; y++; } render(); });
    grid.innerHTML = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) => grid.append(setHTML('cal-dow', d)));
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    for (let i = 0; i < 42; i++) {
      const cell = el('cal-cell');
      let num;
      if (i < first) { cell.classList.add('out'); num = prevDays - first + i + 1; }
      else if (i >= first + days) { cell.classList.add('out'); num = i - first - days + 1; }
      else {
        num = i - first + 1;
        const isToday = (y === now.getFullYear() && m === now.getMonth() && num === now.getDate());
        if (isToday) cell.classList.add('today');
        cell.innerHTML = `<span class="cal-num">${num}</span>`;
        if (events[num] && !cell.classList.contains('out')) cell.innerHTML += `<div class="cal-event">${events[num]}</div>`;
      }
      if (cell.innerHTML === '') cell.innerHTML = `<span class="cal-num">${num}</span>`;
      grid.append(cell);
    }
  }
  render();
  return root;
}

function musicContent() {
  const root = el('app-split');
  const sb = setHTML('app-sidebar', `
    <div class="sb-section">Apple Music</div>
    <div class="sb-row active"><span class="sb-ic">▶️</span>Listen Now</div>
    <div class="sb-row"><span class="sb-ic">🌐</span>Browse</div>
    <div class="sb-row"><span class="sb-ic">📻</span>Radio</div>
    <div class="sb-section">Library</div>
    <div class="sb-row"><span class="sb-ic">🎵</span>Songs</div>
    <div class="sb-row"><span class="sb-ic">💿</span>Albums</div>
    <div class="sb-row"><span class="sb-ic">🎤</span>Artists</div>`);
  const main = el('app-main');
  const tracks = [
    ['Neon Skyline', 'The Wavelengths', '3:42'], ['Midnight Compiler', 'Async/Await', '4:10'],
    ['Pixel Dreams', 'Retina Display', '2:58'], ['Gradient Sunrise', 'CSS Collective', '3:25'],
    ['Backdrop Blur', 'Vibrancy', '4:01'], ['Magnification', 'The Dockers', '3:15'],
  ];
  const now = setHTML('music-now', `
    <div class="music-art" style="background:linear-gradient(135deg,#fa2750,#ff9f0a)">🎧</div>
    <div class="music-title">Neon Skyline</div>
    <div class="music-artist">The Wavelengths — Synthwave Vol. 1</div>
    <div class="music-bar"></div>
    <div class="music-controls"><span>⏮️</span><span>⏯️</span><span>⏭️</span></div>`);
  const list = el('music-list');
  tracks.forEach((t, i) => {
    const r = setHTML('music-track', `<span class="num">${i + 1}</span><span style="flex:1">${t[0]}</span><span style="color:#888">${t[1]}</span><span style="color:#aaa">${t[2]}</span>`);
    r.addEventListener('click', () => {
      now.querySelector('.music-title').textContent = t[0];
      now.querySelector('.music-artist').textContent = t[1];
    });
    list.append(r);
  });
  main.append(now, list);
  root.append(sb, main);
  return root;
}

function appStoreContent() {
  const wrap = el('app-main');
  const root = el('appstore');
  const cards = [
    ['🎮', '#ff375f', 'Arcade Quest', 'Top game this week'],
    ['📝', '#ffd60a', 'FocusWriter', 'Distraction-free writing'],
    ['🎨', '#bf5af2', 'Palette Pro', 'Design with color'],
    ['📷', '#0a84ff', 'SnapEdit', 'Photo editing, simplified'],
    ['💻', '#30d158', 'DevTerminal', 'A better shell'],
  ];
  root.innerHTML = '<h2>Discover</h2>';
  cards.forEach(([g, bg, name, desc]) => {
    const c = el('as-card');
    c.innerHTML = `<div class="as-icon" style="background:${bg}">${g}</div><div class="as-meta"><div class="as-name">${name}</div><div class="as-desc">${desc}</div></div><div class="as-get">GET</div>`;
    root.append(c);
  });
  wrap.append(root); return wrap;
}

function textEditContent() {
  const root = el('textedit');
  const e = el(null); e.contentEditable = 'true';
  e.innerHTML = '<p>Untitled — start typing…</p>';
  root.append(e); return root;
}

function contactsContent() {
  const root = el('app-split');
  const people = [
    ['Ada Lovelace', '🦋', 'Engineering', '+1 (555) 0101'],
    ['Alan Turing', '🧮', 'Research', '+1 (555) 0102'],
    ['Grace Hopper', '⚓', 'Compilers', '+1 (555) 0103'],
    ['Katherine Johnson', '🚀', 'Mathematics', '+1 (555) 0104'],
    ['Tim Berners-Lee', '🕸️', 'Web', '+1 (555) 0105'],
  ];
  const sb = el('app-sidebar');
  const main = el('app-main');
  function show(p) {
    main.innerHTML = `<div style="padding:40px;text-align:center">
      <div class="settings-avatar" style="width:90px;height:90px;font-size:46px;margin:0 auto 14px">${p[1]}</div>
      <div style="font-size:22px;font-weight:700;color:#1c1c1e">${p[0]}</div>
      <div style="color:#888;margin-bottom:18px">${p[2]}</div>
      <div class="settings-card" style="text-align:left;max-width:320px;margin:0 auto">
        <div class="settings-row"><span style="color:#888">mobile</span><span style="color:var(--accent)">${p[3]}</span></div>
        <div class="settings-row"><span style="color:#888">email</span><span style="color:var(--accent)">${p[0].split(' ')[0].toLowerCase()}@example.com</span></div>
      </div></div>`;
  }
  people.forEach((p, i) => {
    const r = el('sb-row' + (i === 0 ? ' active' : ''));
    r.innerHTML = `<span class="sb-ic">${p[1]}</span>${p[0]}`;
    r.addEventListener('click', () => { sb.querySelectorAll('.sb-row').forEach((x) => x.classList.remove('active')); r.classList.add('active'); show(p); });
    sb.append(r);
  });
  root.append(sb, main);
  show(people[0]);
  return root;
}

function clockContent() {
  const wrap = el('app-main');
  const list = el('list-app');
  const zones = [['Cupertino', 'America/Los_Angeles'], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']];
  function rows() {
    list.innerHTML = '';
    zones.forEach(([city, tz]) => {
      let time = '';
      try { time = new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' }); } catch { time = '--:--'; }
      list.append(setHTML('list-row', `<span>${city}</span><span class="lr-right" style="font-size:20px;font-variant-numeric:tabular-nums">${time}</span>`));
    });
  }
  rows();
  const iv = setInterval(rows, 1000 * 20);
  list.addEventListener('DOMNodeRemovedFromDocument', () => clearInterval(iv));
  wrap.append(list); return wrap;
}

function booksContent() {
  const wrap = el('app-main');
  const grid = el('photos-grid'); grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(110px,1fr))';
  const titles = ['The Pragmatic Coder', 'Clean Pixels', 'Refactoring UI', 'Algorithms Illustrated', 'CSS Mastery', 'JS the Good Bits', 'Design Systems', 'The Manager’s Path'];
  const grads = ['#ff9a9e,#fad0c4', '#a18cd1,#fbc2eb', '#84fab0,#8fd3f4', '#ffecd2,#fcb69f', '#a1c4fd,#c2e9fb', '#fbc2eb,#a6c1ee', '#f093fb,#f5576c', '#4facfe,#00f2fe'];
  titles.forEach((t, i) => {
    const c = el('photo-cell');
    c.style.aspectRatio = '2/3';
    c.style.background = `linear-gradient(135deg,${grads[i % grads.length]})`;
    c.style.display = 'flex'; c.style.alignItems = 'flex-end'; c.style.padding = '8px';
    c.style.color = '#fff'; c.style.fontSize = '12px'; c.style.fontWeight = '700';
    c.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    c.textContent = t;
    grid.append(c);
  });
  wrap.append(grid); return wrap;
}

/* =========================================================
   The 54-app registry
   ========================================================= */
const C = (fn) => fn; // identity, for readability

export const APPS = [
  { id: 'finder', name: 'Finder', icon: 'ic-finder', glyph: '🙂', cat: 'system', size: [760, 480], content: C(finderContent) },
  { id: 'safari', name: 'Safari', icon: 'ic-safari', glyph: '🧭', cat: 'internet', size: [900, 600], content: () => createSafari() },
  { id: 'mail', name: 'Mail', icon: 'ic-mail', glyph: '✉️', cat: 'internet', size: [820, 540], content: mailContent },
  { id: 'messages', name: 'Messages', icon: 'ic-messages', glyph: '💬', cat: 'internet', size: [760, 520], content: messagesContent },
  { id: 'maps', name: 'Maps', icon: 'ic-maps', glyph: '🗺️', cat: 'internet', size: [800, 560], content: mapsContent },
  { id: 'photos', name: 'Photos', icon: 'ic-photos', glyph: '🌸', cat: 'media', size: [820, 560], content: photosContent },
  { id: 'facetime', name: 'FaceTime', icon: 'ic-facetime', glyph: '📹', cat: 'internet', size: [560, 600], content: facetimeContent },
  { id: 'calendar', name: 'Calendar', icon: 'ic-calendar', glyph: '📅', cat: 'productivity', size: [820, 560], content: calendarContent },  { id: 'reminders', name: 'Reminders', icon: 'ic-reminders', glyph: '☑️', cat: 'productivity', size: [560, 480], content: remindersContent },
  { id: 'notes', name: 'Notes', icon: 'ic-notes', glyph: '📝', cat: 'productivity', size: [720, 500], content: notesContent },  { id: 'music', name: 'Music', icon: 'ic-music', glyph: '🎵', cat: 'media', size: [760, 580], content: musicAppContent },
  { id: 'podcasts', name: 'Podcasts', icon: 'ic-podcasts', glyph: '🎙️', cat: 'media', size: [760, 540], content: podcastsContent },
  { id: 'news', name: 'News', icon: 'ic-news', glyph: '📰', cat: 'internet', size: [760, 560], content: newsContent },
  { id: 'stocks', name: 'Stocks', icon: 'ic-stocks', glyph: '📈', cat: 'productivity', size: [680, 520], content: stocksContent },
  { id: 'home', name: 'Home', icon: 'ic-home', glyph: '🏠', cat: 'system', size: [720, 520], content: homeContent },  { id: 'preview', name: 'Preview', icon: 'ic-generic', glyph: '🖼️', cat: 'productivity', size: [720, 540], content: previewContent },
  { id: 'textedit', name: 'TextEdit', icon: 'ic-generic', glyph: '📄', cat: 'productivity', size: [640, 520], content: textEditContent },
  { id: 'calculator', name: 'Calculator', icon: 'ic-calc', glyph: '🧮', cat: 'productivity', size: [300, 460], content: calculatorContent, fixed: true },
  { id: 'dictionary', name: 'Dictionary', icon: 'ic-graphite', glyph: '📖', cat: 'productivity', size: [640, 480], content: dictionaryContent },
  { id: 'clock', name: 'Clock', icon: 'ic-clock', glyph: '⏰', cat: 'system', size: [560, 460], content: clockContent },
  { id: 'weather', name: 'Weather', icon: 'ic-weather', glyph: '⛅', cat: 'system', size: [420, 560], content: weatherContent },
  { id: 'books', name: 'Books', icon: 'ic-books', glyph: '📚', cat: 'media', size: [820, 600], content: booksAppContent },
  { id: 'appstore', name: 'App Store', icon: 'ic-appstore', glyph: 'A', cat: 'internet', size: [780, 560], content: appStoreContent },
  { id: 'settings', name: 'System Settings', icon: 'ic-settings', glyph: '⚙️', cat: 'system', size: [780, 540], content: settingsContent },
  { id: 'terminal', name: 'Terminal', icon: 'ic-terminal', glyph: '>_', cat: 'dev', size: [680, 440], content: terminalContent },
  { id: 'activity', name: 'Activity Monitor', icon: 'ic-graphite', glyph: '💹', cat: 'dev', size: [720, 500], content: activityContent },
  { id: 'diskutil', name: 'Disk Utility', icon: 'ic-generic', glyph: '💽', cat: 'dev', size: [720, 480], content: diskutilityContent },
  { id: 'console', name: 'Console', icon: 'ic-graphite', glyph: '📜', cat: 'dev', size: [720, 480], content: placeholder({ name: 'Console', glyph: '📜', blurb: 'View system logs.' }) },
  { id: 'keychain', name: 'Keychain Access', icon: 'ic-graphite', glyph: '🔑', cat: 'dev', size: [680, 480], content: placeholder({ name: 'Keychain Access', glyph: '🔑', blurb: 'Manage passwords and certificates.' }) },
  { id: 'screenshot', name: 'Screenshot', icon: 'ic-graphite', glyph: '📷', cat: 'system', size: [520, 360], content: placeholder({ name: 'Screenshot', glyph: '📷', blurb: 'Capture your screen.' }) },
  { id: 'automator', name: 'Automator', icon: 'ic-purple', glyph: '🤖', cat: 'dev', size: [720, 520], content: placeholder({ name: 'Automator', glyph: '🤖', blurb: 'Automate repetitive tasks.' }) },
  { id: 'quicktime', name: 'QuickTime Player', icon: 'ic-indigo', glyph: '▶', cat: 'media', size: [720, 480], content: placeholder({ name: 'QuickTime Player', glyph: '▶', blurb: 'Play, record, and trim media.' }) },
  { id: 'fontbook', name: 'Font Book', icon: 'ic-generic', glyph: 'Aa', cat: 'productivity', size: [720, 500], content: placeholder({ name: 'Font Book', glyph: 'Aa', blurb: 'Install and manage fonts.' }) },
  { id: 'imagecapture', name: 'Image Capture', icon: 'ic-teal', glyph: '🎞️', cat: 'media', size: [680, 480], content: placeholder({ name: 'Image Capture', glyph: '🎞️', blurb: 'Import photos from devices.' }) },
  { id: 'colorsync', name: 'ColorSync Utility', icon: 'ic-creative', glyph: '🎨', cat: 'dev', size: [640, 480], content: placeholder({ name: 'ColorSync Utility', glyph: '🎨', blurb: 'Inspect and repair color profiles.' }) },
  { id: 'grapher', name: 'Grapher', icon: 'ic-teal', glyph: 'ƒx', cat: 'dev', size: [720, 520], content: grapherContent },
  { id: 'chess', name: 'Chess', icon: 'ic-graphite', glyph: '♞', cat: 'media', size: [520, 560], content: chessAppContent },
  { id: 'halcyon', name: 'Halcyon', icon: 'ic-graphite', glyph: '🎧', cat: 'media', size: [360, 640], content: halcyonContent },
  { id: 'missioncontrol', name: 'Mission Control', icon: 'ic-graphite', glyph: '🪟', cat: 'system', size: [720, 480], content: missionControlLauncher },
  { id: 'siri', name: 'Siri', icon: 'ic-creative', glyph: '🌀', cat: 'system', size: [460, 440], content: siriContent },
  { id: 'timemachine', name: 'Time Machine', icon: 'ic-graphite', glyph: '🕰️', cat: 'system', size: [720, 500], content: timemachineContent },
  { id: 'sysinfo', name: 'System Information', icon: 'ic-generic', glyph: 'ℹ️', cat: 'system', size: [720, 500], content: sysInfoContent },
];

function activityContent() {
  const wrap = el('app-main');
  const list = el('list-app');
  list.append(setHTML('list-row', '<span><strong>Process</strong></span><span class="lr-right"><strong>% CPU</strong></span>'));
  [['WindowServer', '4.2'], ['Safari', '8.1'], ['Dock', '1.0'], ['Finder', '0.6'], ['kernel_task', '3.3'], ['Music', '2.4']].forEach(([p, c]) => {
    list.append(setHTML('list-row', `<span>${p}</span><span class="lr-right">${c}</span>`));
  });
  wrap.append(list); return wrap;
}

function numbersContent() {
  const wrap = el('app-main'); wrap.style.padding = '0';
  const tbl = el(null, 'table'); tbl.style.cssText = 'border-collapse:collapse;width:100%;font-size:13px';
  const cols = ['', 'A', 'B', 'C', 'D'];
  let html = '<tr>' + cols.map((c) => `<th style="background:#f5f5f7;border:0.5px solid #ddd;padding:6px 10px;color:#888;font-weight:600">${c}</th>`).join('') + '</tr>';
  const data = [['Item', 'Qty', 'Price', 'Total'], ['Coffee', '2', '4.50', '9.00'], ['Milk', '1', '3.20', '3.20'], ['Bread', '3', '2.00', '6.00']];
  for (let r = 0; r < 8; r++) {
    html += '<tr><td style="background:#f5f5f7;border:0.5px solid #ddd;padding:6px 10px;color:#888;text-align:center">' + (r + 1) + '</td>';
    for (let c = 0; c < 4; c++) html += `<td style="border:0.5px solid #e5e5e5;padding:6px 10px;color:#1c1c1e">${data[r] ? (data[r][c] || '') : ''}</td>`;
    html += '</tr>';
  }
  tbl.innerHTML = html;
  wrap.append(tbl); return wrap;
}

function chessContent() {
  const wrap = el('app-main'); wrap.style.display = 'flex'; wrap.style.alignItems = 'center'; wrap.style.justifyContent = 'center'; wrap.style.background = '#3a2a1a';
  const board = el(null); board.style.cssText = 'display:grid;grid-template-columns:repeat(8,46px);grid-template-rows:repeat(8,46px);box-shadow:0 10px 30px rgba(0,0,0,0.4)';
  const back = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const sq = el(null); const dark = (r + c) % 2 === 1;
    sq.style.cssText = `display:flex;align-items:center;justify-content:center;font-size:30px;background:${dark ? '#b58863' : '#f0d9b5'}`;
    if (r === 0) { sq.textContent = back[c]; sq.style.color = '#222'; }
    else if (r === 1) { sq.textContent = '♟'; sq.style.color = '#222'; }
    else if (r === 6) { sq.textContent = '♟'; sq.style.color = '#fff'; }
    else if (r === 7) { sq.textContent = back[c]; sq.style.color = '#fff'; }
    board.append(sq);
  }
  wrap.append(board); return wrap;
}

// The Mission Control "app" doesn't open a window — it triggers the real
// Mission Control overview, then closes its own (transient) window.
function missionControlLauncher(win, api) {
  const c = el('wb-center');
  c.innerHTML = '<div class="big-glyph">🪟</div><h2>Mission Control</h2><p>Opening overview…</p>';
  setTimeout(() => {
    import('./state.js').then(({ emit }) => emit('os:toggle-mission-control'));
    api.close();
  }, 30);
  return c;
}

function sysInfoContent() {
  const wrap = el('app-main');
  const list = el('list-app');
  [['Model Name', 'MacBook Pro'], ['Chip', 'Apple Silicon (emulated)'], ['Total Number of Cores', '12'], ['Memory', '16 GB'], ['macOS', 'Sequoia 15.0 (Web Clone)'], ['Serial Number', 'C0FFEE2026'], ['Apps Installed', String(APPS.length)]].forEach(([k, v]) => {
    list.append(setHTML('list-row', `<span style="color:#888">${k}</span><span>${v}</span>`));
  });
  wrap.append(list); return wrap;
}

export const APP_MAP = Object.fromEntries(APPS.map((a) => [a.id, a]));

// Dock layout: app ids + 'sep' + specials.
export const DOCK_LAYOUT = [
  'finder', 'launchpad', 'safari', 'mail', 'messages', 'maps', 'photos',
  'facetime', 'calendar', 'notes', 'reminders', 'music',
  'podcasts', 'halcyon', 'appstore', 'settings', 'terminal', 'sep', 'trash',
];
