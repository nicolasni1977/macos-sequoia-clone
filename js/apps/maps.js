// js/apps/maps.js — Maps app for the macOS Sequoia web clone
// Self-contained; no external network/CDN/fonts/images.
import { el, setHTML } from '../dom.js';

// ─── Data ────────────────────────────────────────────────────────────────────

const PLACES = [
  {
    id: 'apple-hq',
    name: 'Apple Park',
    cat: 'Corporate HQ',
    addr: '1 Apple Park Way, Cupertino, CA 95014',
    rating: 4.8,
    icon: '🏢',
    x: 52, y: 44,          // percent on the map canvas
    color: '#636dff',
  },
  {
    id: 'infinite-loop',
    name: 'Infinite Loop',
    cat: 'Historic Campus',
    addr: '1 Infinite Loop, Cupertino, CA 95014',
    rating: 4.6,
    icon: '♾️',
    x: 38, y: 58,
    color: '#636dff',
  },
  {
    id: 'cupertino-sq',
    name: 'Cupertino Square',
    cat: 'Shopping Mall',
    addr: '20750 Stevens Creek Blvd, Cupertino, CA 95014',
    rating: 4.1,
    icon: '🛍️',
    x: 64, y: 62,
    color: '#ff3b30',
  },
  {
    id: 'memorial-park',
    name: 'Memorial Park',
    cat: 'Park · Recreation',
    addr: '21251 Stevens Creek Blvd, Cupertino, CA 95014',
    rating: 4.5,
    icon: '🌳',
    x: 45, y: 72,
    color: '#30d158',
  },
  {
    id: 'de-anza-college',
    name: 'De Anza College',
    cat: 'Community College',
    addr: '21250 Stevens Creek Blvd, Cupertino, CA 95014',
    rating: 4.3,
    icon: '🎓',
    x: 28, y: 66,
    color: '#ff9f0a',
  },
  {
    id: 'main-street',
    name: 'Main Street Cupertino',
    cat: 'Shopping · Dining',
    addr: '19700 Vallco Pkwy, Cupertino, CA 95014',
    rating: 4.2,
    icon: '🍽️',
    x: 72, y: 50,
    color: '#ff3b30',
  },
  {
    id: 'blackberry-farm',
    name: 'Blackberry Farm',
    cat: 'Park · Golf Course',
    addr: '21975 San Fernando Ave, Cupertino, CA 95014',
    rating: 4.4,
    icon: '⛳',
    x: 30, y: 42,
    color: '#30d158',
  },
];

