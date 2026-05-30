// js/apps/findmy.js
// Find My — macOS Sequoia Web Clone
// Self-contained; no imports from apps.js.
import { el, setHTML } from '../dom.js';

// ─── Data ────────────────────────────────────────────────────────────────────

const DEVICES = [
  {
    id: 'macbook',
    name: "Nicolas's MacBook Pro",
    emoji: '💻',
    type: 'Mac',
    model: 'MacBook Pro 16"',
    battery: 87,
    batteryCharging: false,
    lastSeen: 'Now',
    location: 'Home · San Francisco, CA',
    // map position as percentage of map area
    mapX: 52,
    mapY: 44,
    color: '#34c759',
  },
  {
    id: 'iphone',
    name: "Nicolas's iPhone",
    emoji: '📱',
    type: 'iPhone',
    model: 'iPhone 16 Pro',
    battery: 62,
    batteryCharging: true,
    lastSeen: 'Now',
    location: 'Home · San Francisco, CA',
    mapX: 53,
    mapY: 46,
    color: '#34c759',
  },
  {
    id: 'airpods',
    name: "Nicolas's AirPods Pro",
    emoji: '🎧',
    type: 'AirPods',
    model: 'AirPods Pro (2nd gen)',
    battery: 41,
    batteryCharging: false,
    lastSeen: '2 minutes ago',
    location: 'Near Home · San Francisco, CA',
    mapX: 51,
    mapY: 47,
    color: '#ff9f0a',
  },
  {
    id: 'watch',
    name: "Nicolas's Apple Watch",
    emoji: '⌚',
    type: 'Watch',
    model: 'Apple Watch Ultra 2',
    battery: 73,
    batteryCharging: false,
    lastSeen: 'Now',
    location: 'Home · San Francisco, CA',
    mapX: 54,
    mapY: 43,
    color: '#34c759',
  },
];

const PEOPLE = [
  {
    id: 'person-alex',
    name: 'Alex Chen',
    emoji: '👤',
    initials: 'AC',
    initialsColor: '#5856d6',
    lastSeen: '5 minutes ago',
    location: 'Mission District · San Francisco, CA',
    mapX: 47,
    mapY: 55,
    color: '#5856d6',
  },
  {
    id: 'person-sam',
    name: 'Sam Rivera',
    emoji: '👤',
    initials: 'SR',
    initialsColor: '#ff2d55',
    lastSeen: '12 minutes ago',
    location: 'SOMA · San Francisco, CA',
    mapX: 56,
    mapY: 52,
    color: '#ff2d55',
  },
];

const ITEMS = [
  {
    id: 'item-keys',
    name: 'Keys',
    emoji: '🔑',
    type: 'AirTag',
    battery: 'Good',
    lastSeen: '1 hour ago',
    location: 'Near Home · San Francisco, CA',
    mapX: 50,
    mapY: 49,
    color: '#ff9f0a',
  },
  {
    id: 'item-bag',
    name: 'Backpack',
    emoji: '🎒',
    type: 'AirTag',
    battery: 'Good',
    lastSeen: '3 hours ago',
    location: 'Office · San Francisco, CA',
    mapX: 58,
    mapY: 41,
    color: '#ff9f0a',
  },
];

// ─── Map tiles (pure CSS pseudo-streets) ────────────────────────────────────

