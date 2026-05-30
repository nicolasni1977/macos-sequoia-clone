// js/apps/stocks.js — macOS Stocks app clone
import { el, setHTML } from '../dom.js';

// ── Mock data ────────────────────────────────────────────────────────────────

const STOCK_DB = {
  AAPL:  { name: 'Apple Inc.',            base: 213.49, color: '#30d158' },
  MSFT:  { name: 'Microsoft Corporation', base: 447.83, color: '#30d158' },
  GOOGL: { name: 'Alphabet Inc.',         base: 191.22, color: '#30d158' },
  AMZN:  { name: 'Amazon.com Inc.',       base: 228.96, color: '#ff453a' },
  NVDA:  { name: 'NVIDIA Corporation',    base: 137.71, color: '#30d158' },
  TSLA:  { name: 'Tesla Inc.',            base: 248.50, color: '#ff453a' },
  META:  { name: 'Meta Platforms Inc.',   base: 609.15, color: '#30d158' },
  BRK:   { name: 'Berkshire Hathaway',    base: 544.20, color: '#ff453a' },
  JPM:   { name: 'JPMorgan Chase',        base: 271.38, color: '#30d158' },
  V:     { name: 'Visa Inc.',             base: 369.54, color: '#30d158' },
  NFLX:  { name: 'Netflix Inc.',          base: 1062.10, color: '#30d158' },
  DIS:   { name: 'The Walt Disney Co.',   base: 109.62, color: '#ff453a' },
  SPOT:  { name: 'Spotify Technology',    base: 638.49, color: '#30d158' },
  AMD:   { name: 'Advanced Micro Devices',base: 172.45, color: '#ff453a' },
  INTC:  { name: 'Intel Corporation',     base: 20.88,  color: '#ff453a' },
};

const DEFAULT_WATCHLIST = ['AAPL','MSFT','GOOGL','NVDA','TSLA','META'];

// ── Deterministic seeded pseudo-random number generator ──────────────────────

function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Generate price series for a given ticker and time range
function genSeries(ticker, range) {
  const info = STOCK_DB[ticker] || { base: 100, color: '#30d158' };
  const configs = {
    '1D':  { pts: 78,  seed: 1, vol: 0.004, trend: 0.0001 },
    '1W':  { pts: 35,  seed: 2, vol: 0.009, trend: 0.0003 },
    '1M':  { pts: 22,  seed: 3, vol: 0.018, trend: 0.0008 },
    '1Y':  { pts: 52,  seed: 4, vol: 0.04,  trend: 0.003  },
    'ALL': { pts: 60,  seed: 5, vol: 0.08,  trend: 0.008  },
  };
  const cfg = configs[range] || configs['1D'];
  const rng = seededRng((ticker.charCodeAt(0) * 17 + ticker.length * 31) ^ cfg.seed);
  const prices = [];
  let p = info.base * (0.88 + rng() * 0.24);
  for (let i = 0; i < cfg.pts; i++) {
    const delta = (rng() - 0.48) * cfg.vol + cfg.trend;
    p = Math.max(p * (1 + delta), 0.01);
    prices.push(+p.toFixed(2));
  }
  // Make last point be info.base (simulated "current")
  prices[prices.length - 1] = info.base;
  return prices;
}

// Compute % change between first and last point in a series
function seriesChange(prices) {
  if (!prices || prices.length < 2) return 0;
  return ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
}

// ── SVG chart helpers ─────────────────────────────────────────────────────────