const GUIDES = [
  { id: 'food', label: 'Best Eats', icon: '🍴', desc: 'Top-rated restaurants in Cupertino' },
  { id: 'parks', label: 'Parks & Nature', icon: '🌿', desc: 'Green spaces and outdoor areas' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', desc: 'Malls and boutique shops' },
  { id: 'tech', label: 'Tech Landmarks', icon: '💻', desc: 'Famous tech company campuses' },
];

const RECENTS = [
  { name: 'Apple Park', addr: '1 Apple Park Way, Cupertino', icon: '🏢' },
  { name: 'De Anza College', addr: '21250 Stevens Creek Blvd', icon: '🎓' },
  { name: 'Memorial Park', addr: '21251 Stevens Creek Blvd', icon: '🌳' },
];

const ROUTE_STEPS = {
  driving: [
    'Head north on N De Anza Blvd',
    'Turn right onto Homestead Rd',
    'Turn right onto N Tantau Ave',
    'Turn left onto Apple Park Way',
    'Arrive at Apple Park',
  ],
  walking: [
    'Head east on Stevens Creek Blvd',
    'Turn left onto N Tantau Ave',
    'Continue for 0.4 mi',
    'Turn right onto Apple Park Way',
    'Arrive at Apple Park',
  ],
  transit: [
    'Walk to Cupertino Square bus stop',
    'Board Bus 23 toward Cupertino',
    'Ride 3 stops (8 min)',
    'Exit at N Tantau Ave & Apple Park Way',
    'Walk 2 min to Apple Park',
  ],
  cycling: [
    'Follow the Stevens Creek Trail heading north',
    'Merge onto N De Anza Blvd bike lane',
    'Turn right onto Apple Park Way',
    'Follow bike path to main entrance',
    'Arrive at Apple Park',
  ],
};

const TRANSPORT_MODES = [
  { id: 'driving', label: 'Drive', icon: '🚗', time: '8 min', dist: '2.4 mi' },
  { id: 'walking', label: 'Walk', icon: '🚶', time: '34 min', dist: '1.8 mi' },
  { id: 'transit', label: 'Transit', icon: '🚌', time: '22 min', dist: '' },
  { id: 'cycling', label: 'Cycling', icon: '🚴', time: '12 min', dist: '2.1 mi' },
];

// ─── Main content function ────────────────────────────────────────────────────

export function content(win, api) {
  // State
  let zoom = api.load('zoom', 1.0);
  let panX = api.load('panX', 0);
  let panY = api.load('panY', 0);
  let selectedPlaceId = null;
  let directionsMode = false;
  let activeTransport = 'driving';
  let sidebarView = 'search'; // 'search' | 'detail' | 'directions' | 'guides' | 'recents'
  let searchQuery = '';
  let filteredPlaces = [...PLACES];

  // ── Root layout ────────────────────────────────────────────────────────────
  const root = el('maps-root');

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = el('maps-sidebar');

  // Search bar
  const searchWrap = el('maps-search-bar');
  const searchIcon = setHTML('maps-search-icon', '🔍');
  const searchInput = el('maps-search-input', 'input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search Maps';
  searchInput.spellcheck = false;
  const clearBtn = el('maps-search-clear', 'button');
  clearBtn.textContent = '✕';
  clearBtn.style.display = 'none';
  searchWrap.append(searchIcon, searchInput, clearBtn);

  // Sidebar tab bar (Guides / Recents)
  const tabBar = el('maps-tab-bar');
  const tabGuides = el('maps-tab', 'button');
  tabGuides.textContent = 'Guides';
  const tabRecents = el('maps-tab', 'button');
  tabRecents.textContent = 'Recents';
  tabBar.append(tabGuides, tabRecents);

  // Sidebar content area
  const sidebarContent = el('maps-sidebar-content');

  sidebar.append(searchWrap, tabBar, sidebarContent);

  // ── Map canvas ─────────────────────────────────────────────────────────────
  const mapContainer = el('maps-map-container');
  const mapCanvas = el('maps-canvas');
  const mapInner = el('maps-inner');  // transformed layer
  mapCanvas.append(mapInner);

  // Draw the CSS map
  buildMapGraphics(mapInner);

  // Pin elements
  const pinLayer = el('maps-pin-layer');
  PLACES.forEach((place) => {
    const pin = el('maps-pin');
    pin.setAttribute('data-id', place.id);
    pin.style.left = place.x + '%';
    pin.style.top = place.y + '%';
    pin.innerHTML = `<span class="maps-pin-dot" style="background:${place.color}"></span><span class="maps-pin-icon">${place.icon}</span>`;
    pin.title = place.name;
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPlace(place.id);
    });
    pinLayer.append(pin);
  });
  mapInner.append(pinLayer);

  // Route line (hidden by default) — uses a 100x100 viewBox so coordinates
  // map directly to the place.x / place.y percent values.
  const routeLine = el('maps-route-line', 'svg');
  routeLine.setAttribute('width', '100%');
  routeLine.setAttribute('height', '100%');
  routeLine.setAttribute('viewBox', '0 0 100 100');
  routeLine.setAttribute('preserveAspectRatio', 'none');
  routeLine.style.display = 'none';
  mapInner.append(routeLine);

  mapContainer.append(mapCanvas);

  // ── Map overlay controls ───────────────────────────────────────────────────
  const mapControls = el('maps-controls');

  // Zoom controls
  const zoomGroup = el('maps-zoom-group');
  const zoomIn = el('maps-zoom-btn', 'button');
  zoomIn.textContent = '+';
  zoomIn.title = 'Zoom in';
  const zoomOut = el('maps-zoom-btn', 'button');
  zoomOut.textContent = '−';
  zoomOut.title = 'Zoom out';
  zoomGroup.append(zoomIn, zoomOut);

  // Compass
  const compass = el('maps-compass');
  compass.innerHTML = `<span class="maps-compass-n">N</span><span class="maps-compass-arrow">↑</span>`;
  compass.title = 'Reset north';

  // Scale indicator
  const scaleBar = el('maps-scale-bar');
  const scaleLabel = el('maps-scale-label');
  updateScaleLabel();
  scaleBar.append(scaleLabel);

  mapControls.append(zoomGroup, compass, scaleBar);
  mapContainer.append(mapControls);

  // ── Assemble root ──────────────────────────────────────────────────────────
  root.append(sidebar, mapContainer);

  // ── Sidebar rendering ──────────────────────────────────────────────────────

  function renderSearchResults() {
    sidebarContent.innerHTML = '';
    if (filteredPlaces.length === 0) {
      const empty = el('maps-empty');
      empty.innerHTML = '<span>🔍</span><p>No results found</p>';
      sidebarContent.append(empty);
      return;
    }
    filteredPlaces.forEach((place) => {
      const row = el('maps-result-row' + (place.id === selectedPlaceId ? ' active' : ''));
      row.innerHTML = `
        <span class="maps-result-icon" style="background:${place.color}">${place.icon}</span>
        <span class="maps-result-info">
          <span class="maps-result-name">${place.name}</span>
          <span class="maps-result-cat">${place.cat}</span>
        </span>
        <span class="maps-result-arrow">›</span>
      `;
      row.addEventListener('click', () => selectPlace(place.id));
      sidebarContent.append(row);
    });
  }

  function renderDetailPanel(place) {
    sidebarContent.innerHTML = '';
    const back = el('maps-back-btn', 'button');
    back.innerHTML = '‹ Back';
    back.addEventListener('click', () => {
      selectedPlaceId = null;
      clearHighlight();
      sidebarView = 'search';
      renderSidebar();
    });

    const stars = renderStars(place.rating);
    const detail = el('maps-detail');
    detail.innerHTML = `
      <div class="maps-detail-header">
        <span class="maps-detail-icon" style="background:${place.color}">${place.icon}</span>
        <div class="maps-detail-meta">
          <div class="maps-detail-name">${place.name}</div>
          <div class="maps-detail-cat">${place.cat}</div>
        </div>
      </div>
      <div class="maps-detail-stars">${stars}<span class="maps-detail-rating">${place.rating}</span></div>
      <div class="maps-detail-addr">📍 ${place.addr}</div>
    `;

    const directionsBtn = el('maps-directions-btn', 'button');
    directionsBtn.innerHTML = '🗺 Directions';
    directionsBtn.addEventListener('click', () => {
      directionsMode = true;
      sidebarView = 'directions';
      renderSidebar();
      drawRoute(place);
    });

    const actionRow = el('maps-action-row');
    const shareBtn = el('maps-action-chip', 'button');
    shareBtn.innerHTML = '⬆ Share';
    shareBtn.addEventListener('click', () => api.toast('Link copied to clipboard'));
    const saveBtn = el('maps-action-chip', 'button');
    saveBtn.innerHTML = '❤ Save';
    saveBtn.addEventListener('click', () => api.toast(`Saved: ${place.name}`));
    actionRow.append(shareBtn, saveBtn);

    sidebarContent.append(back, detail, directionsBtn, actionRow);
  }

  function renderDirectionsPanel(place) {
    sidebarContent.innerHTML = '';
    const back = el('maps-back-btn', 'button');
    back.innerHTML = '‹ Back';
    back.addEventListener('click', () => {
      directionsMode = false;
      sidebarView = 'detail';
      clearRoute();
      renderSidebar();
    });

    const heading = el('maps-dir-heading');
    heading.innerHTML = `<div class="maps-dir-to">To: ${place.name}</div>`;

    // Transport mode tabs
    const modeRow = el('maps-mode-row');
    TRANSPORT_MODES.forEach((m) => {
      const btn = el('maps-mode-btn' + (m.id === activeTransport ? ' active' : ''), 'button');
      btn.innerHTML = `<span>${m.icon}</span><span>${m.label}</span>`;
      btn.addEventListener('click', () => {
        activeTransport = m.id;
        clearRoute();
        drawRoute(place);
        renderDirectionsPanel(place);
      });
      modeRow.append(btn);
    });

    const mode = TRANSPORT_MODES.find((m) => m.id === activeTransport);
    const summary = el('maps-dir-summary');
    summary.innerHTML = `
      <span class="maps-dir-time">${mode.time}</span>
      ${mode.dist ? `<span class="maps-dir-dist">${mode.dist}</span>` : ''}
    `;

    const stepsList = el('maps-dir-steps');
    const steps = ROUTE_STEPS[activeTransport] || [];
    steps.forEach((step, i) => {
      const row = el('maps-dir-step');
      row.innerHTML = `
        <span class="maps-step-num">${i + 1}</span>
        <span class="maps-step-text">${step}</span>
      `;
      stepsList.append(row);
    });

    sidebarContent.append(back, heading, modeRow, summary, stepsList);
  }

  function renderGuidesPanel() {
    sidebarContent.innerHTML = '';
    const title = el('maps-section-title');
    title.textContent = 'Guides';
    sidebarContent.append(title);

    GUIDES.forEach((guide) => {
      const card = el('maps-guide-card');
      card.innerHTML = `
        <span class="maps-guide-icon">${guide.icon}</span>
        <div class="maps-guide-info">
          <div class="maps-guide-label">${guide.label}</div>
          <div class="maps-guide-desc">${guide.desc}</div>
        </div>
        <span class="maps-guide-arrow">›</span>
      `;
      card.addEventListener('click', () => {
        api.toast(`Opening guide: ${guide.label}`);
        // Filter places by guide category
        if (guide.id === 'parks') {
          filteredPlaces = PLACES.filter((p) => p.cat.toLowerCase().includes('park'));
        } else if (guide.id === 'food') {
          filteredPlaces = PLACES.filter((p) => p.cat.toLowerCase().includes('dining') || p.cat.toLowerCase().includes('eat'));
        } else if (guide.id === 'shopping') {
          filteredPlaces = PLACES.filter((p) => p.cat.toLowerCase().includes('shopping'));
        } else if (guide.id === 'tech') {
          filteredPlaces = PLACES.filter((p) => p.cat.toLowerCase().includes('campus') || p.cat.toLowerCase().includes('hq'));
        } else {
          filteredPlaces = [...PLACES];
        }
        sidebarView = 'search';
        searchInput.value = guide.label;
        clearBtn.style.display = 'flex';
        tabBar.style.display = 'none';
        renderSidebar();
      });
      sidebarContent.append(card);
    });
  }

  function renderRecentsPanel() {
    sidebarContent.innerHTML = '';
    const title = el('maps-section-title');
    title.textContent = 'Recents';
    sidebarContent.append(title);

    RECENTS.forEach((recent) => {
      const row = el('maps-recent-row');
      row.innerHTML = `
        <span class="maps-recent-icon">${recent.icon}</span>
        <div class="maps-recent-info">
          <div class="maps-recent-name">${recent.name}</div>
          <div class="maps-recent-addr">${recent.addr}</div>
        </div>
      `;
      row.addEventListener('click', () => {
        const place = PLACES.find((p) => p.name === recent.name);
        if (place) selectPlace(place.id);
      });
      sidebarContent.append(row);
    });
  }

  function renderSidebar() {
    const place = PLACES.find((p) => p.id === selectedPlaceId);
    switch (sidebarView) {
      case 'detail':
        tabBar.style.display = 'none';
        if (place) renderDetailPanel(place);
        break;
      case 'directions':
        tabBar.style.display = 'none';
        if (place) renderDirectionsPanel(place);
        break;
      case 'guides':
        tabBar.style.display = 'flex';
        renderGuidesPanel();
        break;
      case 'recents':
        tabBar.style.display = 'flex';
        renderRecentsPanel();
        break;
      default: // 'search'
        tabBar.style.display = 'flex';
        renderSearchResults();
        break;
    }
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  function selectPlace(id) {
    selectedPlaceId = id;
    sidebarView = 'detail';
    directionsMode = false;
    clearRoute();
    highlightPin(id);
    centerOnPlace(id);
    renderSidebar();
  }

  function highlightPin(id) {
    pinLayer.querySelectorAll('.maps-pin').forEach((pin) => {
      pin.classList.toggle('active', pin.getAttribute('data-id') === id);
    });
  }

  function clearHighlight() {
    pinLayer.querySelectorAll('.maps-pin').forEach((pin) => pin.classList.remove('active'));
  }

  function centerOnPlace(id) {
    const place = PLACES.find((p) => p.id === id);
    if (!place) return;
    // Animate the inner canvas to center on the pin
    const cx = mapCanvas.offsetWidth / 2;
    const cy = mapCanvas.offsetHeight / 2;
    const targetX = cx - (place.x / 100) * mapCanvas.offsetWidth * zoom;
    const targetY = cy - (place.y / 100) * mapCanvas.offsetHeight * zoom;
    panX = targetX;
    panY = targetY;
    applyTransform(true);
  }

  function applyTransform(animate = false) {
    if (animate) {
      mapInner.style.transition = 'transform 0.4s var(--ease-out, cubic-bezier(0.22,1,0.36,1))';
    } else {
      mapInner.style.transition = 'none';
    }
    mapInner.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    mapInner.style.transformOrigin = '0 0';
    updateScaleLabel();
    api.store('zoom', zoom);
    api.store('panX', panX);
    api.store('panY', panY);
  }

  function updateScaleLabel() {
    const milesBase = 5;
    const miles = (milesBase / zoom).toFixed(1);
    if (scaleLabel) scaleLabel.textContent = `${miles} mi`;
  }

  // Zoom buttons
  zoomIn.addEventListener('click', () => {
    zoom = Math.min(zoom * 1.3, 4);
    applyTransform(true);
  });
  zoomOut.addEventListener('click', () => {
    zoom = Math.max(zoom / 1.3, 0.4);
    applyTransform(true);
  });

  // Compass reset
  compass.addEventListener('click', () => {
    zoom = 1.0;
    panX = 0;
    panY = 0;
    applyTransform(true);
    api.toast('Map orientation reset');
  });

  // Click on empty map to deselect
  mapCanvas.addEventListener('click', () => {
    if (selectedPlaceId && sidebarView === 'detail') {
      selectedPlaceId = null;
      clearHighlight();
      sidebarView = 'search';
      clearRoute();
      renderSidebar();
    }
  });

  // Drag to pan
  let dragging = false, dragStartX = 0, dragStartY = 0, dragPanX = 0, dragPanY = 0;
  mapCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragPanX = panX;
    dragPanY = panY;
    mapCanvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    panX = dragPanX + (e.clientX - dragStartX);
    panY = dragPanY + (e.clientY - dragStartY);
    applyTransform(false);
  });
  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      mapCanvas.style.cursor = 'grab';
    }
  });

  // Pinch/scroll to zoom
  mapCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.4, Math.min(4, zoom * delta));
    applyTransform(false);
  }, { passive: false });

  // Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    clearBtn.style.display = searchQuery ? 'flex' : 'none';
    tabBar.style.display = searchQuery ? 'none' : 'flex';
    filteredPlaces = searchQuery
      ? PLACES.filter((p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          p.cat.toLowerCase().includes(searchQuery) ||
          p.addr.toLowerCase().includes(searchQuery)
        )
      : [...PLACES];
    sidebarView = 'search';
    selectedPlaceId = null;
    clearHighlight();
    renderSidebar();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    filteredPlaces = [...PLACES];
    tabBar.style.display = 'flex';
    sidebarView = 'search';
    selectedPlaceId = null;
    clearHighlight();
    renderSidebar();
  });

  // Tab bar
  tabGuides.addEventListener('click', () => {
    setActiveTab(tabGuides);
    sidebarView = 'guides';
    renderSidebar();
  });
  tabRecents.addEventListener('click', () => {
    setActiveTab(tabRecents);
    sidebarView = 'recents';
    renderSidebar();
  });
  function setActiveTab(activeEl) {
    [tabGuides, tabRecents].forEach((t) => t.classList.remove('active'));
    activeEl.classList.add('active');
  }

  // ── Route drawing ──────────────────────────────────────────────────────────

  function drawRoute(place) {
    routeLine.style.display = 'block';
    // Coordinates are in viewBox units (0-100) matching place.x / place.y percent values.
    // Route originates from the bottom-center of the map (user's current location mock).
    const x1 = 50, y1 = 88;
    const x2 = place.x, y2 = place.y;
    // Quadratic bezier control point — offset perpendicular to the line
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.3;
    const my = (y1 + y2) / 2 - (x2 - x1) * 0.3;
    const color = activeTransport === 'driving' ? '#0a84ff'
      : activeTransport === 'walking' ? '#30d158'
      : activeTransport === 'transit' ? '#ff9f0a'
      : '#ff375f';
    const dash = activeTransport === 'walking' ? '1.5 1' : 'none';
    const sw = activeTransport === 'cycling' ? '0.6' : '1';
    routeLine.innerHTML = `
      <path
        d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}"
        stroke="${color}" stroke-width="${sw}" fill="none"
        stroke-linecap="round" stroke-dasharray="${dash}"
        opacity="0.9"
      />
      <circle cx="${x1}" cy="${y1}" r="1.2" fill="${color}" opacity="0.8"/>
    `;
  }

  function clearRoute() {
    routeLine.style.display = 'none';
    routeLine.innerHTML = '';
  }

  // ── Star helper ────────────────────────────────────────────────────────────

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let s = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) s += '<span class="maps-star full">★</span>';
      else if (i === full && half) s += '<span class="maps-star half">★</span>';
      else s += '<span class="maps-star empty">★</span>';
    }
    return `<span class="maps-stars">${s}</span>`;
  }

  // ── Initial render ─────────────────────────────────────────────────────────
  applyTransform(false);
  renderSidebar();

  return root;
}