function buildMap() {
  const mapEl = el('fm-map');

  // Background gradient (day map feel)
  const bg = el('fm-map-bg');
  mapEl.append(bg);

  // Decorative city blocks / roads
  const grid = el('fm-map-grid');
  // Major roads
  const roads = [
    { x: 0, y: 42, w: 100, h: 1.4, label: 'Market St' },
    { x: 0, y: 58, w: 100, h: 1.0, label: 'Mission St' },
    { x: 0, y: 32, w: 100, h: 0.8, label: 'Geary Blvd' },
    { x: 38, y: 0, w: 1.4, h: 100, label: 'Van Ness Ave' },
    { x: 55, y: 0, w: 1.0, h: 100, label: 'Folsom St' },
    { x: 22, y: 0, w: 0.8, h: 100, label: '19th Ave' },
    { x: 70, y: 0, w: 0.8, h: 100, label: 'The Embarcadero' },
  ];

  roads.forEach(r => {
    const road = el('fm-road');
    road.style.cssText = `left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;`;
    grid.append(road);
  });

  // City blocks (green park areas)
  const parks = [
    { x: 23, y: 33, w: 10, h: 8 },
    { x: 60, y: 62, w: 8, h: 6 },
    { x: 10, y: 55, w: 9, h: 7 },
    { x: 72, y: 28, w: 6, h: 5 },
  ];
  parks.forEach(p => {
    const park = el('fm-park');
    park.style.cssText = `left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%;`;
    grid.append(park);
  });

  // Water area (bay)
  const water = el('fm-water');
  grid.append(water);

  mapEl.append(grid);

  // Label for city
  const cityLabel = el('fm-city-label');
  cityLabel.textContent = 'San Francisco';
  mapEl.append(cityLabel);

  // Neighborhood labels
  const hoods = [
    { name: 'Mission', x: 42, y: 60 },
    { name: 'SOMA', x: 58, y: 54 },
    { name: 'Castro', x: 34, y: 52 },
    { name: 'Pacific Heights', x: 28, y: 36 },
    { name: 'Financial District', x: 62, y: 38 },
  ];
  hoods.forEach(h => {
    const lbl = el('fm-hood-label');
    lbl.textContent = h.name;
    lbl.style.cssText = `left:${h.x}%;top:${h.y}%;`;
    mapEl.append(lbl);
  });

  // Compass rose
  const compass = setHTML('fm-compass', `<span class="fm-compass-n">N</span><span class="fm-compass-arrow">↑</span>`);
  mapEl.append(compass);

  // Zoom controls
  const zoomCtrl = el('fm-zoom-controls');
  const zoomIn = el('fm-zoom-btn', 'button');
  zoomIn.textContent = '+';
  zoomIn.title = 'Zoom In';
  const zoomOut = el('fm-zoom-btn', 'button');
  zoomOut.textContent = '−';
  zoomOut.title = 'Zoom Out';
  let zoom = 1;
  zoomIn.addEventListener('click', () => {
    zoom = Math.min(zoom + 0.2, 2);
    grid.style.transform = `scale(${zoom})`;
    syncPinsZoom(mapEl, zoom);
  });
  zoomOut.addEventListener('click', () => {
    zoom = Math.max(zoom - 0.2, 0.6);
    grid.style.transform = `scale(${zoom})`;
    syncPinsZoom(mapEl, zoom);
  });
  zoomCtrl.append(zoomIn, zoomOut);
  mapEl.append(zoomCtrl);

  return mapEl;
}

function syncPinsZoom(mapEl, zoom) {
  // Pins stay at their lat/lon % so no transform needed;
  // just a visual cue: scale the pin icons slightly
  mapEl.querySelectorAll('.fm-pin').forEach(p => {
    p.style.transform = `translate(-50%, -100%) scale(${1 / Math.sqrt(zoom)})`;
  });
}

// ─── Pin creation ─────────────────────────────────────────────────────────────

function createPin(item, onSelect) {
  const pin = el('fm-pin');
  pin.dataset.id = item.id;
  pin.style.left = item.mapX + '%';
  pin.style.top = item.mapY + '%';

  const pinHead = el('fm-pin-head');
  pinHead.style.background = item.color;

  if (item.initials) {
    pinHead.textContent = item.initials;
    pinHead.style.fontSize = '10px';
    pinHead.style.color = '#fff';
    pinHead.style.fontWeight = '700';
  } else {
    const emoji = el('fm-pin-emoji');
    emoji.textContent = item.emoji;
    pinHead.append(emoji);
  }

  const pinTail = el('fm-pin-tail');
  pinTail.style.borderTopColor = item.color;

  pin.append(pinHead, pinTail);

  // Pulse ring for devices that are "Now"
  if (item.lastSeen === 'Now') {
    const pulse = el('fm-pin-pulse');
    pulse.style.borderColor = item.color;
    pin.prepend(pulse);
  }

  pin.addEventListener('click', e => {
    e.stopPropagation();
    onSelect(item);
  });

  return pin;
}