function buildSparkline(prices, w, h, positive) {
  if (!prices || prices.length < 2) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const xs = prices.map((_, i) => (i / (prices.length - 1)) * w);
  const ys = prices.map(p => h - ((p - min) / range) * h * 0.85 - h * 0.075);
  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const color = positive ? '#30d158' : '#ff453a';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
    <polyline points="${xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')}"
      fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function buildMainChart(prices, w, h, positive) {
  if (!prices || prices.length < 2) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const padT = 20, padB = 28, padL = 8, padR = 8;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const xs = prices.map((_, i) => padL + (i / (prices.length - 1)) * cw);
  const ys = prices.map(p => padT + ch - ((p - min) / range) * ch);
  const lineD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fillD = lineD + ` L${xs[xs.length-1].toFixed(1)},${(padT+ch).toFixed(1)} L${padL.toFixed(1)},${(padT+ch).toFixed(1)} Z`;
  const color = positive ? '#30d158' : '#ff453a';

  // Y-axis labels (3 levels)
  const yLabels = [min, (min + max) / 2, max].map((v, i) => {
    const y = padT + ch - ((v - min) / range) * ch;
    return `<text x="${padL}" y="${(y - 3).toFixed(1)}" font-size="9" fill="rgba(120,120,128,0.8)" text-anchor="start">${v.toFixed(2)}</text>
            <line x1="${padL}" y1="${y.toFixed(1)}" x2="${(w - padR).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(120,120,128,0.15)" stroke-dasharray="3,3"/>`;
  }).join('');

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
    <defs>
      <linearGradient id="sg-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    ${yLabels}
    <path d="${fillD}" fill="url(#sg-fill)"/>
    <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${xs[xs.length-1].toFixed(1)}" cy="${ys[ys.length-1].toFixed(1)}" r="3.5" fill="${color}"/>
  </svg>`;
}

// ── News data ─────────────────────────────────────────────────────────────────

const NEWS_DB = {
  AAPL:  [
    { source: 'Bloomberg', time: '2h ago', title: 'Apple Unveils AI-Powered Siri Overhaul at WWDC 2026' },
    { source: 'Reuters',   time: '4h ago', title: 'iPhone 17 Demand Exceeds Supply Chain Expectations' },
    { source: 'CNBC',      time: '6h ago', title: 'Apple Vision Pro 2 Reportedly in Development for 2027' },
  ],
  MSFT:  [
    { source: 'The Verge', time: '1h ago', title: 'Microsoft Copilot+ PCs See Record Quarterly Sales' },
    { source: 'FT',        time: '3h ago', title: 'Azure Cloud Revenue Surges 31% Year Over Year' },
    { source: 'WSJ',       time: '7h ago', title: 'Microsoft Acquires AI Research Lab for $8.4B' },
  ],
  GOOGL: [
    { source: 'TechCrunch',time: '2h ago', title: 'Google Gemini Ultra 2 Tops Benchmarks Across Categories' },
    { source: 'Reuters',   time: '5h ago', title: 'Alphabet Ad Revenue Returns to Double-Digit Growth' },
    { source: 'Bloomberg', time: '8h ago', title: 'Google DeepMind Publishes Breakthrough in Protein Folding' },
  ],
  NVDA:  [
    { source: 'CNBC',      time: '30m ago',title: 'NVIDIA Blackwell GPU Allocation Sells Out Through Q3' },
    { source: 'Reuters',   time: '3h ago', title: 'Jensen Huang: Robotics to Become $10T Market by 2030' },
    { source: 'WSJ',       time: '5h ago', title: 'NVIDIA Data Center Revenue Hits $35B in Latest Quarter' },
  ],
  TSLA:  [
    { source: 'Reuters',   time: '1h ago', title: 'Tesla Cybertruck Production Ramp Faces Margin Pressure' },
    { source: 'Bloomberg', time: '4h ago', title: 'Full Self-Driving V14 Rolls Out to All North America Fleet' },
    { source: 'FT',        time: '9h ago', title: 'Tesla Opens 500 Megapack Factory in Nevada' },
  ],
  META:  [
    { source: 'The Verge', time: '2h ago', title: 'Meta AI Assistant Reaches 500M Monthly Active Users' },
    { source: 'CNBC',      time: '4h ago', title: 'Ray-Ban Meta Smart Glasses Outsell Q1 Forecast by 40%' },
    { source: 'TechCrunch',time: '7h ago', title: 'Meta Llama 4 Released Under Permissive Open License' },
  ],
  _DEFAULT: [
    { source: 'Bloomberg', time: '1h ago', title: 'Markets Steady as Fed Signals One Rate Cut Remaining in 2026' },
    { source: 'Reuters',   time: '3h ago', title: 'S&P 500 Edges Higher on Strong Earnings Beat Season' },
    { source: 'WSJ',       time: '6h ago', title: 'Tech Sector Leads Broad Market Rally Into Month-End' },
  ],
};

function newsFor(ticker) {
  return NEWS_DB[ticker] || NEWS_DB['_DEFAULT'];
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function statsFor(ticker, prices) {
  const info = STOCK_DB[ticker] || { base: 100 };
  const cur = prices[prices.length - 1];
  const rng = seededRng(ticker.charCodeAt(0) * 13 + 7);
  const open = +(cur * (0.995 + rng() * 0.01)).toFixed(2);
  const high = +(cur * (1.005 + rng() * 0.018)).toFixed(2);
  const low  = +(cur * (0.975 + rng() * 0.015)).toFixed(2);
  const vol  = Math.round(15e6 + rng() * 85e6);
  const mktcap = Math.round(cur * (1e8 + rng() * 9e9));
  const pe   = +(18 + rng() * 42).toFixed(1);
  const eps  = +(cur / pe).toFixed(2);
  const div  = rng() > 0.5 ? (+(rng() * 3.2).toFixed(2)) : 0;
  const week52H = +(cur * (1.12 + rng() * 0.38)).toFixed(2);
  const week52L = +(cur * (0.52 + rng() * 0.32)).toFixed(2);

  function fmtVol(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    return n.toLocaleString();
  }
  function fmtMkt(n) {
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B';
    return '$' + (n / 1e6).toFixed(0) + 'M';
  }

  return [
    { label: 'Open',     value: '$' + open },
    { label: 'High',     value: '$' + high },
    { label: 'Low',      value: '$' + low  },
    { label: 'Volume',   value: fmtVol(vol) },
    { label: 'Mkt Cap',  value: fmtMkt(mktcap) },
    { label: 'P/E Ratio',value: pe },
    { label: 'EPS',      value: '$' + eps },
    { label: '52W High', value: '$' + week52H },
    { label: '52W Low',  value: '$' + week52L },
    { label: 'Dividend', value: div ? div + '%' : '—' },
  ];
}

// ── Ticker search suggestions ─────────────────────────────────────────────────

const ALL_TICKERS = Object.keys(STOCK_DB);

function searchTickers(query) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return ALL_TICKERS.filter(t => {
    const info = STOCK_DB[t];
    return t.startsWith(q) || info.name.toUpperCase().includes(q);
  }).slice(0, 6);
}

// ── Main content factory ──────────────────────────────────────────────────────

export function content(win, api) {
  // ── State ──────────────────────────────────────────────────────────────────
  let watchlist = api.load('watchlist', DEFAULT_WATCHLIST);
  // ensure valid tickers
  watchlist = watchlist.filter(t => STOCK_DB[t]);
  if (!watchlist.length) watchlist = [...DEFAULT_WATCHLIST];

  let selectedTicker = watchlist[0] || 'AAPL';
  let selectedRange  = '1D';
  const RANGES = ['1D', '1W', '1M', '1Y', 'ALL'];

  // ── Root layout ────────────────────────────────────────────────────────────
  const root = el('stocks-root');

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = el('stocks-sidebar');
  root.appendChild(sidebar);

  // Search bar inside sidebar
  const searchWrap = el('stocks-search-wrap');
  const searchInput = document.createElement('input');
  searchInput.className = 'stocks-search-input';
  searchInput.placeholder = '🔍  Search ticker or company';
  searchInput.spellcheck = false;
  searchWrap.appendChild(searchInput);
  sidebar.appendChild(searchWrap);

  const suggestions = el('stocks-suggestions');
  suggestions.style.display = 'none';
  sidebar.appendChild(suggestions);

  const watchlistContainer = el('stocks-watchlist');
  sidebar.appendChild(watchlistContainer);

  // ── Main area ──────────────────────────────────────────────────────────────
  const main = el('stocks-main');
  root.appendChild(main);

  // Header (company name + price)
  const header = el('stocks-header');
  main.appendChild(header);

  // Time-range tabs
  const tabs = el('stocks-tabs');
  main.appendChild(tabs);

  // Chart area
  const chartWrap = el('stocks-chart-wrap');
  main.appendChild(chartWrap);

  // Stats grid
  const statsGrid = el('stocks-stats-grid');
  main.appendChild(statsGrid);

  // News section
  const newsSection = el('stocks-news-section');
  main.appendChild(newsSection);

  // ── Render functions ───────────────────────────────────────────────────────

  function renderWatchlist() {
    watchlistContainer.innerHTML = '';
    watchlist.forEach(ticker => {
      const info   = STOCK_DB[ticker];
      const series = genSeries(ticker, '1D');
      const chg    = seriesChange(series);
      const pos    = chg >= 0;
      const price  = info.base;

      const row = el('stocks-row');
      if (ticker === selectedTicker) row.classList.add('active');

      const leftCol = el('stocks-row-left');
      const tickerEl = el('stocks-row-ticker', 'span');
      tickerEl.textContent = ticker;
      const nameEl = el('stocks-row-name', 'span');
      nameEl.textContent = info.name.split(' ').slice(0, 2).join(' ');
      leftCol.appendChild(tickerEl);
      leftCol.appendChild(nameEl);

      const midCol = el('stocks-row-spark');
      midCol.innerHTML = buildSparkline(series, 60, 28, pos);

      const rightCol = el('stocks-row-right');
      const priceEl = el('stocks-row-price', 'span');
      priceEl.textContent = '$' + price.toFixed(2);
      const chgEl = el('stocks-row-chg stocks-chg-' + (pos ? 'pos' : 'neg'), 'span');
      chgEl.textContent = (pos ? '+' : '') + chg.toFixed(2) + '%';
      rightCol.appendChild(priceEl);
      rightCol.appendChild(chgEl);

      row.appendChild(leftCol);
      row.appendChild(midCol);
      row.appendChild(rightCol);

      // Remove button (appears on hover)
      const removeBtn = el('stocks-row-remove', 'button');
      removeBtn.title = 'Remove from watchlist';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        removeTicker(ticker);
      });
      row.appendChild(removeBtn);

      row.addEventListener('click', () => selectTicker(ticker));
      watchlistContainer.appendChild(row);
    });
  }

  function renderHeader() {
    const info   = STOCK_DB[selectedTicker] || { name: selectedTicker, base: 0 };
    const series = genSeries(selectedTicker, selectedRange);
    const chg    = seriesChange(series);
    const pos    = chg >= 0;
    const price  = info.base;

    header.innerHTML = '';

    const topRow = el('stocks-header-top');
    const companyName = el('stocks-company-name', 'h2');
    companyName.textContent = info.name;
    const tickerBadge = el('stocks-ticker-badge', 'span');
    tickerBadge.textContent = selectedTicker;
    topRow.appendChild(companyName);
    topRow.appendChild(tickerBadge);
    header.appendChild(topRow);

    const priceRow = el('stocks-price-row');
    const priceEl = el('stocks-main-price', 'span');
    priceEl.textContent = '$' + price.toFixed(2);
    const chgWrap = el('stocks-main-chg', 'span');
    const chgAmt  = ((price * chg) / 100);
    chgWrap.innerHTML = `<span class="stocks-chg-${pos ? 'pos' : 'neg'}">${pos ? '+' : ''}${chgAmt.toFixed(2)} (${pos ? '+' : ''}${chg.toFixed(2)}%)</span>
      <span class="stocks-range-label">${selectedRange === '1D' ? 'Today' : selectedRange}</span>`;
    priceRow.appendChild(priceEl);
    priceRow.appendChild(chgWrap);
    header.appendChild(priceRow);
  }

  function renderTabs() {
    tabs.innerHTML = '';
    RANGES.forEach(range => {
      const btn = el('stocks-tab-btn', 'button');
      btn.textContent = range;
      if (range === selectedRange) btn.classList.add('active');
      btn.addEventListener('click', () => {
        selectedRange = range;
        renderAll();
      });
      tabs.appendChild(btn);
    });
  }

  function renderChart() {
    const series = genSeries(selectedTicker, selectedRange);
    const chg    = seriesChange(series);
    const pos    = chg >= 0;
    chartWrap.innerHTML = '';
    // Use offsetWidth/Height or fallback dimensions
    const w = chartWrap.clientWidth  || 560;
    const h = chartWrap.clientHeight || 200;
    chartWrap.innerHTML = buildMainChart(series, w, h, pos);
    // Make SVG fill the container
    const svg = chartWrap.querySelector('svg');
    if (svg) {
      svg.style.width  = '100%';
      svg.style.height = '100%';
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('preserveAspectRatio', 'none');
    }
  }

  function renderStats() {
    const series = genSeries(selectedTicker, '1D');
    const stat   = statsFor(selectedTicker, series);
    statsGrid.innerHTML = '<div class="stocks-stats-title">Key Statistics</div>';
    stat.forEach(s => {
      const cell = setHTML('stocks-stat-cell',
        `<span class="stocks-stat-label">${s.label}</span><span class="stocks-stat-value">${s.value}</span>`);
      statsGrid.appendChild(cell);
    });
  }

  function renderNews() {
    const articles = newsFor(selectedTicker);
    newsSection.innerHTML = '<div class="stocks-news-title">Business News</div>';
    articles.forEach(a => {
      const item = el('stocks-news-item');
      const meta = el('stocks-news-meta', 'div');
      meta.innerHTML = `<span class="stocks-news-source">${a.source}</span><span class="stocks-news-time">${a.time}</span>`;
      const title = el('stocks-news-headline', 'p');
      title.textContent = a.title;
      item.appendChild(meta);
      item.appendChild(title);
      newsSection.appendChild(item);
    });
  }

  function renderAll() {
    renderHeader();
    renderTabs();
    renderChart();
    renderStats();
    renderNews();
    // Re-highlight active row
    watchlistContainer.querySelectorAll('.stocks-row').forEach(r => r.classList.remove('active'));
    watchlistContainer.querySelectorAll('.stocks-row').forEach((r, i) => {
      if (watchlist[i] === selectedTicker) r.classList.add('active');
    });
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  function selectTicker(ticker) {
    selectedTicker = ticker;
    renderWatchlist();
    renderAll();
  }

  function addTicker(ticker) {
    if (!STOCK_DB[ticker]) {
      api.toast(`Unknown ticker: ${ticker}`);
      return;
    }
    if (watchlist.includes(ticker)) {
      api.toast(`${ticker} is already in your watchlist`);
      return;
    }
    watchlist.push(ticker);
    api.store('watchlist', watchlist);
    renderWatchlist();
    selectTicker(ticker);
    api.toast(`Added ${ticker} to watchlist`);
  }

  function removeTicker(ticker) {
    if (watchlist.length <= 1) {
      api.toast('Watchlist must have at least one ticker');
      return;
    }
    watchlist = watchlist.filter(t => t !== ticker);
    api.store('watchlist', watchlist);
    if (selectedTicker === ticker) selectedTicker = watchlist[0];
    renderWatchlist();
    renderAll();
    api.toast(`Removed ${ticker}`);
  }

  // ── Search / suggestions ───────────────────────────────────────────────────

  function renderSuggestions(query) {
    const results = searchTickers(query);
    suggestions.innerHTML = '';
    if (!results.length || !query.trim()) {
      suggestions.style.display = 'none';
      return;
    }
    results.forEach(ticker => {
      const info = STOCK_DB[ticker];
      const item = el('stocks-suggestion-item');
      item.innerHTML = `<span class="stocks-sug-ticker">${ticker}</span><span class="stocks-sug-name">${info.name}</span>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        searchInput.value = '';
        suggestions.style.display = 'none';
        addTicker(ticker);
      });
      suggestions.appendChild(item);
    });
    suggestions.style.display = 'block';
  }

  searchInput.addEventListener('input', () => renderSuggestions(searchInput.value));
  searchInput.addEventListener('blur', () => {
    setTimeout(() => { suggestions.style.display = 'none'; }, 150);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      suggestions.style.display = 'none';
    } else if (e.key === 'Enter') {
      const q = searchInput.value.trim().toUpperCase();
      if (q && STOCK_DB[q]) {
        addTicker(q);
        searchInput.value = '';
        suggestions.style.display = 'none';
      }
    }
  });

  // ── Initial render ─────────────────────────────────────────────────────────

  renderWatchlist();
  renderAll();

  // Re-render chart after layout settles (container has real dimensions)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderChart();
    });
  });

  return root;
}
