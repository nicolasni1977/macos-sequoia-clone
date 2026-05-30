// js/apps/podcasts.js — Podcasts: show grid, episode lists, animated mini-player.
import { el, setHTML } from '../dom.js';

const SHOWS = [
  { id: 'render', name: 'The Daily Render', author: 'Pixel Media', glyph: '🎨', grad: 'linear-gradient(135deg,#ff5f6d,#ffc371)', cat: 'Technology' },
  { id: 'async', name: 'Async & Await', author: 'DevCast Network', glyph: '💻', grad: 'linear-gradient(135deg,#667eea,#764ba2)', cat: 'Technology' },
  { id: 'curve', name: 'The Curve', author: 'Motion Lab', glyph: '📈', grad: 'linear-gradient(135deg,#11998e,#38ef7d)', cat: 'Design' },
  { id: 'soundcheck', name: 'Sound Check', author: 'Wavelength FM', glyph: '🎧', grad: 'linear-gradient(135deg,#fa709a,#fee140)', cat: 'Music' },
  { id: 'cosmos', name: 'Cosmos Today', author: 'Star Atlas', glyph: '🪐', grad: 'linear-gradient(135deg,#0f2027,#2c5364)', cat: 'Science' },
  { id: 'history', name: 'Long Story', author: 'Archive Co.', glyph: '📜', grad: 'linear-gradient(135deg,#c79081,#dfa579)', cat: 'History' },
  { id: 'mind', name: 'Mindful Minutes', author: 'Calm Collective', glyph: '🧘', grad: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', cat: 'Health' },
  { id: 'startup', name: 'Zero to One', author: 'Founders Room', glyph: '🚀', grad: 'linear-gradient(135deg,#f7971e,#ffd200)', cat: 'Business' },
  { id: 'kitchen', name: 'Test Kitchen', author: 'Simmer Studio', glyph: '🍳', grad: 'linear-gradient(135deg,#f093fb,#f5576c)', cat: 'Food' },
];

// Generate plausible episodes per show
function episodesFor(show) {
  const titles = {
    render: ['CSS that feels physical', 'The art of the blur', 'Designing the Dock', 'Color in dark mode'],
    async: ['Promises, promises', 'Event loops explained', 'Web Workers in practice', 'Streaming the DOM'],
    curve: ['Easing curves 101', 'Spring vs. tween', 'Magnification math', '60fps or bust'],
    soundcheck: ['The synthwave revival', 'Mastering at home', 'Field recording tips', 'Analog warmth'],
    cosmos: ['A calm day in orbit', 'Mapping the void', 'Light from the past', 'The pale blue dot'],
    history: ['The first interface', 'Punchcards to pixels', 'A short history of windows', 'Icons through time'],
    mind: ['Box breathing', 'A two-minute reset', 'Focus without force', 'Evening wind-down'],
    startup: ['Finding the wedge', 'Your first ten users', 'Pricing is a feature', 'When to say no'],
    kitchen: ['The perfect sourdough', 'Knife skills', 'Five-ingredient dinners', 'Coffee, dialed in'],
  };
  const list = titles[show.id] || ['Episode One', 'Episode Two', 'Episode Three', 'Episode Four'];
  return list.map((t, i) => ({
    id: `${show.id}-${i}`,
    title: t,
    show,
    date: `${['May', 'Apr', 'Mar', 'Feb'][i % 4]} ${28 - i * 6}`,
    minutes: 18 + ((i * 13) % 42),
    desc: 'A wide-ranging conversation with original placeholder show notes for this clone.',
  }));
}

export function content(win, api) {
  const root = el('pod-root');

  let playing = null;     // current episode
  let isPlaying = false;
  let progress = 0;       // 0..1
  let timer = null;

  /* ---- Sidebar ---- */
  const sidebar = el('pod-sidebar');
  const nav = [
    ['listen', '▶️', 'Listen Now'], ['browse', '🧭', 'Browse'],
    ['top', '📈', 'Top Charts'], ['library', '📚', 'Library'],
  ];
  let activeNav = 'browse';
  const sbHead = setHTML('pod-sb-head', '🎙️ Podcasts');
  sidebar.append(sbHead);
  nav.forEach(([id, ic, label]) => {
    const r = el('pod-nav' + (id === activeNav ? ' active' : ''));
    r.innerHTML = `<span>${ic}</span>${label}`;
    r.addEventListener('click', () => { activeNav = id; sidebar.querySelectorAll('.pod-nav').forEach((n) => n.classList.toggle('active', n === r)); renderMain(); });
    sidebar.append(r);
  });

  /* ---- Main + player ---- */
  const main = el('pod-main');
  const player = el('pod-player');
  const center = el('pod-center');
  center.append(main);
  root.append(sidebar, center, player);

  /* ---- Views ---- */
  function renderMain() {
    main.scrollTop = 0;
    if (activeNav === 'library') return renderLibrary();
    if (activeNav === 'listen') return renderListen();
    renderGrid(activeNav === 'top' ? 'Top Charts' : 'Browse');
  }

  function renderGrid(title) {
    main.innerHTML = `<h1 class="pod-h1">${title}</h1>`;
    const grid = el('pod-grid');
    SHOWS.forEach((s) => {
      const card = el('pod-card');
      card.innerHTML = `<div class="pod-cover" style="background:${s.grad}">${s.glyph}</div>
        <div class="pod-card-name">${s.name}</div><div class="pod-card-author">${s.author}</div>`;
      card.addEventListener('click', () => openShow(s));
      grid.append(card);
    });
    main.append(grid);
  }

  function renderListen() {
    main.innerHTML = `<h1 class="pod-h1">Listen Now</h1>`;
    const up = SHOWS[0];
    const ep = episodesFor(up)[0];
    const hero = el('pod-hero');
    hero.innerHTML = `<div class="pod-hero-cover" style="background:${up.grad}">${up.glyph}</div>
      <div class="pod-hero-meta"><div class="pod-hero-kicker">UP NEXT</div>
        <div class="pod-hero-title">${ep.title}</div>
        <div class="pod-hero-show">${up.name} · ${ep.minutes} min</div>
        <button class="pod-hero-play">▶ Play</button></div>`;
    hero.querySelector('.pod-hero-play').addEventListener('click', () => play(ep));
    main.append(hero);
    const recents = el('pod-grid');
    main.append(setHTML('pod-h2', 'Recently Updated'));
    SHOWS.slice(1, 6).forEach((s) => {
      const card = el('pod-card');
      card.innerHTML = `<div class="pod-cover" style="background:${s.grad}">${s.glyph}</div><div class="pod-card-name">${s.name}</div><div class="pod-card-author">${s.author}</div>`;
      card.addEventListener('click', () => openShow(s));
      recents.append(card);
    });
    main.append(recents);
  }

  function renderLibrary() {
    main.innerHTML = `<h1 class="pod-h1">Library</h1>`;
    const list = el('pod-eplist');
    SHOWS.forEach((s) => {
      const row = el('pod-show-row');
      row.innerHTML = `<div class="pod-cover sm" style="background:${s.grad}">${s.glyph}</div>
        <div><div class="pod-card-name">${s.name}</div><div class="pod-card-author">${s.cat} · ${s.author}</div></div>`;
      row.addEventListener('click', () => openShow(s));
      list.append(row);
    });
    main.append(list);
  }

  function openShow(show) {
    main.scrollTop = 0;
    main.innerHTML = '';
    const head = el('pod-show-head');
    head.innerHTML = `<div class="pod-cover lg" style="background:${show.grad}">${show.glyph}</div>
      <div class="pod-show-info"><div class="pod-show-name">${show.name}</div>
      <div class="pod-show-author">${show.author}</div>
      <div class="pod-show-cat">${show.cat}</div>
      <button class="pod-follow">＋ Follow</button></div>`;
    head.querySelector('.pod-follow').addEventListener('click', (e) => {
      const b = e.target; const on = b.classList.toggle('following');
      b.textContent = on ? '✓ Following' : '＋ Follow';
      api.toast(on ? `Following ${show.name}` : `Unfollowed ${show.name}`);
    });
    main.append(head, setHTML('pod-h2', 'Episodes'));
    const list = el('pod-eplist');
    episodesFor(show).forEach((ep) => {
      const row = el('pod-ep');
      row.innerHTML = `<button class="pod-ep-play">▶</button>
        <div class="pod-ep-meta"><div class="pod-ep-title">${ep.title}</div>
        <div class="pod-ep-desc">${ep.desc}</div>
        <div class="pod-ep-sub">${ep.date} · ${ep.minutes} min</div></div>`;
      row.querySelector('.pod-ep-play').addEventListener('click', () => play(ep));
      list.append(row);
    });
    main.append(list);
  }

  /* ---- Player ---- */
  function renderPlayer() {
    if (!playing) {
      player.classList.add('empty');
      player.innerHTML = '<div class="pod-player-empty">Select an episode to play</div>';
      return;
    }
    player.classList.remove('empty');
    const total = playing.minutes * 60;
    const cur = Math.round(progress * total);
    player.innerHTML = `
      <div class="pod-pl-cover" style="background:${playing.show.grad}">${playing.show.glyph}</div>
      <div class="pod-pl-meta">
        <div class="pod-pl-title">${playing.title}</div>
        <div class="pod-pl-show">${playing.show.name}</div>
        <div class="pod-pl-bar"><div class="pod-pl-fill" style="width:${progress * 100}%"></div></div>
        <div class="pod-pl-times"><span>${fmt(cur)}</span><span>-${fmt(total - cur)}</span></div>
      </div>
      <div class="pod-pl-controls">
        <button class="pod-pl-btn" data-a="back">⏮</button>
        <button class="pod-pl-btn pod-pl-play" data-a="toggle">${isPlaying ? '⏸' : '▶'}</button>
        <button class="pod-pl-btn" data-a="fwd">⏭</button>
      </div>`;
    player.querySelector('[data-a="toggle"]').addEventListener('click', toggle);
    player.querySelector('[data-a="back"]').addEventListener('click', () => { progress = Math.max(0, progress - 0.1); renderPlayer(); });
    player.querySelector('[data-a="fwd"]').addEventListener('click', () => { progress = Math.min(1, progress + 0.1); renderPlayer(); });
    const bar = player.querySelector('.pod-pl-bar');
    bar.addEventListener('click', (e) => {
      const r = bar.getBoundingClientRect();
      progress = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      renderPlayer();
    });
  }

  function play(ep) {
    playing = ep; progress = 0; isPlaying = true;
    startTimer();
    renderPlayer();
    api.toast(`Playing “${ep.title}”`);
  }
  function toggle() { isPlaying = !isPlaying; isPlaying ? startTimer() : stopTimer(); renderPlayer(); }
  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      if (!root.isConnected) { stopTimer(); return; }
      progress += 1 / (playing.minutes * 60) * 8; // 8x speed so it visibly moves
      if (progress >= 1) { progress = 1; isPlaying = false; stopTimer(); }
      renderPlayer();
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function fmt(s) { const m = Math.floor(s / 60), ss = String(s % 60).padStart(2, '0'); return `${m}:${ss}`; }

  renderMain();
  renderPlayer();
  return root;
}
