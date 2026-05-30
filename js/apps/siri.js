// js/apps/siri.js — Siri app for macOS Sequoia web clone
import { el, setHTML } from '../dom.js';

// ─── Intent engine ────────────────────────────────────────────────────────────

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything.",
  "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "What do you call a fish with no eyes? A fsh.",
  "I asked Siri to tell me a joke. She said 'Your search history.'",
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
  "What's a computer's favorite snack? Microchips.",
  "Why did the developer go broke? Because he used up all his cache.",
];

const WEATHER_DATA = {
  city: 'Cupertino',
  temp: 72,
  unit: '°F',
  condition: 'Sunny',
  glyph: '☀️',
  high: 76,
  low: 58,
  humidity: 42,
  wind: '8 mph SW',
  forecast: [
    { day: 'Mon', glyph: '⛅', hi: 74, lo: 60 },
    { day: 'Tue', glyph: '🌤️', hi: 78, lo: 62 },
    { day: 'Wed', glyph: '🌧️', hi: 65, lo: 55 },
    { day: 'Thu', glyph: '☀️', hi: 80, lo: 63 },
    { day: 'Fri', glyph: '☀️', hi: 82, lo: 65 },
  ],
};

// Returns { type, data } or null
function parseIntent(text) {
  const t = text.trim().toLowerCase();

  // open <app>
  const openMatch = t.match(/^(?:open|launch|start)\s+(.+)$/);
  if (openMatch) {
    return { type: 'open', appName: openMatch[1].trim() };
  }

  // time
  if (/\b(time|clock|what time)\b/.test(t)) {
    return { type: 'time' };
  }

  // date
  if (/\b(date|today|what day|what's today)\b/.test(t)) {
    return { type: 'date' };
  }

  // weather
  if (/\b(weather|temperature|forecast|rain|sunny|outside)\b/.test(t)) {
    return { type: 'weather' };
  }

  // joke
  if (/\b(joke|funny|laugh|humor)\b/.test(t)) {
    return { type: 'joke' };
  }

  // greeting
  if (/^(hi|hello|hey|howdy|sup|what'?s up)\b/.test(t)) {
    return { type: 'greeting' };
  }

  // calculator / math
  const mathMatch = t.match(/^(?:what(?:'s| is)?\s+)?(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)(?:\s*=?\s*)?$/);
  if (mathMatch) {
    return { type: 'math', a: parseFloat(mathMatch[1]), op: mathMatch[2], b: parseFloat(mathMatch[3]) };
  }

  // search
  const searchMatch = t.match(/^(?:search|find|look up|google)\s+(.+)$/);
  if (searchMatch) {
    return { type: 'search', query: searchMatch[1].trim() };
  }

  // settings
  if (/\b(settings|preferences|dark mode|light mode|appearance)\b/.test(t)) {
    return { type: 'settings', raw: t };
  }

  return null;
}

function computeMath(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': case 'x': case '×': return a * b;
    case '/': case '÷': return b !== 0 ? a / b : NaN;
    default: return NaN;
  }
}

// ─── Response card builders ───────────────────────────────────────────────────

function makeTimeCard() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const card = el('siri-card siri-card--time');
  card.innerHTML = `
    <div class="siri-card-icon">🕐</div>
    <div class="siri-card-content">
      <div class="siri-card-value">${timeStr}</div>
      <div class="siri-card-label">${dateStr}</div>
    </div>
  `;
  return card;
}

function makeDateCard() {
  const now = new Date();
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dayNum = now.getDate();
  const monthStr = now.toLocaleDateString([], { month: 'long' });
  const card = el('siri-card siri-card--date');
  card.innerHTML = `
    <div class="siri-card-icon">📅</div>
    <div class="siri-card-content">
      <div class="siri-card-value">${monthStr} ${dayNum}</div>
      <div class="siri-card-label">${dateStr}</div>
    </div>
  `;
  return card;
}

function makeWeatherCard() {
  const w = WEATHER_DATA;
  const forecastHTML = w.forecast.map(d =>
    `<div class="siri-forecast-day">
      <span class="siri-forecast-label">${d.day}</span>
      <span class="siri-forecast-glyph">${d.glyph}</span>
      <span class="siri-forecast-temp">${d.hi}°</span>
      <span class="siri-forecast-lo">${d.lo}°</span>
    </div>`
  ).join('');
  const card = el('siri-card siri-card--weather');
  card.innerHTML = `
    <div class="siri-weather-main">
      <div class="siri-weather-left">
        <div class="siri-weather-glyph">${w.glyph}</div>
        <div class="siri-weather-info">
          <div class="siri-weather-city">${w.city}</div>
          <div class="siri-weather-temp">${w.temp}${w.unit}</div>
          <div class="siri-weather-cond">${w.condition}</div>
        </div>
      </div>
      <div class="siri-weather-details">
        <div class="siri-weather-detail"><span>H</span><strong>${w.high}°</strong></div>
        <div class="siri-weather-detail"><span>L</span><strong>${w.low}°</strong></div>
        <div class="siri-weather-detail"><span>💧</span><strong>${w.humidity}%</strong></div>
        <div class="siri-weather-detail"><span>💨</span><strong>${w.wind}</strong></div>
      </div>
    </div>
    <div class="siri-forecast">${forecastHTML}</div>
  `;
  return card;
}

function makeJokeCard() {
  const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
  const card = el('siri-card siri-card--joke');
  card.innerHTML = `
    <div class="siri-card-icon">😄</div>
    <div class="siri-card-content">
      <div class="siri-card-text">${joke}</div>
    </div>
  `;
  return card;
}

function makeGreetingCard() {
  const greetings = [
    'Hi there! How can I help you?',
    'Hello! What can I do for you?',
    'Hey! I\'m listening.',
    'Hi! What would you like to know?',
  ];
  const msg = greetings[Math.floor(Math.random() * greetings.length)];
  const card = el('siri-card siri-card--text');
  card.innerHTML = `
    <div class="siri-card-icon">👋</div>
    <div class="siri-card-content">
      <div class="siri-card-text">${msg}</div>
    </div>
  `;
  return card;
}

function makeMathCard(a, op, b) {
  const result = computeMath(a, op, b);
  const displayOp = { '*': '×', 'x': '×', '/': '÷' }[op] || op;
  const resultStr = isNaN(result) ? 'Cannot divide by zero' : (Math.round(result * 1e10) / 1e10).toString();
  const card = el('siri-card siri-card--math');
  card.innerHTML = `
    <div class="siri-card-icon">🔢</div>
    <div class="siri-card-content">
      <div class="siri-card-label">${a} ${displayOp} ${b}</div>
      <div class="siri-card-value">${resultStr}</div>
    </div>
  `;
  return card;
}

function makeOpenCard(appName) {
  const card = el('siri-card siri-card--open');
  card.innerHTML = `
    <div class="siri-card-icon">🚀</div>
    <div class="siri-card-content">
      <div class="siri-card-text">Opening <strong>${appName}</strong>…</div>
    </div>
  `;
  return card;
}

function makeSearchCard(query) {
  const card = el('siri-card siri-card--text');
  card.innerHTML = `
    <div class="siri-card-icon">🔍</div>
    <div class="siri-card-content">
      <div class="siri-card-label">Searching for</div>
      <div class="siri-card-value">"${query}"</div>
      <div class="siri-card-text" style="margin-top:6px;font-size:12px">Opening Safari…</div>
    </div>
  `;
  return card;
}

function makeSettingsCard(raw) {
  let action = 'Opening System Settings…';
  if (/dark mode/.test(raw)) action = 'Switching to dark mode…';
  else if (/light mode/.test(raw)) action = 'Switching to light mode…';
  const card = el('siri-card siri-card--text');
  card.innerHTML = `
    <div class="siri-card-icon">⚙️</div>
    <div class="siri-card-content">
      <div class="siri-card-text">${action}</div>
    </div>
  `;
  return card;
}

function makeUnknownCard(text) {
  const card = el('siri-card siri-card--text');
  card.innerHTML = `
    <div class="siri-card-icon">🤔</div>
    <div class="siri-card-content">
      <div class="siri-card-label">I'm not sure about that</div>
      <div class="siri-card-text">I couldn't find a result for "<em>${text}</em>". Try asking about the time, weather, a joke, or to open an app.</div>
    </div>
  `;
  return card;
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'What time is it?', icon: '🕐' },
  { label: "What's the weather?", icon: '🌤️' },
  { label: 'Tell me a joke', icon: '😄' },
  { label: 'Open Calculator', icon: '🧮' },
  { label: 'Open Notes', icon: '📝' },
  { label: 'Open Safari', icon: '🧭' },
  { label: "What's today's date?", icon: '📅' },
  { label: '12 × 8', icon: '🔢' },
];

// ─── Orb animation ────────────────────────────────────────────────────────────

function createOrb(listening) {
  const orb = el('siri-orb');
  const inner = el('siri-orb-inner');
  const ring1 = el('siri-orb-ring siri-orb-ring--1');
  const ring2 = el('siri-orb-ring siri-orb-ring--2');
  const ring3 = el('siri-orb-ring siri-orb-ring--3');
  const core = el('siri-orb-core');
  const glyph = el('siri-orb-glyph');
  glyph.textContent = '🌀';
  core.append(glyph);
  inner.append(ring3, ring2, ring1, core);
  orb.append(inner);

  if (listening) orb.classList.add('is-listening');
  return { orb, setListening: (v) => orb.classList.toggle('is-listening', v) };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function content(win, api) {
  const root = el('siri-root');

  // ── Header / orb section ──
  const header = el('siri-header');
  const { orb, setListening } = createOrb(false);
  const statusText = el('siri-status');
  statusText.textContent = 'How can I help?';
  header.append(orb, statusText);

  // ── Input bar ──
  const inputBar = el('siri-input-bar');
  const inputField = el('siri-input', 'input');
  inputField.type = 'text';
  inputField.placeholder = 'Type to Siri…';
  inputField.autocomplete = 'off';
  inputField.spellcheck = false;

  const micBtn = el('siri-mic-btn', 'button');
  micBtn.title = 'Listen';
  micBtn.innerHTML = `<span class="siri-mic-icon">🎤</span>`;

  const sendBtn = el('siri-send-btn', 'button');
  sendBtn.title = 'Send';
  sendBtn.innerHTML = `<span>↑</span>`;

  inputBar.append(micBtn, inputField, sendBtn);

  // ── Suggestions ──
  const suggestionsWrap = el('siri-suggestions-wrap');
  const suggestionsLabel = el('siri-suggestions-label');
  suggestionsLabel.textContent = 'Suggestions';
  const suggestionsRow = el('siri-suggestions-row');

  SUGGESTIONS.forEach((s) => {
    const chip = el('siri-suggestion-chip', 'button');
    chip.innerHTML = `<span class="siri-chip-icon">${s.icon}</span><span class="siri-chip-label">${s.label}</span>`;
    chip.addEventListener('click', () => {
      inputField.value = s.label;
      submit();
    });
    suggestionsRow.append(chip);
  });

  suggestionsWrap.append(suggestionsLabel, suggestionsRow);

  // ── History (persisted) ──
  let history = api.load('history', []);
  const historyEl = el('siri-history');

  function addHistoryEntry(query, cardEl) {
    // Record to history array (capped at 20 entries)
    history.unshift({ query, ts: Date.now() });
    if (history.length > 20) history = history.slice(0, 20);
    api.store('history', history);

    // Build chat-style bubble
    const entry = el('siri-history-entry');
    const queryBubble = el('siri-bubble siri-bubble--user');
    queryBubble.textContent = query;
    entry.append(queryBubble);
    if (cardEl) {
      const replyWrap = el('siri-bubble-wrap');
      replyWrap.append(cardEl);
      entry.append(replyWrap);
    }
    // Newest at bottom
    historyEl.append(entry);
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  // ── Listening mock animation ──
  let listenTimer = null;
  function startListening() {
    setListening(true);
    statusText.textContent = 'Listening…';
    micBtn.classList.add('is-active');
    if (listenTimer) clearTimeout(listenTimer);
    listenTimer = setTimeout(() => {
      stopListening();
    }, 3000);
  }
  function stopListening() {
    setListening(false);
    statusText.textContent = 'How can I help?';
    micBtn.classList.remove('is-active');
    if (listenTimer) { clearTimeout(listenTimer); listenTimer = null; }
  }

  micBtn.addEventListener('click', () => {
    if (micBtn.classList.contains('is-active')) {
      stopListening();
    } else {
      startListening();
      api.toast('Siri is listening… (type your query below)', { duration: 2500 });
    }
  });

  // ── Submit handler ──
  // App-name lookup — we match against a known list so we can call openApp()
  const APP_ALIASES = {
    finder: 'finder', safari: 'safari', notes: 'notes', calculator: 'calculator',
    terminal: 'terminal', settings: 'settings', 'system settings': 'settings',
    calendar: 'calendar', photos: 'photos', music: 'music', weather: 'weather',
    maps: 'maps', reminders: 'reminders', mail: 'mail', messages: 'messages',
    contacts: 'contacts', clock: 'clock', books: 'books', 'app store': 'appstore',
    appstore: 'appstore', textedit: 'textedit', activity: 'activity',
    'activity monitor': 'activity', numbers: 'numbers', chess: 'chess',
    sysinfo: 'sysinfo', 'system information': 'sysinfo', facetime: 'facetime',
    tv: 'tv', podcasts: 'podcasts', home: 'home', preview: 'preview',
    dictionary: 'dictionary', shortcuts: 'shortcuts', 'mission control': 'missioncontrol',
    launchpad: 'launchpad', freeform: 'freeform', photobooth: 'photobooth',
    keynote: 'keynote', garageband: 'garageband', imovie: 'imovie',
    quicktime: 'quicktime', 'font book': 'fontbook', fontbook: 'fontbook',
    grapher: 'grapher', screenshot: 'screenshot', console: 'console',
    'disk utility': 'diskutil', diskutil: 'diskutil',
  };

  function resolveAppId(name) {
    const n = name.toLowerCase().trim();
    if (APP_ALIASES[n]) return APP_ALIASES[n];
    // partial match
    for (const [k, v] of Object.entries(APP_ALIASES)) {
      if (k.includes(n) || n.includes(k)) return v;
    }
    return null;
  }

  function submit() {
    const raw = inputField.value.trim();
    if (!raw) return;
    inputField.value = '';
    stopListening();

    // Show brief "thinking" state
    setListening(true);
    statusText.textContent = 'Thinking…';

    setTimeout(() => {
      setListening(false);
      statusText.textContent = 'How can I help?';

      const intent = parseIntent(raw);
      let card = null;

      if (!intent) {
        card = makeUnknownCard(raw);
        addHistoryEntry(raw, card);
        return;
      }

      switch (intent.type) {
        case 'time':
          card = makeTimeCard();
          break;
        case 'date':
          card = makeDateCard();
          break;
        case 'weather':
          card = makeWeatherCard();
          break;
        case 'joke':
          card = makeJokeCard();
          break;
        case 'greeting':
          card = makeGreetingCard();
          break;
        case 'math':
          card = makeMathCard(intent.a, intent.op, intent.b);
          break;
        case 'open': {
          const appId = resolveAppId(intent.appName);
          if (appId) {
            card = makeOpenCard(intent.appName);
            setTimeout(() => api.openApp(appId), 400);
          } else {
            card = makeUnknownCard(`open ${intent.appName}`);
          }
          break;
        }
        case 'search':
          card = makeSearchCard(intent.query);
          setTimeout(() => api.openApp('safari'), 600);
          break;
        case 'settings': {
          const raw2 = intent.raw;
          card = makeSettingsCard(raw2);
          if (/dark mode/.test(raw2)) {
            setTimeout(() => api.setAppearance('dark'), 400);
          } else if (/light mode/.test(raw2)) {
            setTimeout(() => api.setAppearance('light'), 400);
          } else {
            setTimeout(() => api.openApp('settings'), 400);
          }
          break;
        }
        default:
          card = makeUnknownCard(raw);
      }

      addHistoryEntry(raw, card);
    }, 600);
  }

  sendBtn.addEventListener('click', submit);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  });

  // ── Assemble ──
  root.append(header, historyEl, suggestionsWrap, inputBar);

  return root;
}
