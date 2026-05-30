// js/apps/weather.js — macOS Weather app (rich, self-contained)
import { el, setHTML } from '../dom.js';

// ─── Mock city data ──────────────────────────────────────────────────────────
const CITIES = [
  {
    id: 'cupertino',
    name: 'Cupertino',
    region: 'California',
    condition: 'Partly Cloudy',
    conditionKey: 'partly-cloudy',
    temp: 72,
    hi: 78,
    lo: 61,
    uv: 5,
    wind: 9,
    windDir: 'W',
    humidity: 48,
    sunrise: '6:14 AM',
    sunset: '8:02 PM',
    visibility: 10,
    feelsLike: 70,
    hourly: [
      { label: 'Now',  icon: '⛅', temp: 72 },
      { label: '1PM',  icon: '🌤️', temp: 74 },
      { label: '2PM',  icon: '🌤️', temp: 76 },
      { label: '3PM',  icon: '⛅', temp: 75 },
      { label: '4PM',  icon: '⛅', temp: 73 },
      { label: '5PM',  icon: '🌥️', temp: 71 },
      { label: '6PM',  icon: '🌥️', temp: 69 },
      { label: '7PM',  icon: '🌙', temp: 67 },
      { label: '8PM',  icon: '🌙', temp: 65 },
      { label: '9PM',  icon: '🌙', temp: 64 },
    ],
    forecast: [
      { day: 'Today', icon: '⛅', lo: 61, hi: 78 },
      { day: 'Sat',   icon: '☀️', lo: 59, hi: 82 },
      { day: 'Sun',   icon: '☀️', lo: 62, hi: 85 },
      { day: 'Mon',   icon: '🌤️', lo: 60, hi: 80 },
      { day: 'Tue',   icon: '⛅', lo: 58, hi: 77 },
      { day: 'Wed',   icon: '🌦️', lo: 55, hi: 71 },
      { day: 'Thu',   icon: '🌧️', lo: 52, hi: 66 },
      { day: 'Fri',   icon: '🌦️', lo: 54, hi: 69 },
      { day: 'Sat',   icon: '⛅', lo: 57, hi: 73 },
      { day: 'Sun',   icon: '☀️', lo: 60, hi: 78 },
    ],
  },
  {
    id: 'new-york',
    name: 'New York',
    region: 'New York',
    condition: 'Sunny',
    conditionKey: 'sunny',
    temp: 68,
    hi: 72,
    lo: 55,
    uv: 7,
    wind: 14,
    windDir: 'NE',
    humidity: 52,
    sunrise: '5:28 AM',
    sunset: '8:15 PM',
    visibility: 9,
    feelsLike: 65,
    hourly: [
      { label: 'Now',  icon: '☀️', temp: 68 },
      { label: '1PM',  icon: '☀️', temp: 70 },
      { label: '2PM',  icon: '☀️', temp: 72 },
      { label: '3PM',  icon: '🌤️', temp: 71 },
      { label: '4PM',  icon: '🌤️', temp: 69 },
      { label: '5PM',  icon: '⛅', temp: 67 },
      { label: '6PM',  icon: '⛅', temp: 64 },
      { label: '7PM',  icon: '🌙', temp: 61 },
      { label: '8PM',  icon: '🌙', temp: 59 },
      { label: '9PM',  icon: '🌙', temp: 57 },
    ],
    forecast: [
      { day: 'Today', icon: '☀️', lo: 55, hi: 72 },
      { day: 'Sat',   icon: '🌤️', lo: 53, hi: 70 },
      { day: 'Sun',   icon: '⛅', lo: 51, hi: 67 },
      { day: 'Mon',   icon: '🌦️', lo: 48, hi: 63 },
      { day: 'Tue',   icon: '🌧️', lo: 46, hi: 60 },
      { day: 'Wed',   icon: '⛅', lo: 50, hi: 65 },
      { day: 'Thu',   icon: '☀️', lo: 52, hi: 68 },
      { day: 'Fri',   icon: '☀️', lo: 54, hi: 71 },
      { day: 'Sat',   icon: '🌤️', lo: 53, hi: 69 },
      { day: 'Sun',   icon: '⛅', lo: 51, hi: 66 },
    ],
  },
  {
    id: 'london',
    name: 'London',
    region: 'United Kingdom',
    condition: 'Drizzle',
    conditionKey: 'rainy',
    temp: 54,
    hi: 58,
    lo: 49,
    uv: 2,
    wind: 18,
    windDir: 'SW',
    humidity: 78,
    sunrise: '4:52 AM',
    sunset: '9:11 PM',
    visibility: 5,
    feelsLike: 50,
    hourly: [
      { label: 'Now',  icon: '🌧️', temp: 54 },
      { label: '1PM',  icon: '🌦️', temp: 55 },
      { label: '2PM',  icon: '🌦️', temp: 56 },
      { label: '3PM',  icon: '⛅', temp: 57 },
      { label: '4PM',  icon: '⛅', temp: 57 },
      { label: '5PM',  icon: '🌥️', temp: 56 },
      { label: '6PM',  icon: '🌧️', temp: 54 },
      { label: '7PM',  icon: '🌧️', temp: 52 },
      { label: '8PM',  icon: '🌙', temp: 51 },
      { label: '9PM',  icon: '🌙', temp: 50 },
    ],
    forecast: [
      { day: 'Today', icon: '🌧️', lo: 49, hi: 58 },
      { day: 'Sat',   icon: '⛅', lo: 50, hi: 60 },
      { day: 'Sun',   icon: '🌤️', lo: 51, hi: 62 },
      { day: 'Mon',   icon: '⛅', lo: 49, hi: 59 },
      { day: 'Tue',   icon: '🌦️', lo: 47, hi: 56 },
      { day: 'Wed',   icon: '🌧️', lo: 46, hi: 54 },
      { day: 'Thu',   icon: '⛅', lo: 48, hi: 57 },
      { day: 'Fri',   icon: '🌤️', lo: 50, hi: 61 },
      { day: 'Sat',   icon: '☀️', lo: 52, hi: 64 },
      { day: 'Sun',   icon: '🌤️', lo: 51, hi: 62 },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    region: 'Japan',
    condition: 'Clear',
    conditionKey: 'clear',
    temp: 82,
    hi: 88,
    lo: 74,
    uv: 9,
    wind: 7,
    windDir: 'S',
    humidity: 65,
    sunrise: '4:30 AM',
    sunset: '7:01 PM',
    visibility: 12,
    feelsLike: 87,
    hourly: [
      { label: 'Now',  icon: '☀️', temp: 82 },
      { label: '1PM',  icon: '☀️', temp: 85 },
      { label: '2PM',  icon: '☀️', temp: 87 },
      { label: '3PM',  icon: '☀️', temp: 88 },
      { label: '4PM',  icon: '🌤️', temp: 86 },
      { label: '5PM',  icon: '🌤️', temp: 84 },
      { label: '6PM',  icon: '⛅', temp: 81 },
      { label: '7PM',  icon: '🌙', temp: 78 },
      { label: '8PM',  icon: '🌙', temp: 76 },
      { label: '9PM',  icon: '🌙', temp: 75 },
    ],
    forecast: [
      { day: 'Today', icon: '☀️', lo: 74, hi: 88 },
      { day: 'Sat',   icon: '☀️', lo: 75, hi: 90 },
      { day: 'Sun',   icon: '🌤️', lo: 73, hi: 88 },
      { day: 'Mon',   icon: '⛅', lo: 71, hi: 85 },
      { day: 'Tue',   icon: '🌦️', lo: 69, hi: 82 },
      { day: 'Wed',   icon: '⛅', lo: 70, hi: 84 },
      { day: 'Thu',   icon: '☀️', lo: 72, hi: 87 },
      { day: 'Fri',   icon: '☀️', lo: 74, hi: 89 },
      { day: 'Sat',   icon: '🌤️', lo: 73, hi: 87 },
      { day: 'Sun',   icon: '⛅', lo: 71, hi: 85 },
    ],
  },
  {
    id: 'sydney',
    name: 'Sydney',
    region: 'Australia',
    condition: 'Thunderstorms',
    conditionKey: 'stormy',
    temp: 63,
    hi: 68,
    lo: 57,
    uv: 3,
    wind: 24,
    windDir: 'NW',
    humidity: 84,
    sunrise: '7:01 AM',
    sunset: '5:08 PM',
    visibility: 3,
    feelsLike: 58,
    hourly: [
      { label: 'Now',  icon: '⛈️', temp: 63 },
      { label: '1PM',  icon: '⛈️', temp: 64 },
      { label: '2PM',  icon: '🌩️', temp: 65 },
      { label: '3PM',  icon: '🌧️', temp: 66 },
      { label: '4PM',  icon: '🌦️', temp: 65 },
      { label: '5PM',  icon: '⛅', temp: 63 },
      { label: '6PM',  icon: '🌥️', temp: 61 },
      { label: '7PM',  icon: '🌙', temp: 60 },
      { label: '8PM',  icon: '🌙', temp: 59 },
      { label: '9PM',  icon: '🌙', temp: 58 },
    ],
    forecast: [
      { day: 'Today', icon: '⛈️', lo: 57, hi: 68 },
      { day: 'Sat',   icon: '🌦️', lo: 58, hi: 70 },
      { day: 'Sun',   icon: '⛅', lo: 56, hi: 68 },
      { day: 'Mon',   icon: '🌤️', lo: 55, hi: 66 },
      { day: 'Tue',   icon: '☀️', lo: 54, hi: 65 },
      { day: 'Wed',   icon: '☀️', lo: 56, hi: 67 },
      { day: 'Thu',   icon: '🌤️', lo: 57, hi: 69 },
      { day: 'Fri',   icon: '⛅', lo: 58, hi: 71 },
      { day: 'Sat',   icon: '🌦️', lo: 56, hi: 68 },
      { day: 'Sun',   icon: '⛈️', lo: 55, hi: 65 },
    ],
  },
];

// ─── Background gradients by condition + approximate time-of-day ─────────────
const GRADIENTS = {
  sunny:         { day: 'linear-gradient(180deg,#1a8cff 0%,#f5a623 100%)', night: 'linear-gradient(180deg,#0d1b3e 0%,#1a2c5e 100%)' },
  'partly-cloudy': { day: 'linear-gradient(180deg,#3a7bd5 0%,#6ba3e0 60%,#c6daf7 100%)', night: 'linear-gradient(180deg,#0d1b3e 0%,#253659 100%)' },
  clear:         { day: 'linear-gradient(180deg,#0076ff 0%,#00aaff 100%)', night: 'linear-gradient(180deg,#07122e 0%,#0d2151 100%)' },
  rainy:         { day: 'linear-gradient(180deg,#4a5568 0%,#718096 60%,#a0aec0 100%)', night: 'linear-gradient(180deg,#1a202c 0%,#2d3748 100%)' },
  stormy:        { day: 'linear-gradient(180deg,#2d3748 0%,#4a5568 100%)', night: 'linear-gradient(180deg,#0f1523 0%,#1a202c 100%)' },
};

function getBg(city) {
  const h = new Date().getHours();
  const isNight = h < 6 || h >= 20;
  const g = GRADIENTS[city.conditionKey] || GRADIENTS['partly-cloudy'];
  return isNight ? g.night : g.day;
}

// ─── UV index label ───────────────────────────────────────────────────────────
function uvLabel(uv) {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

// ─── Temp range bar helpers ───────────────────────────────────────────────────
function buildRangeBar(lo, hi, globalLo, globalHi) {
  const span = globalHi - globalLo || 1;
  const left = ((lo - globalLo) / span) * 100;
  const width = ((hi - lo) / span) * 100;
  const bar = el('wf-bar');
  const fill = el('wf-bar-fill');
  fill.style.left = left + '%';
  fill.style.width = Math.max(width, 6) + '%';
  bar.append(fill);
  return bar;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function content(win, api) {
  // Load persisted city index
  let cityIdx = Number(api.load('cityIdx', 0));
  if (cityIdx < 0 || cityIdx >= CITIES.length) cityIdx = 0;

  const root = el('w-root');

  // ── Header bar (search / city list toggle) ──
  const header = el('w-header');
  const titleEl = el('w-header-title');
  titleEl.textContent = 'Weather';
  const menuBtn = el('w-menu-btn', 'button');
  menuBtn.innerHTML = '&#9776;'; // hamburger
  menuBtn.title = 'City list';
  header.append(titleEl, menuBtn);

  // ── City panel (slide-in sidebar) ──
  const cityPanel = el('w-city-panel');
  const citySearch = el('w-city-search-wrap');
  const citySearchInput = el('w-city-input', 'input');
  citySearchInput.placeholder = '🔍  Search cities…';
  citySearchInput.setAttribute('type', 'text');
  citySearch.append(citySearchInput);

  const cityList = el('w-city-list');
  function renderCityList(filter) {
    cityList.innerHTML = '';
    CITIES.forEach((c, i) => {
      const q = filter ? filter.toLowerCase() : '';
      if (q && !c.name.toLowerCase().includes(q) && !c.region.toLowerCase().includes(q)) return;
      const row = el('w-city-row');
      if (i === cityIdx) row.classList.add('active');
      row.innerHTML =
        `<span class="wcr-name">${c.name}</span>` +
        `<span class="wcr-sub">${c.region}</span>` +
        `<span class="wcr-temp">${c.temp}°</span>`;
      row.addEventListener('click', () => {
        cityIdx = i;
        api.store('cityIdx', cityIdx);
        renderAll();
        closeCityPanel();
      });
      cityList.append(row);
    });
  }

  cityPanel.append(citySearch, cityList);

  citySearchInput.addEventListener('input', () => renderCityList(citySearchInput.value));

  function openCityPanel() {
    cityPanel.classList.add('open');
    citySearchInput.value = '';
    renderCityList('');
    setTimeout(() => citySearchInput.focus(), 100);
  }
  function closeCityPanel() {
    cityPanel.classList.remove('open');
  }
  menuBtn.addEventListener('click', () => {
    cityPanel.classList.contains('open') ? closeCityPanel() : openCityPanel();
  });

  // ── Scrollable main content area ──
  const scroller = el('w-scroller');

  // Hero section
  const hero = el('w-hero');
  const heroCity   = el('w-city-name');
  const heroRegion = el('w-city-region');
  const heroTemp   = el('w-hero-temp');
  const heroCond   = el('w-hero-cond');
  const heroHiLo   = el('w-hero-hilo');
  hero.append(heroCity, heroRegion, heroTemp, heroCond, heroHiLo);

  // Hourly strip
  const hourlySection = el('w-section');
  const hourlyHeader = setHTML('w-section-hdr', '<span>HOURLY FORECAST</span><span>🕐</span>');
  const hourlyStrip = el('w-hourly-strip');
  hourlySection.append(hourlyHeader, hourlyStrip);

  // 10-day forecast
  const forecastSection = el('w-section');
  const forecastHeader = setHTML('w-section-hdr', '<span>10-DAY FORECAST</span><span>📅</span>');
  const forecastList = el('w-forecast-list');
  forecastSection.append(forecastHeader, forecastList);

  // Detail tiles grid
  const detailsSection = el('w-section');
  const detailsHeader = setHTML('w-section-hdr', '<span>CONDITIONS</span><span>🌡️</span>');
  const detailsGrid = el('w-details-grid');
  detailsSection.append(detailsHeader, detailsGrid);

  scroller.append(hero, hourlySection, forecastSection, detailsSection);

  // ── Assemble root ──
  root.append(header, cityPanel, scroller);

  // Close city panel when clicking scroller
  scroller.addEventListener('click', () => {
    if (cityPanel.classList.contains('open')) closeCityPanel();
  });

  // ── Render function ──
  function renderAll() {
    const city = CITIES[cityIdx];
    api.setTitle(city.name);

    // Background gradient on root
    root.style.background = getBg(city);

    // Hero
    heroCity.textContent = city.name;
    heroRegion.textContent = city.region;
    heroTemp.textContent = city.temp + '°';
    heroCond.textContent = city.condition;
    heroHiLo.textContent = `H:${city.hi}°   L:${city.lo}°`;

    // Hourly
    hourlyStrip.innerHTML = '';
    city.hourly.forEach((h) => {
      const item = el('w-hourly-item');
      item.innerHTML =
        `<span class="whi-label">${h.label}</span>` +
        `<span class="whi-icon">${h.icon}</span>` +
        `<span class="whi-temp">${h.temp}°</span>`;
      hourlyStrip.append(item);
    });

    // 10-day forecast with temperature range bars
    forecastList.innerHTML = '';
    const globalLo = Math.min(...city.forecast.map((d) => d.lo));
    const globalHi = Math.max(...city.forecast.map((d) => d.hi));
    city.forecast.forEach((d) => {
      const row = el('w-forecast-row');
      const dayEl = el('wf-day');
      dayEl.textContent = d.day;
      const iconEl = el('wf-icon');
      iconEl.textContent = d.icon;
      const loEl = el('wf-lo');
      loEl.textContent = d.lo + '°';
      const bar = buildRangeBar(d.lo, d.hi, globalLo, globalHi);
      const hiEl = el('wf-hi');
      hiEl.textContent = d.hi + '°';
      row.append(dayEl, iconEl, loEl, bar, hiEl);
      forecastList.append(row);
    });

    // Detail tiles
    detailsGrid.innerHTML = '';
    const tiles = [
      { icon: '☀️', label: 'UV INDEX',    value: city.uv, sub: uvLabel(city.uv) },
      { icon: '💨', label: 'WIND',         value: `${city.wind} mph`, sub: city.windDir },
      { icon: '💧', label: 'HUMIDITY',     value: `${city.humidity}%`, sub: city.humidity < 40 ? 'Dry' : city.humidity < 60 ? 'Comfortable' : 'Humid' },
      { icon: '🌅', label: 'SUNRISE',      value: city.sunrise, sub: 'Sunset ' + city.sunset },
      { icon: '🌡️', label: 'FEELS LIKE',  value: `${city.feelsLike}°`, sub: city.feelsLike < city.temp ? 'Wind chill' : 'Heat index' },
      { icon: '👁️', label: 'VISIBILITY',  value: `${city.visibility} mi`, sub: city.visibility < 5 ? 'Poor' : city.visibility < 8 ? 'Fair' : 'Good' },
    ];
    tiles.forEach((t) => {
      const tile = el('w-tile');
      tile.innerHTML =
        `<div class="wt-label">${t.icon} ${t.label}</div>` +
        `<div class="wt-value">${t.value}</div>` +
        `<div class="wt-sub">${t.sub}</div>`;
      detailsGrid.append(tile);
    });

    // Update city list if open
    if (cityPanel.classList.contains('open')) renderCityList(citySearchInput.value);
  }

  renderAll();
  return root;
}
