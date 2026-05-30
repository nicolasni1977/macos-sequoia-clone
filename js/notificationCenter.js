// Notification Center: a right-side slide-in panel with a large date, a mini
// month calendar widget, a weather widget, and a notifications list. Opened by
// clicking the menu-bar clock; toggles closed on second click / Esc / outside.
import { on } from './state.js';

const panel = document.getElementById('notification-center');
const clock = document.getElementById('status-clock');
let isOpen = false;

const NOTIFS = [
  { ic: '✉️', app: 'Mail', title: 'The Wavelengths', body: 'Your playlist is ready' },
  { ic: '📅', app: 'Calendar', title: 'Launch 🚀', body: 'Event starts in 1 hour' },
  { ic: '💬', app: 'Messages', title: 'Ada', body: 'See you at the review!' },
  { ic: '⬇️', app: 'Safari', title: 'Download complete', body: 'installer.dmg' },
];

export function initNotificationCenter() {
  clock.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  on('os:toggle-notification-center', toggle);

  document.addEventListener('mousedown', (e) => {
    if (isOpen && !e.target.closest('#notification-center') && !e.target.closest('#status-clock')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });
}

function toggle() { isOpen ? close() : open(); }

function open() {
  build();
  isOpen = true;
  panel.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('show'));
  clock.classList.add('active');
}
function close() {
  isOpen = false;
  panel.classList.remove('show');
  clock.classList.remove('active');
  setTimeout(() => panel.classList.add('hidden'), 280);
}

function build() {
  panel.innerHTML = '';
  const now = new Date();

  // --- Large date widget ---
  const date = widget('nc-date');
  date.innerHTML = `
    <div class="nc-weekday">${now.toLocaleDateString('en-US', { weekday: 'long' })}</div>
    <div class="nc-day">${now.getDate()}</div>`;
  panel.append(date);

  // --- Mini month calendar widget ---
  panel.append(buildCalendar(now));

  // --- Weather widget ---
  const weather = widget('nc-weather');
  weather.innerHTML = `
    <div class="nc-city">Cupertino</div>
    <div class="nc-temp">72°</div>
    <div class="nc-cond">Mostly Sunny ☀️</div>
    <div class="nc-hl">H:78°  L:61°</div>`;
  panel.append(weather);

  // --- Notifications list ---
  NOTIFS.forEach((n) => {
    const w = widget('');
    const item = document.createElement('div');
    item.className = 'nc-notif';
    item.innerHTML = `
      <div class="nc-n-ic">${n.ic}</div>
      <div class="nc-n-meta">
        <div class="nc-n-app">${n.app}</div>
        <div class="nc-n-title">${n.title}</div>
        <div class="nc-n-body">${n.body}</div>
      </div>`;
    item.addEventListener('click', () => { w.remove(); });
    w.append(item);
    panel.append(w);
  });
}

function buildCalendar(now) {
  const w = widget('nc-cal');
  const y = now.getFullYear(), m = now.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let html = `<div class="nc-cal-head">${monthNames[m]} ${y}</div><div class="nc-cal-grid">`;
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => { html += `<div class="nc-cal-dow">${d}</div>`; });
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  for (let i = 0; i < 42; i++) {
    if (i < first) html += `<div class="nc-cal-cell out">${prevDays - first + i + 1}</div>`;
    else if (i >= first + days) html += `<div class="nc-cal-cell out">${i - first - days + 1}</div>`;
    else {
      const num = i - first + 1;
      const today = num === now.getDate();
      html += `<div class="nc-cal-cell${today ? ' today' : ''}">${num}</div>`;
    }
  }
  html += '</div>';
  w.innerHTML = html;
  return w;
}

function widget(cls) {
  const w = document.createElement('div');
  w.className = 'nc-widget' + (cls ? ' ' + cls : '');
  return w;
}
