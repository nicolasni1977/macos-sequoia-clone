// js/apps/finder.js — Full macOS Finder clone
// Self-contained ES module. Import only from dom.js and use the api object.
import { el, setHTML } from '../dom.js';
import { addToTrash } from '../trash.js';
import { on } from '../state.js';
import { iconHTML } from '../icons.js';

/* =========================================================
   Mock Filesystem
   ========================================================= */

const FS = {
  '/': {
    type: 'folder',
    children: {
      Applications: { type: 'folder', children: {} },
      Desktop: { type: 'folder', children: {} },
      Documents: { type: 'folder', children: {} },
      Downloads: { type: 'folder', children: {} },
      Music: { type: 'folder', children: {} },
      Pictures: { type: 'folder', children: {} },
      Movies: { type: 'folder', children: {} },
      Library: { type: 'folder', children: {} },
      Public: { type: 'folder', children: {} },
    },
  },
};

// Pre-populate each folder with mock data
function buildFS() {
  const apps = [
    { name: 'Safari', glyph: '🧭', kind: 'Application', size: '74 MB', appId: 'safari' },
    { name: 'Mail', glyph: '✉️', kind: 'Application', size: '52 MB', appId: 'mail' },
    { name: 'Messages', glyph: '💬', kind: 'Application', size: '48 MB', appId: 'messages' },
    { name: 'Maps', glyph: '🗺️', kind: 'Application', size: '120 MB', appId: 'maps' },
    { name: 'Photos', glyph: '🌸', kind: 'Application', size: '145 MB', appId: 'photos' },
    { name: 'Calendar', glyph: '📅', kind: 'Application', size: '38 MB', appId: 'calendar' },
    { name: 'Notes', glyph: '📝', kind: 'Application', size: '29 MB', appId: 'notes' },
    { name: 'Reminders', glyph: '☑️', kind: 'Application', size: '22 MB', appId: 'reminders' },
    { name: 'Music', glyph: '🎵', kind: 'Application', size: '188 MB', appId: 'music' },
    { name: 'Calculator', glyph: '🧮', kind: 'Application', size: '5 MB', appId: 'calculator' },
    { name: 'Terminal', glyph: '>_', kind: 'Application', size: '8 MB', appId: 'terminal' },
    { name: 'System Settings', glyph: '⚙️', kind: 'Application', size: '42 MB', appId: 'settings' },
    { name: 'Clock', glyph: '⏰', kind: 'Application', size: '12 MB', appId: 'clock' },
    { name: 'Weather', glyph: '⛅', kind: 'Application', size: '18 MB', appId: 'weather' },
    { name: 'App Store', glyph: 'A', kind: 'Application', size: '60 MB', appId: 'appstore' },
    { name: 'Books', glyph: '📚', kind: 'Application', size: '90 MB', appId: 'books' },
    { name: 'Contacts', glyph: '👤', kind: 'Application', size: '14 MB', appId: 'contacts' },
    { name: 'FaceTime', glyph: '📹', kind: 'Application', size: '55 MB', appId: 'facetime' },
    { name: 'TV', glyph: '📺', kind: 'Application', size: '210 MB', appId: 'tv' },
    { name: 'Podcasts', glyph: '🎙️', kind: 'Application', size: '44 MB', appId: 'podcasts' },
    { name: 'News', glyph: '📰', kind: 'Application', size: '32 MB', appId: 'news' },
    { name: 'Stocks', glyph: '📈', kind: 'Application', size: '16 MB', appId: 'stocks' },
    { name: 'Numbers', glyph: '📊', kind: 'Application', size: '68 MB', appId: 'numbers' },
    { name: 'Pages', glyph: '✍️', kind: 'Application', size: '72 MB', appId: 'pages' },
    { name: 'Keynote', glyph: '📽️', kind: 'Application', size: '88 MB', appId: 'keynote' },
    { name: 'Preview', glyph: '🖼️', kind: 'Application', size: '26 MB', appId: 'preview' },
    { name: 'TextEdit', glyph: '📄', kind: 'Application', size: '7 MB', appId: 'textedit' },
    { name: 'Chess', glyph: '♞', kind: 'Application', size: '4 MB', appId: 'chess' },
    { name: 'Activity Monitor', glyph: '💹', kind: 'Application', size: '11 MB', appId: 'activity' },
    { name: 'Stickies', glyph: '🗒️', kind: 'Application', size: '3 MB', appId: 'stickies' },
  ];

  FS['/'].children['Applications'] = {
    type: 'folder',
    glyph: '📦',
    children: Object.fromEntries(apps.map(a => [a.name + '.app', { type: 'app', ...a }])),
  };

  FS['/'].children['Projects'] = {
    type: 'folder',
    glyph: '📁',
    children: {
      'macOS Clone': { type: 'folder', glyph: '📁', kind: 'Folder', children: {
        'index.html': { type: 'file', glyph: '🌐', kind: 'HTML Document', size: '6 KB' },
        'README.md': { type: 'file', glyph: '📄', kind: 'Markdown', size: '3 KB' },
      } },
      'Portfolio Site': { type: 'folder', glyph: '📁', kind: 'Folder', children: {} },
      'Designs': { type: 'folder', glyph: '🎨', kind: 'Folder', children: {} },
      'Roadmap.md': { type: 'file', glyph: '📄', kind: 'Markdown', size: '5 KB' },
      'Budget.numbers': { type: 'file', glyph: '📊', kind: 'Numbers', size: '18 KB' },
      'Mockup.png': { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '1.2 MB' },
      'Notes.txt': { type: 'file', glyph: '📄', kind: 'Plain Text', size: '2 KB' },
    },
  };

  FS['/'].children['Desktop'] = {
    type: 'folder',
    children: {
      'Project.folder': { type: 'folder', glyph: '📁', children: {
        'design-v1.png': { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '2.4 MB', ext: 'png' },
        'design-v2.png': { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '2.6 MB', ext: 'png' },
        'notes.md': { type: 'file', glyph: '📄', kind: 'Markdown', size: '12 KB', ext: 'md' },
      }},
      'Wallpaper.heic': { type: 'file', glyph: '🖼️', kind: 'HEIC image', size: '5.8 MB', ext: 'heic' },
      'todo.md': { type: 'file', glyph: '📄', kind: 'Markdown', size: '4 KB', ext: 'md' },
      'Screenshot 2026.png': { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '3.1 MB', ext: 'png' },
    },
  };

  FS['/'].children['Documents'] = {
    type: 'folder',
    children: {
      'Work': { type: 'folder', glyph: '📁', children: {
        'Resume.pdf': { type: 'file', glyph: '📕', kind: 'PDF Document', size: '256 KB', ext: 'pdf' },
        'Cover Letter.pages': { type: 'file', glyph: '📄', kind: 'Pages Document', size: '128 KB', ext: 'pages' },
        'Portfolio.pdf': { type: 'file', glyph: '📕', kind: 'PDF Document', size: '4.2 MB', ext: 'pdf' },
      }},
      'Personal': { type: 'folder', glyph: '📁', children: {
        'Journal.txt': { type: 'file', glyph: '📄', kind: 'Plain Text', size: '48 KB', ext: 'txt' },
        'Budget 2026.numbers': { type: 'file', glyph: '📊', kind: 'Numbers Spreadsheet', size: '88 KB', ext: 'numbers' },
        'Trip Plan.pages': { type: 'file', glyph: '📄', kind: 'Pages Document', size: '320 KB', ext: 'pages' },
      }},
      'Budget.numbers': { type: 'file', glyph: '📊', kind: 'Numbers Spreadsheet', size: '92 KB', ext: 'numbers' },
      'Meeting Notes.txt': { type: 'file', glyph: '📄', kind: 'Plain Text', size: '18 KB', ext: 'txt' },
      'Project Proposal.pdf': { type: 'file', glyph: '📕', kind: 'PDF Document', size: '1.1 MB', ext: 'pdf' },
    },
  };

  FS['/'].children['Downloads'] = {
    type: 'folder',
    children: {
      'installer.dmg': { type: 'file', glyph: '🗜️', kind: 'Disk Image', size: '128 MB', ext: 'dmg' },
      'photo-album.zip': { type: 'file', glyph: '🗜️', kind: 'ZIP Archive', size: '24 MB', ext: 'zip' },
      'song.m4a': { type: 'file', glyph: '🎵', kind: 'Audio', size: '8 MB', ext: 'm4a' },
      'report.pdf': { type: 'file', glyph: '📕', kind: 'PDF Document', size: '540 KB', ext: 'pdf' },
      'vacation.jpg': { type: 'file', glyph: '🖼️', kind: 'JPEG image', size: '4.8 MB', ext: 'jpg' },
    },
  };

  FS['/'].children['Music'] = {
    type: 'folder',
    children: {
      'Synthwave Vol. 1': { type: 'folder', glyph: '💿', children: {
        'Neon Skyline.m4a': { type: 'file', glyph: '🎵', kind: 'Audio', size: '9 MB', ext: 'm4a' },
        'Midnight Compiler.m4a': { type: 'file', glyph: '🎵', kind: 'Audio', size: '10 MB', ext: 'm4a' },
        'Pixel Dreams.m4a': { type: 'file', glyph: '🎵', kind: 'Audio', size: '7 MB', ext: 'm4a' },
      }},
      'Playlists': { type: 'folder', glyph: '📋', children: {
        'Chill Mix.m4a': { type: 'file', glyph: '🎵', kind: 'Audio', size: '11 MB', ext: 'm4a' },
      }},
    },
  };

  FS['/'].children['Pictures'] = {
    type: 'folder',
    children: {
      'Vacation 2025': { type: 'folder', glyph: '🏖️', children: {
        'beach.jpg': { type: 'file', glyph: '🖼️', kind: 'JPEG image', size: '3.2 MB', ext: 'jpg' },
        'sunset.jpg': { type: 'file', glyph: '🖼️', kind: 'JPEG image', size: '2.8 MB', ext: 'jpg' },
        'group-photo.jpg': { type: 'file', glyph: '🖼️', kind: 'JPEG image', size: '4.1 MB', ext: 'jpg' },
      }},
      'Screenshots': { type: 'folder', glyph: '📷', children: {
        'Screenshot 2026-01-15.png': { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '1.8 MB', ext: 'png' },
        'Screenshot 2026-02-03.png': { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '2.2 MB', ext: 'png' },
      }},
      'wallpaper.heic': { type: 'file', glyph: '🖼️', kind: 'HEIC image', size: '8.4 MB', ext: 'heic' },
    },
  };

  FS['/'].children['Movies'] = {
    type: 'folder',
    children: {
      'Holiday Reel.mov': { type: 'file', glyph: '🎬', kind: 'QuickTime Movie', size: '2.1 GB', ext: 'mov' },
      'Tutorial.mp4': { type: 'file', glyph: '🎬', kind: 'MPEG-4 Movie', size: '880 MB', ext: 'mp4' },
    },
  };

  FS['/'].children['Library'] = {
    type: 'folder',
    children: {
      'Application Support': { type: 'folder', glyph: '📁', children: {} },
      'Preferences': { type: 'folder', glyph: '📁', children: {} },
      'Caches': { type: 'folder', glyph: '📁', children: {} },
    },
  };
}