// ─── Device card ─────────────────────────────────────────────────────────────

function buildBatteryBar(pct, charging) {
  if (typeof pct !== 'number') {
    return `<span class="fm-card-battery-text">Battery: ${pct}</span>`;
  }
  const fill = pct;
  const color = pct > 20 ? '#34c759' : '#ff3b30';
  return `
    <div class="fm-card-battery">
      <div class="fm-card-battery-track">
        <div class="fm-card-battery-fill" style="width:${fill}%;background:${color};"></div>
      </div>
      <span class="fm-card-battery-pct">${charging ? '⚡' : ''}${pct}%</span>
    </div>`;
}

function buildCard(item, onClose, api) {
  const card = el('fm-detail-card');

  const isDevice = DEVICES.some(d => d.id === item.id);
  const isPerson = PEOPLE.some(p => p.id === item.id);
  const isItem = ITEMS.some(i => i.id === item.id);

  // Header
  const hdr = el('fm-card-hdr');
  const iconWrap = el('fm-card-icon-wrap');
  iconWrap.style.background = item.color + '22';

  if (item.initials) {
    const initEl = el('fm-card-initials');
    initEl.textContent = item.initials;
    initEl.style.color = item.initialsColor || item.color;
    iconWrap.append(initEl);
  } else {
    const glyph = el('fm-card-glyph');
    glyph.textContent = item.emoji;
    iconWrap.append(glyph);
  }

  const titleCol = el('fm-card-title-col');
  const nameEl = el('fm-card-name');
  nameEl.textContent = item.name;
  const modelEl = el('fm-card-model');
  modelEl.textContent = item.model || item.type || '';
  titleCol.append(nameEl, modelEl);

  const closeBtn = el('fm-card-close', 'button');
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Close';
  closeBtn.addEventListener('click', onClose);

  hdr.append(iconWrap, titleCol, closeBtn);
  card.append(hdr);

  // Location row
  const locRow = el('fm-card-row');
  locRow.innerHTML = `<span class="fm-card-row-icon">📍</span><span class="fm-card-row-text">${item.location}</span>`;
  card.append(locRow);

  // Last seen
  const seenRow = el('fm-card-row');
  seenRow.innerHTML = `<span class="fm-card-row-icon">🕐</span><span class="fm-card-row-text">Last seen: ${item.lastSeen}</span>`;
  card.append(seenRow);

  // Battery (devices and items)
  if (item.battery !== undefined) {
    const batRow = el('fm-card-row');
    batRow.innerHTML = `<span class="fm-card-row-icon">🔋</span>${buildBatteryBar(item.battery, item.batteryCharging)}`;
    card.append(batRow);
  }

  // Divider
  const div = el('fm-card-divider');
  card.append(div);

  // Action buttons
  const actions = el('fm-card-actions');

  function makeAction(icon, label, handler) {
    const btn = el('fm-action-btn', 'button');
    btn.innerHTML = `<span class="fm-action-icon">${icon}</span><span class="fm-action-label">${label}</span>`;
    btn.addEventListener('click', handler);
    return btn;
  }

  if (isDevice || isItem) {
    actions.append(makeAction('🔊', 'Play Sound', () => {
      api.toast(`Playing sound on ${item.name}…`);
    }));
    actions.append(makeAction('🗺️', 'Directions', () => {
      api.toast(`Opening directions to ${item.location}`);
      api.openApp('maps');
    }));
  }

  if (isDevice) {
    actions.append(makeAction('🔒', 'Mark As Lost', () => {
      api.toast(`${item.name} marked as Lost. Activation Lock enabled.`);
    }));
    actions.append(makeAction('📤', 'Notify When Found', () => {
      api.toast(`You'll be notified when ${item.name} is found.`);
    }));
  }

  if (isPerson) {
    actions.append(makeAction('💬', 'Send Message', () => {
      api.toast(`Opening Messages for ${item.name}…`);
      api.openApp('messages');
    }));
    actions.append(makeAction('🗺️', 'Directions', () => {
      api.toast(`Opening directions to ${item.name}'s location`);
      api.openApp('maps');
    }));
    actions.append(makeAction('🔕', 'Stop Sharing Location', () => {
      api.toast(`Location sharing with ${item.name} stopped.`);
    }));
  }

  if (isItem) {
    actions.append(makeAction('🔒', 'Enable Lost Mode', () => {
      api.toast(`Lost Mode enabled for ${item.name}.`);
    }));
  }

  card.append(actions);
  return card;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function buildSidebar(onSelect, selectedId) {
  const sidebar = el('fm-sidebar');

  // Search bar
  const searchWrap = el('fm-search-wrap');
  const searchInput = el('fm-search', 'input');
  searchInput.placeholder = 'Search';
  searchInput.type = 'text';
  const searchIcon = el('fm-search-icon');
  searchIcon.textContent = '🔍';
  searchWrap.append(searchIcon, searchInput);
  sidebar.append(searchWrap);

  // Segment tabs: Devices / People / Items / Me
  const tabs = el('fm-tabs');
  const tabDefs = [
    { key: 'devices', label: 'Devices' },
    { key: 'people', label: 'People' },
    { key: 'items', label: 'Items' },
    { key: 'me', label: 'Me' },
  ];
  let activeTab = 'devices';

  function renderList(tab, query = '') {
    list.innerHTML = '';
    const q = query.toLowerCase().trim();

    if (tab === 'devices') {
      renderSection('Devices', DEVICES.filter(d => !q || d.name.toLowerCase().includes(q)));
    } else if (tab === 'people') {
      renderSection('People', PEOPLE.filter(p => !q || p.name.toLowerCase().includes(q)));
    } else if (tab === 'items') {
      renderSection('Items', ITEMS.filter(i => !q || i.name.toLowerCase().includes(q)));
    } else if (tab === 'me') {
      renderMeSection();
    }
  }

  function renderSection(label, items) {
    if (!items.length) {
      const empty = el('fm-empty');
      empty.textContent = 'Nothing found.';
      list.append(empty);
      return;
    }
    items.forEach(item => {
      const row = buildRow(item, item.id === selectedId);
      row.addEventListener('click', () => onSelect(item));
      list.append(row);
    });
  }

  function renderMeSection() {
    const meCard = el('fm-me-card');
    meCard.innerHTML = `
      <div class="fm-me-avatar">🙂</div>
      <div class="fm-me-info">
        <div class="fm-me-name">Nicolas</div>
        <div class="fm-me-location">📍 San Francisco, CA</div>
        <div class="fm-me-share">Location sharing: <span class="fm-me-on">On</span></div>
      </div>
    `;
    list.append(meCard);

    const shareRow = el('fm-setting-row');
    shareRow.innerHTML = `
      <span class="fm-setting-label">Share My Location</span>
      <div class="fm-toggle fm-toggle-on" title="Toggle location sharing"></div>
    `;
    list.append(shareRow);
    const toggle = shareRow.querySelector('.fm-toggle');
    toggle.addEventListener('click', () => {
      const isOn = toggle.classList.contains('fm-toggle-on');
      toggle.classList.toggle('fm-toggle-on', !isOn);
      toggle.classList.toggle('fm-toggle-off', isOn);
    });
  }

  tabDefs.forEach(t => {
    const tabBtn = el('fm-tab', 'button');
    tabBtn.textContent = t.label;
    tabBtn.dataset.tab = t.key;
    if (t.key === activeTab) tabBtn.classList.add('active');
    tabBtn.addEventListener('click', () => {
      activeTab = t.key;
      tabs.querySelectorAll('.fm-tab').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      renderList(activeTab, searchInput.value);
    });
    tabs.append(tabBtn);
  });
  sidebar.append(tabs);

  // List container
  const list = el('fm-list');
  sidebar.append(list);

  // Wire search
  searchInput.addEventListener('input', () => {
    renderList(activeTab, searchInput.value);
  });

  // Initial render
  renderList('devices');

  // Expose a refresh method
  sidebar._refresh = (selId) => renderList(activeTab, searchInput.value);

  return sidebar;
}

function buildRow(item, active) {
  const row = el('fm-row');
  if (active) row.classList.add('active');

  // Icon
  const iconWrap = el('fm-row-icon');
  iconWrap.style.background = item.color + '22';
  if (item.initials) {
    iconWrap.textContent = item.initials;
    iconWrap.style.color = item.initialsColor || item.color;
    iconWrap.style.fontSize = '11px';
    iconWrap.style.fontWeight = '700';
  } else {
    iconWrap.textContent = item.emoji;
  }

  const info = el('fm-row-info');
  const name = el('fm-row-name');
  name.textContent = item.name;
  const sub = el('fm-row-sub');
  sub.textContent = item.lastSeen === 'Now' ? item.location : item.lastSeen;

  // Status dot
  const dot = el('fm-row-dot');
  dot.style.background = item.lastSeen === 'Now' ? '#34c759' :
    (item.lastSeen.includes('minute') ? '#ff9f0a' : '#8e8e93');

  info.append(name, sub);
  row.append(iconWrap, info, dot);
  return row;
}

// ─── Main content function ───────────────────────────────────────────────────

export function content(win, api) {
  const root = el('fm-root');

  // ── Layout: sidebar + map ──
  const layout = el('fm-layout');

  // Build map first
  const mapEl = buildMap();

  // Pins layer
  const pinsLayer = el('fm-pins-layer');
  mapEl.append(pinsLayer);

  // Selected item state
  let selectedItem = null;
  let detailCard = null;

  function selectItem(item) {
    selectedItem = item;

    // Update all pins
    pinsLayer.querySelectorAll('.fm-pin').forEach(p => {
      p.classList.toggle('selected', p.dataset.id === item.id);
    });

    // Update sidebar rows
    sidebar.querySelectorAll('.fm-row').forEach(r => {
      r.classList.remove('active');
    });

    // Show detail card
    if (detailCard) detailCard.remove();
    detailCard = buildCard(item, closeCard, api);
    mapEl.append(detailCard);

    // Pan map to pin position (visual effect via translate on grid)
    panToItem(item);
  }

  function closeCard() {
    if (detailCard) {
      detailCard.remove();
      detailCard = null;
    }
    selectedItem = null;
    pinsLayer.querySelectorAll('.fm-pin').forEach(p => p.classList.remove('selected'));
  }

  function panToItem(item) {
    // Nudge the map grid to center roughly on the selected item.
    // Map is 100%x100%; item is at mapX%, mapY%.
    // We shift so that point ends up near center of visible map area.
    const mapGrid = mapEl.querySelector('.fm-map-grid');
    if (!mapGrid) return;
    const cx = 50 - item.mapX;
    const cy = 50 - item.mapY;
    // Apply a gentle pan clamped to ±15%
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    mapGrid.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1)';
    // Reset zoom + pan
    const scaleStr = mapGrid.style.transform.match(/scale\(([^)]+)\)/);
    const currentScale = scaleStr ? parseFloat(scaleStr[1]) : 1;
    mapGrid.style.transform = `scale(${currentScale}) translate(${clamp(cx, -20, 20)}%, ${clamp(cy, -20, 20)}%)`;
  }

  // Build sidebar
  const sidebar = buildSidebar(selectItem, null);

  // Place all pins
  const allItems = [...DEVICES, ...PEOPLE, ...ITEMS];
  allItems.forEach(item => {
    const pin = createPin(item, selectItem);
    pinsLayer.append(pin);
  });

  layout.append(sidebar, mapEl);
  root.append(layout);

  // Click on map background closes card
  mapEl.addEventListener('click', () => closeCard());

  return root;
}
