// js/apps/weather.js — macOS Weather app, live data from Open-Meteo
// (free, no API key, CORS-enabled). Defaults to Singapore; city is changeable
// via the search panel (Open-Meteo geocoding). Temps in °C, wind in km/h.
import { el, setHTML } from '../dom.js';

const DEFAULT_CITY = { name: 'Singapore', region: 'Singapore', lat: 1.3521, lon: 103.8198 };

// A few one-tap cities shown when the search box is empty.
const QUICK_CITIES = [
  DEFAULT_CITY,
  { name: 'Kuala Lumpur', region: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  { name: 'Tokyo', region: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'London', region: 'United Kingdom', lat: 51.5072, lon: -0.1276 },
  { name: 'New York', region: 'United States', lat: 40.7128, lon: -74.0060 },
  { name: 'Sydney', region: 'Australia', lat: -33.8688, lon: 151.2093 },
];

const GRADIENTS = {
  sunny:           { day: 'linear-gradient(180deg,#1a8cff 0%,#f5a623 100%)', night: 'linear-gradient(180deg,#0d1b3e 0%,#1a2c5e 100%)' },
  'partly-cloudy': { day: 'linear-gradient(180deg,#3a7bd5 0%,#6ba3e0 60%,#c6daf7 100%)', night: 'linear-gradient(180deg,#0d1b3e 0%,#253659 100%)' },
  clear:           { day: 'linear-gradient(180deg,#0076ff 0%,#00aaff 100%)', night: 'linear-gradient(180deg,#07122e 0%,#0d2151 100%)' },
  cloudy:          { day: 'linear-gradient(180deg,#6a7a8c 0%,#9fb0c0 100%)', night: 'linear-gradient(180deg,#1a202c 0%,#2d3748 100%)' },
  rainy:           { day: 'linear-gradient(180deg,#4a5568 0%,#718096 60%,#a0aec0 100%)', night: 'linear-gradient(180deg,#1a202c 0%,#2d3748 100%)' },
  stormy:          { day: 'linear-gradient(180deg,#2d3748 0%,#4a5568 100%)', night: 'linear-gradient(180deg,#0f1523 0%,#1a202c 100%)' },
};

// WMO weather code -> [text, dayIcon, nightIcon, gradientKey]
const WMO = {
  0:  ['Clear', '☀️', '🌙', 'clear'],
  1:  ['Mainly Clear', '🌤️', '🌙', 'sunny'],
  2:  ['Partly Cloudy', '⛅', '☁️', 'partly-cloudy'],
  3:  ['Overcast', '☁️', '☁️', 'cloudy'],
  45: ['Fog', '🌫️', '🌫️', 'cloudy'], 48: ['Rime Fog', '🌫️', '🌫️', 'cloudy'],
  51: ['Light Drizzle', '🌦️', '🌧️', 'rainy'], 53: ['Drizzle', '🌦️', '🌧️', 'rainy'], 55: ['Heavy Drizzle', '🌧️', '🌧️', 'rainy'],
  56: ['Freezing Drizzle', '🌧️', '🌧️', 'rainy'], 57: ['Freezing Drizzle', '🌧️', '🌧️', 'rainy'],
  61: ['Light Rain', '🌦️', '🌧️', 'rainy'], 63: ['Rain', '🌧️', '🌧️', 'rainy'], 65: ['Heavy Rain', '🌧️', '🌧️', 'rainy'],
  66: ['Freezing Rain', '🌧️', '🌧️', 'rainy'], 67: ['Freezing Rain', '🌧️', '🌧️', 'rainy'],
  71: ['Light Snow', '🌨️', '🌨️', 'cloudy'], 73: ['Snow', '❄️', '❄️', 'cloudy'], 75: ['Heavy Snow', '❄️', '❄️', 'cloudy'], 77: ['Snow Grains', '🌨️', '🌨️', 'cloudy'],
  80: ['Light Showers', '🌦️', '🌧️', 'rainy'], 81: ['Showers', '🌧️', '🌧️', 'rainy'], 82: ['Heavy Showers', '⛈️', '⛈️', 'stormy'],
  85: ['Snow Showers', '🌨️', '🌨️', 'cloudy'], 86: ['Snow Showers', '❄️', '❄️', 'cloudy'],
  95: ['Thunderstorm', '⛈️', '⛈️', 'stormy'], 96: ['Thunderstorm', '⛈️', '⛈️', 'stormy'], 99: ['Thunderstorm', '⛈️', '⛈️', 'stormy'],
};
const wmo = (code) => WMO[code] || ['—', '⛅', '☁️', 'partly-cloudy'];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const compass = (deg) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(((deg % 360) / 45)) % 8];
const fmtClock = (iso) => { let h = parseInt(iso.slice(11, 13), 10); const mn = iso.slice(14, 16); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${mn} ${ap}`; };
const fmtHour = (iso) => { let h = parseInt(iso.slice(11, 13), 10); const ap = h >= 12 ? 'PM' : 'AM'; return (h % 12 || 12) + ap; };
const weekday = (iso) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(iso + 'T00:00').getDay()];
const uvLabel = (uv) => uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';

async function fetchWeather(lat, lon) {
  const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon
    + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,precipitation'
    + '&hourly=temperature_2m,weather_code'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max'
    + '&timezone=auto&forecast_days=10&wind_speed_unit=kmh';
  const r = await fetch(u);
  if (!r.ok) throw new Error('weather ' + r.status);
  return r.json();
}
async function geocode(q) {
  try {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=' + encodeURIComponent(q));
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).map((x) => ({
      name: x.name,
      region: [x.admin1, x.country].filter(Boolean).join(', '),
      lat: x.latitude, lon: x.longitude,
    }));
  } catch { return []; }
}

export function content(win, api) {
  let city = api.load('city', DEFAULT_CITY);
  if (!city || typeof city.lat !== 'number') city = DEFAULT_CITY;

  const root = el('w-root');

  // ── Header ──
  const header = el('w-header');
  const titleEl = el('w-header-title'); titleEl.textContent = 'Weather';
  const menuBtn = el('w-menu-btn', 'button'); menuBtn.innerHTML = '&#9776;'; menuBtn.title = 'Change city';
  header.append(titleEl, menuBtn);

  // ── City panel (slide-in search) ──
  const cityPanel = el('w-city-panel');
  const citySearch = el('w-city-search-wrap');
  const citySearchInput = el('w-city-input', 'input');
  citySearchInput.placeholder = '🔍  Search for a city…';
  citySearchInput.type = 'text';
  citySearch.append(citySearchInput);
  const cityList = el('w-city-list');
  cityPanel.append(citySearch, cityList);

  function renderCityList(list) {
    cityList.innerHTML = '';
    if (!list || !list.length) { cityList.append(setHTML('w-city-row', '<span class="wcr-name" style="opacity:.6">No matches</span>')); return; }
    list.forEach((c) => {
      const row = el('w-city-row');
      if (Math.abs(c.lat - city.lat) < 0.05 && Math.abs(c.lon - city.lon) < 0.05) row.classList.add('active');
      row.innerHTML = `<span class="wcr-name">${esc(c.name)}</span><span class="wcr-sub">${esc(c.region)}</span>`;
      row.addEventListener('click', () => { loadCity(c); closeCityPanel(); });
      cityList.append(row);
    });
  }

  let searchTimer = null;
  citySearchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = citySearchInput.value.trim();
    if (!q) { renderCityList(QUICK_CITIES); return; }
    searchTimer = setTimeout(async () => {
      const results = await geocode(q);
      if (citySearchInput.value.trim() === q) renderCityList(results);
    }, 300);
  });

  const openCityPanel = () => { cityPanel.classList.add('open'); citySearchInput.value = ''; renderCityList(QUICK_CITIES); setTimeout(() => citySearchInput.focus(), 120); };
  const closeCityPanel = () => cityPanel.classList.remove('open');
  menuBtn.addEventListener('click', () => cityPanel.classList.contains('open') ? closeCityPanel() : openCityPanel());

  // ── Main scroller ──
  const scroller = el('w-scroller');
  const hero = el('w-hero');
  const heroCity = el('w-city-name'), heroRegion = el('w-city-region'), heroTemp = el('w-hero-temp'), heroCond = el('w-hero-cond'), heroHiLo = el('w-hero-hilo');
  hero.append(heroCity, heroRegion, heroTemp, heroCond, heroHiLo);

  const hourlySection = el('w-section');
  hourlySection.append(setHTML('w-section-hdr', '<span>HOURLY FORECAST</span><span>🕐</span>'));
  const hourlyStrip = el('w-hourly-strip'); hourlySection.append(hourlyStrip);

  const forecastSection = el('w-section');
  forecastSection.append(setHTML('w-section-hdr', '<span>10-DAY FORECAST</span><span>📅</span>'));
  const forecastList = el('w-forecast-list'); forecastSection.append(forecastList);

  const detailsSection = el('w-section');
  detailsSection.append(setHTML('w-section-hdr', '<span>CONDITIONS</span><span>🌡️</span>'));
  const detailsGrid = el('w-details-grid'); detailsSection.append(detailsGrid);

  scroller.append(hero, hourlySection, forecastSection, detailsSection);
  root.append(header, cityPanel, scroller);
  scroller.addEventListener('click', () => { if (cityPanel.classList.contains('open')) closeCityPanel(); });

  // ── States ──
  function showLoading() {
    heroCity.textContent = city.name; heroRegion.textContent = city.region || '';
    heroTemp.textContent = '··°'; heroCond.textContent = 'Loading…'; heroHiLo.textContent = '';
    hourlyStrip.innerHTML = ''; forecastList.innerHTML = ''; detailsGrid.innerHTML = '';
    root.style.background = GRADIENTS['partly-cloudy'].day;
  }
  function showError() { heroCond.textContent = 'Unable to load weather'; heroTemp.textContent = '—'; }

  function render(data) {
    const cur = data.current, day = data.daily, hrs = data.hourly;
    const isDay = cur.is_day !== 0;
    const [condText, dIcon, nIcon, gKey] = wmo(cur.weather_code);
    const grad = GRADIENTS[gKey] || GRADIENTS['partly-cloudy'];
    root.style.background = isDay ? grad.day : grad.night;

    // Hero
    heroCity.textContent = city.name;
    heroRegion.textContent = city.region || '';
    heroTemp.textContent = Math.round(cur.temperature_2m) + '°';
    heroCond.textContent = condText;
    heroHiLo.textContent = `H:${Math.round(day.temperature_2m_max[0])}°   L:${Math.round(day.temperature_2m_min[0])}°`;

    // Hourly — next ~10 hours starting at the current hour
    hourlyStrip.innerHTML = '';
    const nowH = cur.time.slice(0, 13);
    let s = hrs.time.findIndex((t) => t.slice(0, 13) >= nowH);
    if (s < 0) s = 0;
    for (let i = s; i < Math.min(s + 10, hrs.time.length); i++) {
      const [, di, ni] = wmo(hrs.weather_code[i]);
      const hourIsDay = parseInt(hrs.time[i].slice(11, 13), 10) >= 6 && parseInt(hrs.time[i].slice(11, 13), 10) < 19;
      const item = el('w-hourly-item');
      item.innerHTML =
        `<span class="whi-label">${i === s ? 'Now' : fmtHour(hrs.time[i])}</span>` +
        `<span class="whi-icon">${hourIsDay ? di : ni}</span>` +
        `<span class="whi-temp">${Math.round(hrs.temperature_2m[i])}°</span>`;
      hourlyStrip.append(item);
    }

    // 10-day forecast
    forecastList.innerHTML = '';
    const gLo = Math.min(...day.temperature_2m_min), gHi = Math.max(...day.temperature_2m_max), span = (gHi - gLo) || 1;
    day.time.forEach((dt, i) => {
      const lo = Math.round(day.temperature_2m_min[i]), hi = Math.round(day.temperature_2m_max[i]);
      const [, di] = wmo(day.weather_code[i]);
      const row = el('w-forecast-row');
      const bar = el('wf-bar'); const fill = el('wf-bar-fill');
      fill.style.left = ((lo - gLo) / span * 100) + '%';
      fill.style.width = Math.max((hi - lo) / span * 100, 6) + '%';
      bar.append(fill);
      const dayEl = setHTML('wf-day', i === 0 ? 'Today' : weekday(dt));
      const iconEl = setHTML('wf-icon', di);
      const loEl = setHTML('wf-lo', lo + '°');
      const hiEl = setHTML('wf-hi', hi + '°');
      row.append(dayEl, iconEl, loEl, bar, hiEl);
      forecastList.append(row);
    });

    // Detail tiles
    detailsGrid.innerHTML = '';
    const uv = Math.round(day.uv_index_max[0] || 0);
    const hum = Math.round(cur.relative_humidity_2m);
    const tiles = [
      { label: '☀️ UV INDEX', value: uv, sub: uvLabel(uv) },
      { label: '💨 WIND', value: `${Math.round(cur.wind_speed_10m)} km/h`, sub: compass(cur.wind_direction_10m) },
      { label: '💧 HUMIDITY', value: `${hum}%`, sub: hum < 40 ? 'Dry' : hum < 65 ? 'Comfortable' : 'Humid' },
      { label: '🌅 SUNRISE', value: fmtClock(day.sunrise[0]), sub: 'Sunset ' + fmtClock(day.sunset[0]) },
      { label: '🌡️ FEELS LIKE', value: `${Math.round(cur.apparent_temperature)}°`, sub: cur.apparent_temperature > cur.temperature_2m ? 'Humidity' : 'Wind chill' },
      { label: '🌧️ PRECIPITATION', value: `${(cur.precipitation || 0).toFixed(1)} mm`, sub: condText },
    ];
    tiles.forEach((t) => {
      detailsGrid.append(setHTML('w-tile',
        `<div class="wt-label">${t.label}</div><div class="wt-value">${t.value}</div><div class="wt-sub">${esc(t.sub)}</div>`));
    });

    if (cityPanel.classList.contains('open')) renderCityList(citySearchInput.value.trim() ? null : QUICK_CITIES);
  }

  async function loadCity(c) {
    city = c;
    api.store('city', c);
    api.setTitle(c.name);
    showLoading();
    try { render(await fetchWeather(c.lat, c.lon)); }
    catch (e) { showError(); }
  }

  loadCity(city);
  return root;
}