buildFS();

/* =========================================================
   Helpers
   ========================================================= */

function nodeGlyph(node, name) {
  if (node.glyph) return node.glyph;
  if (node.type === 'folder') return '📁';
  if (node.type === 'app') return '🚀';
  const ext = (name || '').split('.').pop().toLowerCase();
  const map = { pdf: '📕', numbers: '📊', xlsx: '📊', csv: '📊', pages: '📄', docx: '📄', md: '📄', txt: '📄', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', heic: '🖼️', gif: '🖼️', zip: '🗜️', dmg: '🗜️', m4a: '🎵', mp3: '🎵', wav: '🎵', mov: '🎬', mp4: '🎬' };
  return map[ext] || '📄';
}

function resolveNode(path) {
  // path like ['Applications'] navigates from '/' children
  let current = FS['/'];
  for (const seg of path) {
    if (!current || !current.children) return null;
    current = current.children[seg];
  }
  return current;
}

function quickLookFor(name, node) {
  if (!node) return null;
  if (node.type === 'app') {
    return { type: 'info', title: node.name || name, glyph: node.glyph || '🚀', name: node.name || name,
      rows: [['Kind', 'Application'], ['Size', node.size || '—'], ['Location', 'Applications']] };
  }
  if (node.type === 'folder') {
    const childCount = node.children ? Object.keys(node.children).length : 0;
    return { type: 'info', title: name, glyph: node.glyph || '📁', name,
      rows: [['Kind', 'Folder'], ['Items', String(childCount)], ['Created', 'Today']] };
  }
  const ext = (name || '').split('.').pop().toLowerCase();
  if (/^(png|jpg|jpeg|heic|gif)$/.test(ext)) {
    const grads = ['#ff9a9e,#fad0c4', '#a18cd1,#fbc2eb', '#84fab0,#8fd3f4', '#a1c4fd,#c2e9fb'];
    const g = grads[name.length % grads.length];
    return { type: 'image', title: name, gradient: `linear-gradient(135deg,${g})`, caption: name };
  }
  if (/^(pdf|pages|docx|md|txt)$/.test(ext)) {
    return { type: 'doc', title: name,
      text: `<h1>${name}</h1><p>This is a Quick Look preview of <b>${name}</b>.</p><p>Press Space or Esc to close.</p>` };
  }
  return { type: 'info', title: name, glyph: nodeGlyph(node, name), name,
    rows: [['Kind', node.kind || 'Document'], ['Size', node.size || '—'], ['Created', 'Today']] };
}

/* =========================================================
   Main content function
   ========================================================= */

export function content(win, api) {
  // ---- State ----
  let currentPath = []; // [] = root '/'
  let history = [[]];
  let histIdx = 0;
  let view = api.load('view', 'icon'); // 'icon' | 'list' | 'column' | 'gallery'
  let searchQuery = '';
  let trash = []; // names moved to trash

  // Sidebar "locations" = virtual paths
  const SIDEBAR_ITEMS = [
    { section: 'Favorites' },
    { id: 'recents', label: 'Recents', glyph: '🕘', virtual: true },
    { id: 'applications', label: 'Applications', path: ['Applications'] },
    { id: 'desktop', label: 'Desktop', path: ['Desktop'] },
    { id: 'documents', label: 'Documents', path: ['Documents'] },
    { id: 'downloads', label: 'Downloads', path: ['Downloads'] },
    { section: 'iCloud' },
    { id: 'icloud-drive', label: 'iCloud Drive', glyph: '☁️', virtual: true },
    { id: 'icloud-docs', label: 'Documents', glyph: '📄', virtual: true },
    { id: 'icloud-desktop', label: 'Desktop', glyph: '🖥️', virtual: true },
    { section: 'Locations' },
    { id: 'macintosh-hd', label: 'Macintosh HD', glyph: '💾', path: [] },
    { id: 'network', label: 'Network', glyph: '🌐', virtual: true },
    { section: 'Tags' },
    { id: 'tag-red', label: 'Red', glyph: '🔴', virtual: true },
    { id: 'tag-green', label: 'Green', glyph: '🟢', virtual: true },
    { id: 'tag-blue', label: 'Blue', glyph: '🔵', virtual: true },
    { id: 'tag-yellow', label: 'Yellow', glyph: '🟡', virtual: true },
  ];

  const VIRTUAL_DATA = {
    recents: [
      { name: 'Resume.pdf', node: { type: 'file', glyph: '📕', kind: 'PDF Document', size: '256 KB' } },
      { name: 'vacation.jpg', node: { type: 'file', glyph: '🖼️', kind: 'JPEG image', size: '4.8 MB' } },
      { name: 'Trip Plan.pages', node: { type: 'file', glyph: '📄', kind: 'Pages Document', size: '320 KB' } },
      { name: 'Budget.numbers', node: { type: 'file', glyph: '📊', kind: 'Numbers Spreadsheet', size: '92 KB' } },
      { name: 'installer.dmg', node: { type: 'file', glyph: '🗜️', kind: 'Disk Image', size: '128 MB' } },
      { name: 'design-v2.png', node: { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '2.6 MB' } },
    ],
    'icloud-drive': [
      { name: 'Family', node: { type: 'folder', glyph: '👨‍👩‍👧', children: {} } },
      { name: 'Work', node: { type: 'folder', glyph: '💼', children: {} } },
      { name: 'Archive', node: { type: 'folder', glyph: '🗃️', children: {} } },
    ],
    'icloud-docs': [
      { name: 'Shared Notes.pages', node: { type: 'file', glyph: '📄', kind: 'Pages Document', size: '210 KB' } },
      { name: 'Budget Cloud.numbers', node: { type: 'file', glyph: '📊', kind: 'Numbers Spreadsheet', size: '65 KB' } },
    ],
    'icloud-desktop': [
      { name: 'Screenshot iCloud.png', node: { type: 'file', glyph: '🖼️', kind: 'PNG image', size: '1.2 MB' } },
      { name: 'Notes.md', node: { type: 'file', glyph: '📄', kind: 'Markdown', size: '8 KB' } },
    ],
    network: [
      { name: 'Time Capsule', node: { type: 'folder', glyph: '📡', children: {} } },
    ],
    'tag-red': [
      { name: 'Resume.pdf', node: { type: 'file', glyph: '📕', kind: 'PDF Document', size: '256 KB' } },
    ],
    'tag-green': [],
    'tag-blue': [
      { name: 'Budget.numbers', node: { type: 'file', glyph: '📊', kind: 'Numbers Spreadsheet', size: '92 KB' } },
    ],
    'tag-yellow': [],
  };

  let activeSidebarId = 'applications';
  let virtualContext = null; // non-null when showing virtual (recents, icloud, etc.)
  let selectedName = null;

  // ---- DOM Build ----
  const root = el('finder-root');

  // Toolbar
  const toolbar = el('finder-toolbar');
  toolbar.innerHTML = `
    <div class="ft-nav">
      <button class="ft-btn ft-back" title="Back">&#8249;</button>
      <button class="ft-btn ft-forward" title="Forward">&#8250;</button>
    </div>
    <div class="ft-breadcrumb"></div>
    <div class="ft-spacer"></div>
    <div class="ft-search-wrap">
      <span class="ft-search-icon">🔍</span>
      <input class="ft-search" type="text" placeholder="Search" autocomplete="off" autocorrect="off" spellcheck="false"/>
    </div>
    <div class="ft-view-switcher">
      <button class="ftv-btn" data-view="icon" title="Icon View">⊞</button>
      <button class="ftv-btn" data-view="list" title="List View">≡</button>
      <button class="ftv-btn" data-view="column" title="Column View">⫴</button>
      <button class="ftv-btn" data-view="gallery" title="Gallery View">□</button>
    </div>
  `;

  // Body split: sidebar + main
  const body = el('finder-body');
  const sidebar = el('finder-sidebar');
  const mainWrap = el('finder-main-wrap');
  const mainArea = el('finder-main');
  const statusBar = el('finder-status-bar');
  mainWrap.append(mainArea, statusBar);
  body.append(sidebar, mainWrap);

  // Column view panes container
  const columnWrap = el('finder-column-wrap');
  mainArea.append(columnWrap);

  root.append(toolbar, body);

  // ---- Rename Modal ----
  let renameTarget = null;
  const renameModal = el('finder-rename-modal');
  renameModal.innerHTML = `<div class="frm-inner"><label>Rename</label><input class="frm-input" type="text"/><div class="frm-btns"><button class="frm-cancel">Cancel</button><button class="frm-ok">OK</button></div></div>`;
  root.append(renameModal);

  const renameInput = renameModal.querySelector('.frm-input');
  renameModal.querySelector('.frm-cancel').addEventListener('click', () => renameModal.classList.remove('show'));
  renameModal.querySelector('.frm-ok').addEventListener('click', doRename);
  renameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') renameModal.classList.remove('show'); });

  function openRename(name) {
    renameTarget = name;
    renameInput.value = name;
    renameModal.classList.add('show');
    setTimeout(() => { renameInput.focus(); renameInput.select(); }, 60);
  }

  function doRename() {
    if (!renameTarget) return;
    const newName = renameInput.value.trim();
    if (!newName || newName === renameTarget) { renameModal.classList.remove('show'); return; }
    // Rename in filesystem
    if (!virtualContext) {
      const parentNode = resolveNode(currentPath);
      if (parentNode && parentNode.children && parentNode.children[renameTarget]) {
        const n = parentNode.children[renameTarget];
        delete parentNode.children[renameTarget];
        parentNode.children[newName] = n;
      }
    }
    renameModal.classList.remove('show');
    api.toast(`Renamed to "${newName}"`);
    renderMain();
  }

  // ---- Sidebar ----
  buildSidebar();

  function buildSidebar() {
    sidebar.innerHTML = '';
    SIDEBAR_ITEMS.forEach((item) => {
      if (item.section) {
        const s = el('finder-sb-section');
        s.textContent = item.section;
        sidebar.append(s);
        return;
      }
      const row = el('finder-sb-row');
      row.dataset.id = item.id;
      if (item.id === activeSidebarId) row.classList.add('active');
      const g = el('finder-sb-glyph');
      if (item.path !== undefined) {
        // Derive glyph from path
        const map = { '': '💾', Applications: '📦', Desktop: '🖥️', Documents: '📄', Downloads: '⬇️', Music: '🎵', Pictures: '🖼️', Movies: '🎬', Public: '📁' };
        const key = item.path[0] || '';
        g.textContent = map[key] || item.glyph || '📁';
      } else {
        g.textContent = item.glyph || '📁';
      }
      const label = el('finder-sb-label');
      label.textContent = item.label;
      row.append(g, label);
      row.addEventListener('click', () => sidebarNavigate(item));
      sidebar.append(row);
    });
  }

  function sidebarNavigate(item) {
    activeSidebarId = item.id;
    virtualContext = null;
    buildSidebar();
    if (item.virtual) {
      virtualContext = item.id;
      // Don't change history path for virtual
      searchQuery = '';
      toolbar.querySelector('.ft-search').value = '';
      renderMain();
      updateToolbar();
      updateStatus();
    } else if (item.path !== undefined) {
      navigateTo(item.path, false);
    }
  }

  // ---- Navigation ----
  function navigateTo(path, addHistory = true) {
    virtualContext = null;
    searchQuery = '';
    toolbar.querySelector('.ft-search').value = '';
    currentPath = path.slice();
    if (addHistory) {
      history = history.slice(0, histIdx + 1);
      history.push(currentPath.slice());
      histIdx = history.length - 1;
    }
    renderMain();
    updateToolbar();
    updateStatus();
  }

  function goBack() {
    if (histIdx <= 0) return;
    histIdx--;
    currentPath = history[histIdx].slice();
    virtualContext = null;
    searchQuery = '';
    toolbar.querySelector('.ft-search').value = '';
    renderMain();
    updateToolbar();
    updateStatus();
  }

  function goForward() {
    if (histIdx >= history.length - 1) return;
    histIdx++;
    currentPath = history[histIdx].slice();
    virtualContext = null;
    searchQuery = '';
    toolbar.querySelector('.ft-search').value = '';
    renderMain();
    updateToolbar();
    updateStatus();
  }

  // ---- Toolbar wiring ----
  toolbar.querySelector('.ft-back').addEventListener('click', goBack);
  toolbar.querySelector('.ft-forward').addEventListener('click', goForward);

  toolbar.querySelectorAll('.ftv-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      view = btn.dataset.view;
      api.store('view', view);
      renderMain();
    });
  });

  const searchInput = toolbar.querySelector('.ft-search');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderMain();
    updateStatus();
  });
  searchInput.addEventListener('focus', () => searchInput.parentElement.classList.add('focused'));
  searchInput.addEventListener('blur', () => searchInput.parentElement.classList.remove('focused'));

  function updateToolbar() {
    const backBtn = toolbar.querySelector('.ft-back');
    const fwdBtn = toolbar.querySelector('.ft-forward');
    backBtn.disabled = histIdx <= 0;
    fwdBtn.disabled = histIdx >= history.length - 1;
    backBtn.classList.toggle('ft-btn-disabled', histIdx <= 0);
    fwdBtn.classList.toggle('ft-btn-disabled', histIdx >= history.length - 1);

    // Breadcrumb
    const bc = toolbar.querySelector('.ft-breadcrumb');
    bc.innerHTML = '';
    const parts = [{ label: 'Macintosh HD', path: [] }, ...currentPath.map((seg, i) => ({ label: seg, path: currentPath.slice(0, i + 1) }))];
    if (virtualContext) {
      const vItem = SIDEBAR_ITEMS.find(s => s.id === virtualContext);
      bc.innerHTML = `<span class="ft-bc-crumb">${vItem ? vItem.label : virtualContext}</span>`;
      return;
    }
    parts.forEach((p, i) => {
      if (i > 0) {
        const sep = el('ft-bc-sep');
        sep.textContent = '›';
        bc.append(sep);
      }
      const crumb = el('ft-bc-crumb');
      crumb.textContent = p.label;
      if (i < parts.length - 1) {
        crumb.classList.add('ft-bc-link');
        crumb.addEventListener('click', () => navigateTo(p.path));
      }
      bc.append(crumb);
    });

    // Active view button
    toolbar.querySelectorAll('.ftv-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  }

  // ---- Status Bar ----
  function updateStatus() {
    const items = getCurrentItems();
    const count = items.length;
    if (selectedName) {
      const node = items.find(i => i.name === selectedName);
      if (node) {
        const size = node.node && node.node.size ? node.node.size : '—';
        statusBar.textContent = `${count} item${count !== 1 ? 's' : ''}  —  "${selectedName}" selected  ${size !== '—' ? '· ' + size : ''}`;
        return;
      }
    }
    statusBar.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }

  // ---- Get current items ----
  function getCurrentItems() {
    let items = [];
    if (virtualContext) {
      items = (VIRTUAL_DATA[virtualContext] || []).map(i => ({ name: i.name, node: i.node }));
    } else {
      const node = resolveNode(currentPath);
      if (node && node.children) {
        items = Object.entries(node.children).map(([name, n]) => ({ name, node: n }));
      }
    }
    if (searchQuery) {
      items = items.filter(i => i.name.toLowerCase().includes(searchQuery));
    }
    return items;
  }

  // ---- Context Menu ----
  function itemContextMenu(name, node) {
    const isFolder = node && (node.type === 'folder');
    const isApp = node && node.type === 'app';
    return [
      { label: 'Open', act: () => openItem(name, node) },
      { label: 'Quick Look', sh: '⎵', act: () => {
        const ql = quickLookFor(name, node);
        if (ql) api.quickLook(ql);
      }},
      { sep: true },
      { label: 'Get Info', sh: '⌘I', act: () => {
        const ql = quickLookFor(name, node);
        if (ql) api.quickLook(ql);
        else api.toast(`Info: ${name}`);
      }},
      { label: 'Rename', act: () => openRename(name) },
      { label: 'Duplicate', sh: '⌘D', act: () => duplicateItem(name, node) },
      { label: 'New Folder', sh: '⇧⌘N', act: () => newFolder() },
      { sep: true },
      { label: 'Move to Trash', sh: '⌘⌫', danger: true, act: () => moveToTrash(name) },
    ];
  }

  function openItem(name, node) {
    if (!node) return;
    if (node.type === 'app' && node.appId) { api.openApp(node.appId); return; }
    if (node.type === 'folder') {
      if (virtualContext) {
        // Can't navigate into virtual items from virtual context easily; treat as toast
        api.toast(`Opening folder: ${name}`);
        return;
      }
      navigateTo([...currentPath, name]);
      // update active sidebar item
      activeSidebarId = null;
      buildSidebar();
      return;
    }
    api.toast(`Opening ${name}…`);
  }

  function duplicateItem(name, node) {
    if (virtualContext) { api.toast(`Duplicated ${name}`); return; }
    const parentNode = resolveNode(currentPath);
    if (!parentNode || !parentNode.children) return;
    const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
    const base = ext ? name.slice(0, -ext.length) : name;
    const newName = `${base} copy${ext}`;
    parentNode.children[newName] = JSON.parse(JSON.stringify(parentNode.children[name] || {}));
    api.toast(`Duplicated "${name}"`);
    renderMain();
  }

  function newFolder() {
    if (virtualContext) { api.toast('Cannot create folders here.'); return; }
    const parentNode = resolveNode(currentPath);
    if (!parentNode || !parentNode.children) return;
    let folderName = 'untitled folder';
    let n = 1;
    while (parentNode.children[folderName]) { folderName = `untitled folder ${n++}`; }
    parentNode.children[folderName] = { type: 'folder', glyph: '📁', children: {} };
    api.toast(`Created "${folderName}"`);
    renderMain();
    updateStatus();
    // Open rename for the new folder
    setTimeout(() => openRename(folderName), 80);
  }

  function moveToTrash(name) {
    let glyph = '📄', kind = 'Document';
    if (virtualContext) {
      const arr = VIRTUAL_DATA[virtualContext];
      if (arr) {
        const idx = arr.findIndex(i => i.name === name);
        if (idx >= 0) {
          const it = arr[idx];
          glyph = it.glyph || nodeGlyph(it, name);
          kind = it.kind || 'Document';
          arr.splice(idx, 1);
        }
      }
    } else {
      const parentNode = resolveNode(currentPath);
      if (parentNode && parentNode.children && parentNode.children[name]) {
        const node = parentNode.children[name];
        glyph = nodeGlyph(node, name);
        kind = node.kind || (node.type === 'folder' ? 'Folder' : 'Document');
        trash.push({ name, node });
        delete parentNode.children[name];
      }
    }
    // Surface it in the shared, persistent Trash (the Trash window reads this).
    addToTrash({ name, glyph, kind, from: virtualContext || ('/' + currentPath.join('/')) });
    if (selectedName === name) selectedName = null;
    api.toast(`"${name}" moved to Trash`);
    renderMain();
    updateStatus();
  }

  // ---- Render Main Area ----
  function renderMain() {
    mainArea.className = 'finder-main finder-view-' + view;
    mainArea.innerHTML = '';
    if (view === 'column') { renderColumnView(); return; }
    if (view === 'gallery') { renderGalleryView(); return; }

    const items = getCurrentItems();

    if (items.length === 0) {
      const empty = el('finder-empty');
      empty.textContent = searchQuery ? 'No results' : 'This folder is empty';
      mainArea.append(empty);
      return;
    }

    if (view === 'icon') renderIconView(items);
    else if (view === 'list') renderListView(items);
  }

  // --- Icon View ---
  function renderIconView(items) {
    const grid = el('finder-icon-grid');
    items.forEach(({ name, node }) => {
      const file = el('finder-icon-item');
      file.setAttribute('data-quicklook', JSON.stringify(quickLookFor(name, node) || { type: 'info', title: name }));
      if (selectedName === name) file.classList.add('selected');

      const glyph = el('finder-icon-glyph');
      if (node && node.type === 'app' && node.appId) {
        glyph.innerHTML = iconHTML(node.appId, node.name || name);
        glyph.classList.add('is-app', 'is-svg');
      } else {
        glyph.textContent = nodeGlyph(node, name);
        if (node && node.type === 'folder') glyph.classList.add('is-folder');
      }

      const label = el('finder-icon-label');
      label.textContent = name;

      file.append(glyph, label);

      file.addEventListener('click', (e) => {
        e.stopPropagation();
        grid.querySelectorAll('.finder-icon-item.selected').forEach(x => x.classList.remove('selected'));
        file.classList.add('selected');
        selectedName = name;
        updateStatus();
      });

      file.addEventListener('dblclick', () => openItem(name, node));

      file.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        grid.querySelectorAll('.finder-icon-item.selected').forEach(x => x.classList.remove('selected'));
        file.classList.add('selected');
        selectedName = name;
        updateStatus();
        api.contextMenu(itemContextMenu(name, node), e);
      });

      grid.append(file);
    });

    mainArea.addEventListener('click', () => {
      grid.querySelectorAll('.finder-icon-item.selected').forEach(x => x.classList.remove('selected'));
      selectedName = null;
      updateStatus();
    });

    mainArea.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.finder-icon-item')) {
        e.preventDefault();
        api.contextMenu([
          { label: 'New Folder', sh: '⇧⌘N', act: () => newFolder() },
          { label: 'Get Info', disabled: true },
          { sep: true },
          { label: 'Sort By Name', act: () => api.toast('Sorted') },
        ], e);
      }
    });

    mainArea.append(grid);
  }

  // --- List View ---
  function renderListView(items) {
    const table = el('finder-list-table');
    const thead = setHTML('finder-list-thead', `
      <div class="flt-col flt-name">Name</div>
      <div class="flt-col flt-date">Date Modified</div>
      <div class="flt-col flt-size">Size</div>
      <div class="flt-col flt-kind">Kind</div>
    `);
    table.append(thead);

    const tbody = el('finder-list-body');
    items.forEach(({ name, node }) => {
      const row = el('finder-list-row');
      row.setAttribute('data-quicklook', JSON.stringify(quickLookFor(name, node) || { type: 'info', title: name }));
      if (selectedName === name) row.classList.add('selected');

      const kind = (node && node.kind) ? node.kind : (node && node.type === 'folder' ? 'Folder' : node && node.type === 'app' ? 'Application' : 'Document');
      const size = (node && node.size) ? node.size : (node && node.type === 'folder' ? '—' : '—');
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      row.innerHTML = `
        <div class="flt-col flt-name">
          <span class="flt-glyph">${nodeGlyph(node, name)}</span>
          <span class="flt-label">${name}</span>
        </div>
        <div class="flt-col flt-date flt-muted">${today}</div>
        <div class="flt-col flt-size flt-muted">${size}</div>
        <div class="flt-col flt-kind flt-muted">${kind}</div>
      `;

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        tbody.querySelectorAll('.finder-list-row.selected').forEach(x => x.classList.remove('selected'));
        row.classList.add('selected');
        selectedName = name;
        updateStatus();
      });

      row.addEventListener('dblclick', () => openItem(name, node));

      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        tbody.querySelectorAll('.finder-list-row.selected').forEach(x => x.classList.remove('selected'));
        row.classList.add('selected');
        selectedName = name;
        updateStatus();
        api.contextMenu(itemContextMenu(name, node), e);
      });

      tbody.append(row);
    });

    tbody.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.finder-list-row')) {
        e.preventDefault();
        api.contextMenu([
          { label: 'New Folder', sh: '⇧⌘N', act: () => newFolder() },
          { sep: true },
          { label: 'Sort By Name', act: () => api.toast('Sorted') },
        ], e);
      }
    });

    table.append(tbody);
    mainArea.append(table);

    mainArea.addEventListener('click', (e) => {
      if (!e.target.closest('.finder-list-row')) {
        tbody.querySelectorAll('.finder-list-row.selected').forEach(x => x.classList.remove('selected'));
        selectedName = null;
        updateStatus();
      }
    });
  }

  // --- Column View ---
  function renderColumnView() {
    mainArea.innerHTML = '';
    mainArea.append(columnWrap);
    columnWrap.innerHTML = '';

    // Build columns from root to current path
    const pathSegments = [[], ...currentPath.map((_, i) => currentPath.slice(0, i + 1))];
    pathSegments.forEach((path) => {
      appendColumn(path);
    });
    // Scroll to last column
    setTimeout(() => { columnWrap.scrollLeft = columnWrap.scrollWidth; }, 0);
  }

  function appendColumn(path) {
    const col = el('finder-col');
    const node = resolveNode(path);
    if (!node || !node.children) {
      col.innerHTML = '<div class="fc-empty">No items</div>';
      columnWrap.append(col);
      return;
    }
    const items = Object.entries(node.children);
    if (items.length === 0) {
      col.innerHTML = '<div class="fc-empty">Empty</div>';
      columnWrap.append(col);
      return;
    }
    items.forEach(([name, cnode]) => {
      const row = el('finder-col-row');
      // Is this item in the current path?
      const depth = path.length;
      if (currentPath[depth] === name) row.classList.add('selected');

      row.innerHTML = `<span class="fc-glyph">${nodeGlyph(cnode, name)}</span><span class="fc-label">${name}</span>`;
      if (cnode.type === 'folder' || cnode.type === 'app') {
        const arrow = el('fc-arrow');
        arrow.textContent = '›';
        row.append(arrow);
      }
      row.addEventListener('click', () => {
        col.querySelectorAll('.finder-col-row.selected').forEach(x => x.classList.remove('selected'));
        row.classList.add('selected');
        selectedName = name;
        updateStatus();

        // If navigable, extend the path and re-render
        if (cnode.type === 'folder') {
          const newPath = [...path, name];
          currentPath = newPath;
          history = history.slice(0, histIdx + 1);
          history.push(newPath.slice());
          histIdx = history.length - 1;
          updateToolbar();
          // Remove columns after this one and append new
          while (columnWrap.children.length > depth + 1) {
            columnWrap.removeChild(columnWrap.lastChild);
          }
          appendColumn(newPath);
          setTimeout(() => { columnWrap.scrollLeft = columnWrap.scrollWidth; }, 0);
        } else if (cnode.type === 'app') {
          // Show preview panel
          while (columnWrap.children.length > depth + 1) {
            columnWrap.removeChild(columnWrap.lastChild);
          }
          const preview = el('finder-col finder-col-preview');
          preview.innerHTML = `<div class="fcp-glyph">${cnode.glyph || '🚀'}</div><div class="fcp-name">${name}</div><div class="fcp-kind">Application</div><div class="fcp-size">${cnode.size || '—'}</div>`;
          preview.querySelector('.fcp-glyph').style.fontSize = '56px';
          preview.querySelector('.fcp-name').style.fontWeight = '700';
          preview.querySelector('.fcp-kind').style.color = 'var(--win-muted)';
          preview.querySelector('.fcp-size').style.color = 'var(--win-muted)';
          columnWrap.append(preview);
          setTimeout(() => { columnWrap.scrollLeft = columnWrap.scrollWidth; }, 0);
        }
      });
      row.addEventListener('dblclick', () => openItem(name, cnode));
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        api.contextMenu(itemContextMenu(name, cnode), e);
      });
      col.append(row);
    });
    columnWrap.append(col);
  }

  // --- Gallery View ---
  function renderGalleryView() {
    mainArea.innerHTML = '';
    const items = getCurrentItems();
    if (items.length === 0) {
      const empty = el('finder-empty');
      empty.textContent = searchQuery ? 'No results' : 'This folder is empty';
      mainArea.append(empty);
      return;
    }

    const galleryWrap = el('finder-gallery-wrap');
    const preview = el('finder-gallery-preview');
    const filmstrip = el('finder-gallery-strip');

    let activeIdx = 0;

    function showPreview(idx) {
      activeIdx = idx;
      const { name, node } = items[idx];
      preview.innerHTML = '';
      const glyph = el('fg-preview-glyph');
      glyph.textContent = nodeGlyph(node, name);

      const info = el('fg-preview-info');
      const kind = (node && node.kind) ? node.kind : (node && node.type === 'folder' ? 'Folder' : 'Document');
      const size = (node && node.size) ? node.size : '—';
      info.innerHTML = `<div class="fgp-name">${name}</div><div class="fgp-detail">${kind} · ${size}</div>`;

      preview.append(glyph, info);
      selectedName = name;
      updateStatus();

      filmstrip.querySelectorAll('.fg-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
    }

    items.forEach(({ name, node }, i) => {
      const thumb = el('fg-thumb');
      thumb.textContent = nodeGlyph(node, name);
      thumb.title = name;
      if (i === activeIdx) thumb.classList.add('active');
      thumb.addEventListener('click', () => showPreview(i));
      thumb.addEventListener('dblclick', () => openItem(name, node));
      thumb.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        api.contextMenu(itemContextMenu(name, node), e);
      });
      filmstrip.append(thumb);
    });

    galleryWrap.append(preview, filmstrip);
    mainArea.append(galleryWrap);
    showPreview(0);
  }

  // ---- Initial Render ----
  navigateTo(['Applications'], false);
  updateToolbar();
  updateStatus();

  // Desktop icons (Macintosh HD → root, Projects → Projects folder) tell the
  // Finder where to go after opening.
  on('os:finder-navigate', (e) => {
    if (!root.isConnected) return;
    const p = e.detail && e.detail.path;
    if (Array.isArray(p)) navigateTo(p);
  });

  return root;
}
