// js/apps/home.js — Home: interactive smart-home accessories with persistence.
import { el, setHTML } from '../dom.js';

const ROOMS = ['Favorites', 'Living Room', 'Bedroom', 'Kitchen', 'Office'];

// Default accessory definitions. State (on/value) is persisted per-id.
const ACCESSORIES = [
  { id: 'lr-ceiling', room: 'Living Room', fav: true, type: 'light', name: 'Ceiling', icon: '💡', on: true },
  { id: 'lr-lamp', room: 'Living Room', fav: true, type: 'light', name: 'Floor Lamp', icon: '🛋️', on: false },
  { id: 'lr-tv', room: 'Living Room', fav: false, type: 'plug', name: 'TV', icon: '📺', on: true },
  { id: 'lr-thermo', room: 'Living Room', fav: true, type: 'thermostat', name: 'Thermostat', icon: '🌡️', value: 72 },
  { id: 'lr-speaker', room: 'Living Room', fav: false, type: 'speaker', name: 'HomePod', icon: '🔊', on: false },
  { id: 'fd-door', room: 'Living Room', fav: true, type: 'lock', name: 'Front Door', icon: '🚪', on: true },

  { id: 'br-lamp', room: 'Bedroom', fav: true, type: 'light', name: 'Bedside', icon: '🛏️', on: false },
  { id: 'br-fan', room: 'Bedroom', fav: false, type: 'fan', name: 'Ceiling Fan', icon: '🌀', on: false },
  { id: 'br-blinds', room: 'Bedroom', fav: false, type: 'blinds', name: 'Blinds', icon: '🪟', on: true },

  { id: 'kt-light', room: 'Kitchen', fav: true, type: 'light', name: 'Counter', icon: '🍳', on: true },
  { id: 'kt-coffee', room: 'Kitchen', fav: false, type: 'plug', name: 'Coffee Maker', icon: '☕', on: false },
  { id: 'kt-cam', room: 'Kitchen', fav: false, type: 'camera', name: 'Camera', icon: '📷', on: true },

  { id: 'of-light', room: 'Office', fav: false, type: 'light', name: 'Desk Lamp', icon: '💡', on: true },
  { id: 'of-plug', room: 'Office', fav: false, type: 'plug', name: 'Monitor', icon: '🖥️', on: true },
];

const ON_LABEL = {
  light: 'On', plug: 'On', speaker: 'Playing', fan: 'On', camera: 'Live', blinds: 'Open',
};
const OFF_LABEL = {
  light: 'Off', plug: 'Off', speaker: 'Paused', fan: 'Off', camera: 'Off', blinds: 'Closed',
};

export function content(win, api) {
  // hydrate persisted state
  const saved = api.load('home', {});
  ACCESSORIES.forEach((a) => {
    if (saved[a.id]) {
      if ('on' in saved[a.id]) a.on = saved[a.id].on;
      if ('value' in saved[a.id]) a.value = saved[a.id].value;
    }
  });
  function persist() {
    const map = {};
    ACCESSORIES.forEach((a) => { map[a.id] = { on: a.on, value: a.value }; });
    api.store('home', map);
  }

  let activeRoom = 'Favorites';

  const root = el('home-root');

  const header = el('home-header');
  const tabs = el('home-tabs');
  const grid = el('home-grid');
  root.append(header, tabs, grid);

  ROOMS.forEach((r) => {
    const t = el('home-tab' + (r === activeRoom ? ' active' : ''), 'button');
    t.textContent = r;
    t.addEventListener('click', () => {
      activeRoom = r;
      tabs.querySelectorAll('.home-tab').forEach((x) => x.classList.toggle('active', x === t));
      render();
    });
    tabs.append(t);
  });

  function visibleAccessories() {
    return activeRoom === 'Favorites' ? ACCESSORIES.filter((a) => a.fav) : ACCESSORIES.filter((a) => a.room === activeRoom);
  }

  function updateHeader() {
    const list = visibleAccessories();
    const lightsOn = list.filter((a) => a.type !== 'thermostat' && a.on).length;
    const thermo = list.find((a) => a.type === 'thermostat');
    const climate = thermo ? ` · ${thermo.value}°` : '';
    header.innerHTML = `<div class="home-title">${activeRoom}</div>
      <div class="home-sub">${lightsOn} accessor${lightsOn === 1 ? 'y' : 'ies'} on${climate}</div>`;
  }

  function render() {
    updateHeader();
    grid.innerHTML = '';
    visibleAccessories().forEach((a) => grid.append(a.type === 'thermostat' ? thermoTile(a) : toggleTile(a)));
    if (!visibleAccessories().length) grid.append(setHTML('home-empty', 'No accessories in this room.'));
  }

  function toggleTile(a) {
    const tile = el('home-tile' + (a.on ? ' on' : ''));
    tile.innerHTML = `
      <div class="home-tile-top">
        <span class="home-ic">${a.icon}</span>
        <span class="home-bulb"></span>
      </div>
      <div class="home-tile-name">${a.name}</div>
      <div class="home-tile-state">${a.on ? (ON_LABEL[a.type] || 'On') : (OFF_LABEL[a.type] || 'Off')}</div>`;
    if (a.type === 'lock') {
      tile.querySelector('.home-tile-state').textContent = a.on ? 'Locked' : 'Unlocked';
      tile.classList.toggle('locked', a.on);
    }
    if (a.type === 'fan' && a.on) tile.classList.add('spinning');
    tile.addEventListener('click', () => {
      a.on = !a.on;
      persist();
      render();
      api.toast(`${a.name}: ${tileStateText(a)}`);
    });
    return tile;
  }
  function tileStateText(a) {
    if (a.type === 'lock') return a.on ? 'Locked' : 'Unlocked';
    return a.on ? (ON_LABEL[a.type] || 'On') : (OFF_LABEL[a.type] || 'Off');
  }

  function thermoTile(a) {
    const tile = el('home-tile home-thermo');
    function paint() {
      tile.innerHTML = `
        <div class="home-thermo-head"><span class="home-ic">🌡️</span><span class="home-tile-name">${a.name}</span></div>
        <div class="home-thermo-dial">
          <button class="home-thermo-btn" data-d="-1">−</button>
          <div class="home-thermo-val">${a.value}<span class="home-deg">°</span></div>
          <button class="home-thermo-btn" data-d="1">+</button>
        </div>
        <div class="home-thermo-mode">${a.value >= 74 ? '❄️ Cooling' : a.value <= 68 ? '🔥 Heating' : '✓ Set to comfort'}</div>`;
      tile.style.setProperty('--heat', Math.max(0, Math.min(1, (a.value - 60) / 24)));
      tile.querySelectorAll('.home-thermo-btn').forEach((b) => b.addEventListener('click', (e) => {
        e.stopPropagation();
        a.value = Math.max(50, Math.min(85, a.value + parseInt(b.dataset.d)));
        persist(); paint(); updateHeader();
      }));
    }
    paint();
    return tile;
  }

  render();
  return root;
}