// ─── CSS Map Graphics ─────────────────────────────────────────────────────────

function buildMapGraphics(container) {
  // The map is built with layered CSS div elements: base terrain, water,
  // parks, major roads, minor roads, blocks, and labels.

  // Base terrain (light tan/grey toned map background) — applied via CSS
  container.classList.add('maps-terrain');

  // Water body (creek / bay)
  const water1 = el('maps-water maps-creek');
  container.append(water1);

  const water2 = el('maps-water maps-bay');
  container.append(water2);

  // Parks
  const parkDefs = [
    { cls: 'maps-park-a', label: 'Memorial\nPark' },
    { cls: 'maps-park-b', label: 'Blackberry\nFarm' },
    { cls: 'maps-park-c', label: 'Creekside\nPark' },
  ];
  parkDefs.forEach(({ cls, label }) => {
    const park = el('maps-park ' + cls);
    const parkLabel = el('maps-feature-label maps-park-label');
    parkLabel.textContent = label;
    park.append(parkLabel);
    container.append(park);
  });

  // City blocks — in a dedicated wrapper so nth-child counts are predictable.
  const blockLayer = el('maps-block-layer');
  for (let i = 0; i < 35; i++) {
    blockLayer.append(el('maps-block'));
  }
  container.append(blockLayer);

  // Major roads
  [
    { cls: 'maps-road-h maps-road-major maps-stevens-creek', label: 'Stevens Creek Blvd' },
    { cls: 'maps-road-h maps-road-major maps-homestead', label: 'Homestead Rd' },
    { cls: 'maps-road-v maps-road-major maps-de-anza', label: 'De Anza Blvd' },
    { cls: 'maps-road-v maps-road-major maps-tantau', label: 'N Tantau Ave' },
  ].forEach(({ cls, label }) => {
    const road = el(cls);
    const roadLabel = el('maps-road-label');
    roadLabel.textContent = label;
    road.append(roadLabel);
    container.append(road);
  });

  // Minor roads
  [
    'maps-road-h maps-road-minor maps-minor-1',
    'maps-road-h maps-road-minor maps-minor-2',
    'maps-road-h maps-road-minor maps-minor-3',
    'maps-road-v maps-road-minor maps-minor-4',
    'maps-road-v maps-road-minor maps-minor-5',
    'maps-road-v maps-road-minor maps-minor-6',
  ].forEach((cls) => {
    container.append(el(cls));
  });

  // Apple Park circle (iconic ring building)
  const appleRing = el('maps-apple-ring');
  const appleRingLabel = el('maps-feature-label maps-apple-label');
  appleRingLabel.textContent = 'Apple Park';
  appleRing.append(appleRingLabel);
  container.append(appleRing);

  // Compass/grid overlay
  container.append(el('maps-grid-overlay'));
}
