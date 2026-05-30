// js/apps/photos.js — macOS Photos app
// Self-contained ES module; wired into APPS by the Integrator.
import { el, setHTML } from '../dom.js';

/* ─────────────────────────────────────────────
   Photo data — 18 distinct CSS gradient tiles
   ───────────────────────────────────────────── */
const PHOTOS = [
  { id: 1,  caption: 'Sunset Over the Bay',       date: '2024-08-14', grad: 'linear-gradient(135deg,#f83600,#f9d423)',    month: '2024-08', year: '2024', album: 'Favorites' },
  { id: 2,  caption: 'Alpine Lake Morning',        date: '2024-07-04', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)',    month: '2024-07', year: '2024', album: 'Recents' },
  { id: 3,  caption: 'Cherry Blossom Path',        date: '2024-04-10', grad: 'linear-gradient(135deg,#ff9a9e,#fad0c4)',    month: '2024-04', year: '2024', album: 'Spring' },
  { id: 4,  caption: 'Neon City Reflections',      date: '2024-03-22', grad: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',    month: '2024-03', year: '2024', album: 'City Life' },
  { id: 5,  caption: 'Misty Forest Trail',         date: '2024-02-08', grad: 'linear-gradient(135deg,#84fab0,#8fd3f4)',    month: '2024-02', year: '2024', album: 'Nature' },
  { id: 6,  caption: 'Desert Dunes at Dawn',       date: '2024-01-30', grad: 'linear-gradient(135deg,#ffecd2,#fcb69f)',    month: '2024-01', year: '2024', album: 'Travel' },
  { id: 7,  caption: 'Northern Lights Dance',      date: '2023-12-25', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)',    month: '2023-12', year: '2023', album: 'Favorites' },
  { id: 8,  caption: 'Storm Rolling In',           date: '2023-11-11', grad: 'linear-gradient(135deg,#667eea,#764ba2)',    month: '2023-11', year: '2023', album: 'Nature' },
  { id: 9,  caption: 'Golden Hour Harvest',        date: '2023-10-05', grad: 'linear-gradient(135deg,#f093fb,#f5576c)',    month: '2023-10', year: '2023', album: 'Fall Colors' },
  { id: 10, caption: 'Coastal Tide Pools',         date: '2023-09-18', grad: 'linear-gradient(135deg,#4facfe,#a8edea)',    month: '2023-09', year: '2023', album: 'Travel' },
  { id: 11, caption: 'Wildflower Meadow',          date: '2023-06-21', grad: 'linear-gradient(135deg,#fddb92,#d1fdff)',    month: '2023-06', year: '2023', album: 'Spring' },
  { id: 12, caption: 'Rain on the Window',         date: '2023-05-14', grad: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)',    month: '2023-05', year: '2023', album: 'Recents' },
  { id: 13, caption: 'Volcanic Ridge Hike',        date: '2023-04-02', grad: 'linear-gradient(135deg,#ff6e7f,#bfe9ff)',    month: '2023-04', year: '2023', album: 'Adventures' },
  { id: 14, caption: 'Market Day Citrus',          date: '2023-03-30', grad: 'linear-gradient(135deg,#f7971e,#ffd200)',    month: '2023-03', year: '2023', album: 'City Life' },
  { id: 15, caption: 'Winter Frost Birches',       date: '2023-01-17', grad: 'linear-gradient(135deg,#e0c3fc,#8ec5fc)',    month: '2023-01', year: '2023', album: 'Nature' },
  { id: 16, caption: 'Stargazing in the Valley',  date: '2022-08-12', grad: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', month: '2022-08', year: '2022', album: 'Adventures' },
  { id: 17, caption: 'Zen Garden Stones',          date: '2022-05-05', grad: 'linear-gradient(135deg,#d4fc79,#96e6a1)',    month: '2022-05', year: '2022', album: 'Favorites' },
  { id: 18, caption: 'Fireplace Warmth',           date: '2022-01-01', grad: 'linear-gradient(135deg,#f12711,#f5af19)',    month: '2022-01', year: '2022', album: 'Recents' },
];

const ALBUMS = [
  { id: 'library',   label: 'Library',    icon: '🖼️' },
  { id: 'favorites', label: 'Favorites',  icon: '❤️' },
  { id: 'recents',   label: 'Recents',    icon: '🕐' },
  { id: 'spring',    label: 'Spring',     icon: '🌸' },
  { id: 'nature',    label: 'Nature',     icon: '🌿' },
  { id: 'travel',    label: 'Travel',     icon: '✈️' },
  { id: 'city-life', label: 'City Life',  icon: '🏙️' },
  { id: 'fall-colors', label: 'Fall Colors', icon: '🍂' },
  { id: 'adventures', label: 'Adventures', icon: '⛰️' },
];

const SEGMENTS = ['Years', 'Months', 'Days', 'All'];

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function groupBy(photos, mode) {
  const map = new Map();
  photos.forEach((p) => {
    let key;
    if (mode === 'Years')  key = p.year;
    else if (mode === 'Months') key = p.month;
    else if (mode === 'Days')   key = p.date;
    else key = 'All Photos';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  });
  // Sort keys descending
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function formatGroupLabel(key, mode) {
  if (mode === 'Years')  return key;
  if (mode === 'Months') {
    const [y, m] = key.split('-');
    const names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${names[parseInt(m, 10)]} ${y}`;
  }
  if (mode === 'Days') {
    const d = new Date(key + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  return 'All Photos';
}

/* ─────────────────────────────────────────────
   Main content factory
   ───────────────────────────────────────────── */
export function content(win, api) {
  /* ── Persisted state ── */
  let favorites = new Set(api.load('favorites', []));
  const saveFavorites = () => api.store('favorites', [...favorites]);

  let activeAlbum = api.load('activeAlbum', 'library');
  let activeSegment = api.load('activeSegment', 'All');

  /* ── Root layout ── */
  const root = el('photos-app-root');

  /* ────────────────── SIDEBAR ────────────────── */
  const sidebar = el('ph-sidebar');

  const sidebarSections = [
    { heading: 'Library', items: [ALBUMS[0]] },
    { heading: 'Albums', items: ALBUMS.slice(1) },
  ];

  function buildSidebar() {
    sidebar.innerHTML = '';
    sidebarSections.forEach(({ heading, items }) => {
      const sec = el('ph-sb-section');
      sec.textContent = heading;
      sidebar.append(sec);
      items.forEach((alb) => {
        const row = el('ph-sb-row');
        row.dataset.album = alb.id;
        if (alb.id === activeAlbum) row.classList.add('active');
        row.innerHTML = `<span class="ph-sb-icon">${alb.icon}</span><span>${alb.label}</span>`;
        row.addEventListener('click', () => {
          activeAlbum = alb.id;
          api.store('activeAlbum', activeAlbum);
          sidebar.querySelectorAll('.ph-sb-row').forEach((r) => r.classList.remove('active'));
          row.classList.add('active');
          renderGrid();
        });
        sidebar.append(row);
      });
    });
  }
  buildSidebar();

  /* ────────────────── MAIN AREA ────────────────── */
  const mainArea = el('ph-main');

  /* ── Toolbar: segmented control ── */
  const toolbar = el('ph-toolbar');
  const segCtrl = el('ph-seg-ctrl');

  SEGMENTS.forEach((seg) => {
    const btn = el('ph-seg-btn', 'button');
    btn.textContent = seg;
    if (seg === activeSegment) btn.classList.add('active');
    btn.addEventListener('click', () => {
      activeSegment = seg;
      api.store('activeSegment', activeSegment);
      segCtrl.querySelectorAll('.ph-seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
    segCtrl.append(btn);
  });
  toolbar.append(segCtrl);

  /* ── Grid/scroll area ── */
  const gridArea = el('ph-grid-area');

  mainArea.append(toolbar, gridArea);

  /* ────────────────── GRID RENDER ────────────────── */
  function getFilteredPhotos() {
    if (activeAlbum === 'library') return PHOTOS;
    if (activeAlbum === 'favorites') return PHOTOS.filter((p) => favorites.has(p.id));
    if (activeAlbum === 'recents')   return PHOTOS.filter((p) => p.album === 'Recents');
    // Named albums: match by album name (slug → label)
    const albumObj = ALBUMS.find((a) => a.id === activeAlbum);
    if (!albumObj) return PHOTOS;
    return PHOTOS.filter((p) => p.album.toLowerCase() === albumObj.label.toLowerCase());
  }

  function renderGrid() {
    gridArea.innerHTML = '';
    const photos = getFilteredPhotos();

    if (photos.length === 0) {
      const empty = el('ph-empty');
      empty.innerHTML = '<div class="ph-empty-icon">🌁</div><div>No Photos</div>';
      gridArea.append(empty);
      return;
    }

    const groups = groupBy(photos, activeSegment);
    groups.forEach(([key, groupPhotos]) => {
      const section = el('ph-group');
      if (activeSegment !== 'All' || groups.length > 1) {
        const label = el('ph-group-label');
        label.textContent = formatGroupLabel(key, activeSegment);
        section.append(label);
      }
      const grid = el('ph-grid');
      groupPhotos.forEach((photo) => {
        const cell = el('ph-cell');
        cell.style.background = photo.grad;
        // Heart overlay
        const heart = el('ph-heart');
        heart.textContent = favorites.has(photo.id) ? '❤️' : '🤍';
        heart.title = favorites.has(photo.id) ? 'Unfavorite' : 'Favorite';
        heart.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFavorite(photo.id, heart);
        });
        // Caption overlay
        const cap = el('ph-cap');
        cap.textContent = photo.caption;
        cell.append(heart, cap);
        cell.addEventListener('click', () => openLightbox(photo, groupPhotos));
        grid.append(cell);
      });
      section.append(grid);
      gridArea.append(section);
    });
  }

  function toggleFavorite(id, heartEl) {
    if (favorites.has(id)) {
      favorites.delete(id);
      heartEl.textContent = '🤍';
      heartEl.title = 'Favorite';
      api.toast('Removed from Favorites');
    } else {
      favorites.add(id);
      heartEl.textContent = '❤️';
      heartEl.title = 'Unfavorite';
      api.toast('Added to Favorites');
    }
    saveFavorites();
    // If we're in favorites album, re-render to reflect change
    if (activeAlbum === 'favorites') renderGrid();
  }

  /* ────────────────── LIGHTBOX ────────────────── */
  const lightbox = el('ph-lightbox');
  lightbox.classList.add('hidden');
  let lbPhotos = [];
  let lbIndex = 0;

  /* Single backdrop-click listener — registered once */
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  function openLightbox(photo, contextPhotos) {
    lbPhotos = contextPhotos;
    lbIndex = contextPhotos.findIndex((p) => p.id === photo.id);
    renderLightbox();
    lightbox.classList.remove('hidden');
    lightbox.classList.add('ph-lb-open');
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('ph-lb-open');
    // Refresh grid hearts (state may have changed)
    renderGrid();
  }

  function renderLightbox() {
    const photo = lbPhotos[lbIndex];
    const isFav = favorites.has(photo.id);

    lightbox.innerHTML = '';

    const panel = el('ph-lb-panel');

    /* ── Close button ── */
    const closeBtn = el('ph-lb-close', 'button');
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', closeLightbox);

    /* ── Image tile ── */
    const img = el('ph-lb-img');
    img.style.background = photo.grad;

    /* ── Info bar ── */
    const info = el('ph-lb-info');
    const captionEl = el('ph-lb-caption');
    captionEl.textContent = photo.caption;
    const dateEl = el('ph-lb-date');
    const d = new Date(photo.date + 'T12:00:00');
    dateEl.textContent = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    /* ── Heart (favorite toggle) ── */
    const heartBtn = el('ph-lb-heart', 'button');
    heartBtn.textContent = isFav ? '❤️' : '🤍';
    heartBtn.title = isFav ? 'Unfavorite' : 'Favorite';
    heartBtn.addEventListener('click', () => {
      if (favorites.has(photo.id)) {
        favorites.delete(photo.id);
        heartBtn.textContent = '🤍';
        heartBtn.title = 'Favorite';
        api.toast('Removed from Favorites');
      } else {
        favorites.add(photo.id);
        heartBtn.textContent = '❤️';
        heartBtn.title = 'Unfavorite';
        api.toast('Added to Favorites');
      }
      saveFavorites();
    });

    info.append(captionEl, dateEl);

    /* ── Counter ── */
    const counter = el('ph-lb-counter');
    counter.textContent = `${lbIndex + 1} / ${lbPhotos.length}`;

    /* ── Nav buttons ── */
    const prevBtn = el('ph-lb-nav ph-lb-prev', 'button');
    prevBtn.textContent = '‹';
    prevBtn.title = 'Previous';
    prevBtn.disabled = lbIndex === 0;
    if (lbIndex === 0) prevBtn.classList.add('disabled');
    prevBtn.addEventListener('click', () => {
      if (lbIndex > 0) { lbIndex--; renderLightbox(); }
    });

    const nextBtn = el('ph-lb-nav ph-lb-next', 'button');
    nextBtn.textContent = '›';
    nextBtn.title = 'Next';
    nextBtn.disabled = lbIndex === lbPhotos.length - 1;
    if (lbIndex === lbPhotos.length - 1) nextBtn.classList.add('disabled');
    nextBtn.addEventListener('click', () => {
      if (lbIndex < lbPhotos.length - 1) { lbIndex++; renderLightbox(); }
    });

    /* ── Actions bar ── */
    const actions = el('ph-lb-actions');
    actions.append(heartBtn);

    const shareBtn = el('ph-lb-action', 'button');
    shareBtn.textContent = '⬆️';
    shareBtn.title = 'Share';
    shareBtn.addEventListener('click', () => api.toast(`Sharing "${photo.caption}"…`));
    actions.append(shareBtn);

    const infoBtn = el('ph-lb-action', 'button');
    infoBtn.textContent = 'ℹ️';
    infoBtn.title = 'Photo Info';
    infoBtn.addEventListener('click', () => api.toast(`📅 ${d.toLocaleDateString()} · 📷 ${photo.album}`));
    actions.append(infoBtn);

    panel.append(closeBtn, prevBtn, img, nextBtn, info, counter, actions);
    lightbox.append(panel);

    /* ── Keyboard nav inside lightbox ── */
    lightbox._keyHandler && lightbox.removeEventListener('keydown', lightbox._keyHandler);
    lightbox._keyHandler = (e) => {
      if (lightbox.classList.contains('hidden')) return;
      if (e.key === 'ArrowLeft'  && lbIndex > 0) { lbIndex--; renderLightbox(); }
      if (e.key === 'ArrowRight' && lbIndex < lbPhotos.length - 1) { lbIndex++; renderLightbox(); }
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'f' || e.key === 'F') {
        if (favorites.has(photo.id)) {
          favorites.delete(photo.id);
          heartBtn.textContent = '🤍';
          api.toast('Removed from Favorites');
        } else {
          favorites.add(photo.id);
          heartBtn.textContent = '❤️';
          api.toast('Added to Favorites');
        }
        saveFavorites();
      }
    };
    lightbox.addEventListener('keydown', lightbox._keyHandler);
    lightbox.tabIndex = -1;
    lightbox.focus();
  }

  /* ────────────────── ASSEMBLE ────────────────── */
  root.append(sidebar, mainArea, lightbox);

  /* Initial render */
  renderGrid();

  return root;
}
