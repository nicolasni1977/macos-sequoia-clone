// js/apps/facetime.js — FaceTime app module for the macOS Sequoia web clone.
// Follows the APP_CONTRACT: content(win, api) returns ONE HTMLElement.
import { el, setHTML } from '../dom.js';

/* ---------------------------------------------------------------
   Helpers
--------------------------------------------------------------- */
function mkBtn(cls, label, title) {
  const b = el(cls, 'button');
  b.textContent = label;
  if (title) b.title = title;
  return b;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Gradient palettes for contact avatars and remote video tiles
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)',
  'linear-gradient(135deg,#84fab0,#8fd3f4)',
  'linear-gradient(135deg,#f6d365,#fda085)',
  'linear-gradient(135deg,#96fbc4,#f9f586)',
];

function gradientFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
}

/* ---------------------------------------------------------------
   Default recent calls seed data
--------------------------------------------------------------- */
const SEED_RECENTS = [
  { name: 'Mia Chen',        type: 'video', dir: 'incoming', ts: Date.now() - 1000 * 60 * 8 },
  { name: 'James Porter',    type: 'audio', dir: 'outgoing', ts: Date.now() - 1000 * 60 * 45 },
  { name: 'Sofia Reyes',     type: 'video', dir: 'missed',   ts: Date.now() - 1000 * 3600 * 2 },
  { name: 'Liam Nakamura',   type: 'video', dir: 'outgoing', ts: Date.now() - 1000 * 3600 * 5 },
  { name: 'Emma Taylor',     type: 'audio', dir: 'incoming', ts: Date.now() - 1000 * 3600 * 22 },
  { name: 'Noah Williams',   type: 'video', dir: 'missed',   ts: Date.now() - 1000 * 86400 * 2 },
  { name: 'Ava Johnson',     type: 'audio', dir: 'outgoing', ts: Date.now() - 1000 * 86400 * 3 },
];

const SUGGESTED_CONTACTS = [
  'Mia Chen', 'James Porter', 'Sofia Reyes', 'Liam Nakamura',
  'Emma Taylor', 'Noah Williams', 'Ava Johnson', 'Lucas Martinez',
  'Isabella Davis', 'Oliver Wilson',
];

/* ---------------------------------------------------------------
   Main export
--------------------------------------------------------------- */
export function content(win, api) {
  /* ---------- State ---------- */
  let recents = api.load('recents', SEED_RECENTS);
  let callState = null; // null | { name, type, muted, videoOff, elapsed, timerId }
  let searchQuery = '';
  let selectedContact = null;

  /* ---------- Root ---------- */
  const root = el('ft-root');

  /* =========================================================
     SIDEBAR
  ========================================================= */
  const sidebar = el('ft-sidebar');

  // Sidebar header
  const sideHead = el('ft-side-head');
  const sideTitle = setHTML('ft-side-title', 'FaceTime');
  const newBtn = mkBtn('ft-new-btn', '+ New FaceTime', 'Start a new FaceTime call');
  sideHead.append(sideTitle, newBtn);

  // Search box
  const searchWrap = el('ft-search-wrap');
  const searchInput = el('ft-search-input', 'input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔍  Search';
  searchInput.spellcheck = false;
  searchWrap.append(searchInput);

  // Recents list
  const recentsList = el('ft-recents-list');

  sidebar.append(sideHead, searchWrap, recentsList);

  /* =========================================================
     MAIN PANEL
  ========================================================= */
  const main = el('ft-main');

  /* --- Idle screen (shown when no call) --- */
  const idleScreen = el('ft-idle');

  // Self-preview tile
  const selfTile = el('ft-self-tile');
  const selfGradient = el('ft-self-gradient');
  selfGradient.style.background = 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)';
  const selfLabel = setHTML('ft-self-label', '📷  Camera Off');
  selfTile.append(selfGradient, selfLabel);

  // Contact picker section
  const pickerSection = el('ft-picker-section');
  const pickerLabel = setHTML('ft-picker-label', 'Start a FaceTime call');

  const contactInputWrap = el('ft-contact-wrap');
  const contactInput = el('ft-contact-input', 'input');
  contactInput.type = 'text';
  contactInput.placeholder = 'Enter name, email, or phone…';
  contactInput.spellcheck = false;
  const contactDropdown = el('ft-contact-dropdown');
  contactInputWrap.append(contactInput, contactDropdown);

  // Suggestions chips
  const suggestWrap = el('ft-suggest-wrap');
  const suggestLabel = setHTML('ft-suggest-label', 'Recents');

  // Call action buttons
  const callBtns = el('ft-call-btns');
  const videoBtnIdle = mkBtn('ft-call-btn ft-video-btn', '📹  Video');
  const audioBtnIdle = mkBtn('ft-call-btn ft-audio-btn', '📞  Audio');
  callBtns.append(videoBtnIdle, audioBtnIdle);

  // SharePlay hint
  const shareplayHint = setHTML('ft-shareplay-hint', '🎵  SharePlay — Watch, listen, and play together');

  pickerSection.append(pickerLabel, contactInputWrap, suggestWrap, suggestLabel, callBtns, shareplayHint);

  idleScreen.append(selfTile, pickerSection);

  /* --- Call screen (shown during a call) --- */
  const callScreen = el('ft-call-screen');
  callScreen.classList.add('hidden');

  // Remote tile (large)
  const remoteTile = el('ft-remote-tile');
  const remoteGrad = el('ft-remote-grad');
  const remoteAvatar = el('ft-remote-avatar');
  const remoteName = el('ft-remote-name');
  remoteTile.append(remoteGrad, remoteAvatar, remoteName);

  // Self PiP
  const pip = el('ft-pip');
  const pipGrad = el('ft-pip-grad');
  pipGrad.style.background = 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)';
  const pipLabel = setHTML('ft-pip-label', '📷');
  pip.append(pipGrad, pipLabel);

  // Call info bar (timer + name)
  const callInfo = el('ft-call-info');
  const callNameEl = el('ft-call-name-el');
  const callTimer = el('ft-call-timer');
  callInfo.append(callNameEl, callTimer);

  // Controls
  const callControls = el('ft-call-controls');
  const muteBtn    = mkBtn('ft-ctrl-btn ft-mute-btn',    '🎤',  'Mute');
  const videoBtn   = mkBtn('ft-ctrl-btn ft-video-toggle','📹',  'Video');
  const shareBtn   = mkBtn('ft-ctrl-btn ft-share-btn',   '🎵',  'SharePlay');
  const endBtn     = mkBtn('ft-ctrl-btn ft-end-btn',     '📵',  'End Call');
  callControls.append(muteBtn, videoBtn, shareBtn, endBtn);

  callScreen.append(remoteTile, pip, callInfo, callControls);

  main.append(idleScreen, callScreen);
  root.append(sidebar, main);

  /* =========================================================
     RENDER FUNCTIONS
  ========================================================= */

  function renderRecents() {
    recentsList.innerHTML = '';
    const query = searchQuery.toLowerCase().trim();
    const items = query
      ? recents.filter(r => r.name.toLowerCase().includes(query))
      : recents;

    if (items.length === 0) {
      const empty = setHTML('ft-recents-empty', query ? 'No results' : 'No recent calls');
      recentsList.append(empty);
      return;
    }

    items.forEach((item) => {
      const row = el('ft-recent-row');
      row.setAttribute('data-name', item.name);

      const avatar = el('ft-recent-avatar');
      avatar.style.background = gradientFor(item.name);
      avatar.textContent = initials(item.name);

      const info = el('ft-recent-info');
      const nameEl = setHTML('ft-recent-name', item.name);
      const meta = el('ft-recent-meta');
      const dirIcon = item.dir === 'incoming' ? '⬇' : item.dir === 'outgoing' ? '⬆' : '↩';
      const dirColor = item.dir === 'missed' ? 'var(--ft-missed)' : 'inherit';
      meta.innerHTML = `<span style="color:${dirColor}">${dirIcon}</span> ${item.type === 'video' ? '📹' : '📞'} · ${timeAgo(item.ts)}`;
      info.append(nameEl, meta);

      const callBtn = mkBtn('ft-recent-call-btn', item.type === 'video' ? '📹' : '📞', `${item.type} call`);
      callBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startCall(item.name, item.type);
      });

      row.append(avatar, info, callBtn);
      row.addEventListener('click', () => selectContact(item.name));
      recentsList.append(row);
    });
  }

  function renderSuggestions() {
    suggestWrap.innerHTML = '';
    const query = (contactInput.value || '').toLowerCase().trim();
    const pool = query
      ? SUGGESTED_CONTACTS.filter(n => n.toLowerCase().includes(query))
      : SUGGESTED_CONTACTS.slice(0, 6);

    pool.forEach(name => {
      const chip = el('ft-chip');
      const av = el('ft-chip-av');
      av.style.background = gradientFor(name);
      av.textContent = initials(name);
      const nm = el('ft-chip-name');
      nm.textContent = name.split(' ')[0];
      chip.append(av, nm);
      chip.addEventListener('click', () => selectContact(name));
      suggestWrap.append(chip);
    });
  }

  function selectContact(name) {
    selectedContact = name;
    contactInput.value = name;
    contactDropdown.innerHTML = '';
    contactDropdown.classList.remove('visible');

    // Highlight in recents list
    recentsList.querySelectorAll('.ft-recent-row').forEach(r => {
      r.classList.toggle('active', r.getAttribute('data-name') === name);
    });

    // Update self-preview to show selected person's name
    selfLabel.textContent = `📷  Ready to call ${name.split(' ')[0]}`;
    renderSuggestions();
  }

  /* =========================================================
     CALL LOGIC
  ========================================================= */

  function startCall(name, type) {
    selectedContact = name;
    callState = { name, type, muted: false, videoOff: false, elapsed: 0, timerId: null };

    // Update remote tile
    remoteGrad.style.background = gradientFor(name);
    remoteAvatar.textContent = initials(name);
    remoteAvatar.style.background = 'rgba(255,255,255,0.15)';
    remoteName.textContent = '';  // hide while "connecting"

    callNameEl.textContent = name;
    callTimer.textContent = 'Connecting…';

    // Transition to call screen
    idleScreen.classList.add('hidden');
    callScreen.classList.remove('hidden');

    api.setTitle(`FaceTime — ${name}`);

    // Simulate connection delay then start timer
    const connectTimeout = setTimeout(() => {
      if (!callState) return;
      remoteName.textContent = name;
      callTimer.textContent = '00:00';
      callState.timerId = setInterval(() => {
        if (!callState) return;
        callState.elapsed++;
        callTimer.textContent = formatDuration(callState.elapsed);
      }, 1000);
    }, 1800);

    // Store so we can cancel on end
    callState._connectTimeout = connectTimeout;

    // Add to recents
    recents.unshift({ name, type, dir: 'outgoing', ts: Date.now() });
    if (recents.length > 20) recents = recents.slice(0, 20);
    api.store('recents', recents);
    renderRecents();

    api.toast(`📹  Calling ${name}…`);
  }

  function endCall() {
    if (!callState) return;
    clearTimeout(callState._connectTimeout);
    clearInterval(callState.timerId);
    const duration = callState.elapsed;
    const name = callState.name;
    callState = null;

    callScreen.classList.add('hidden');
    idleScreen.classList.remove('hidden');

    // Reset controls
    muteBtn.classList.remove('active');
    videoBtn.classList.remove('active');
    selfLabel.textContent = '📷  Camera Off';

    api.setTitle('FaceTime');
    api.toast(`📵  Call ended${duration > 0 ? ' · ' + formatDuration(duration) : ''}`);
  }

  /* =========================================================
     CONTROLS WIRING
  ========================================================= */

  // Mute
  muteBtn.addEventListener('click', () => {
    if (!callState) return;
    callState.muted = !callState.muted;
    muteBtn.textContent = callState.muted ? '🔇' : '🎤';
    muteBtn.classList.toggle('active', callState.muted);
    muteBtn.title = callState.muted ? 'Unmute' : 'Mute';
  });

  // Video toggle
  videoBtn.addEventListener('click', () => {
    if (!callState) return;
    callState.videoOff = !callState.videoOff;
    videoBtn.textContent = callState.videoOff ? '🚫' : '📹';
    videoBtn.classList.toggle('active', callState.videoOff);
    videoBtn.title = callState.videoOff ? 'Start Video' : 'Stop Video';
    pip.classList.toggle('ft-pip-off', callState.videoOff);
    pipLabel.textContent = callState.videoOff ? '🚫' : '📷';
  });

  // SharePlay (cosmetic)
  shareBtn.addEventListener('click', () => {
    api.toast('🎵  SharePlay — Watch and listen together during this call');
  });

  // End call
  endBtn.addEventListener('click', endCall);

  // Idle call buttons
  videoBtnIdle.addEventListener('click', () => {
    const name = contactInput.value.trim() || selectedContact;
    if (!name) { api.toast('Enter a contact name first'); return; }
    startCall(name, 'video');
  });

  audioBtnIdle.addEventListener('click', () => {
    const name = contactInput.value.trim() || selectedContact;
    if (!name) { api.toast('Enter a contact name first'); return; }
    startCall(name, 'audio');
  });

  // New FaceTime button
  newBtn.addEventListener('click', () => {
    contactInput.value = '';
    contactInput.focus();
    selectedContact = null;
    selfLabel.textContent = '📷  Camera Off';
    renderSuggestions();
    // Deselect all recents
    recentsList.querySelectorAll('.ft-recent-row').forEach(r => r.classList.remove('active'));
  });

  /* =========================================================
     CONTACT INPUT — LIVE DROPDOWN
  ========================================================= */

  contactInput.addEventListener('input', () => {
    const q = contactInput.value.trim().toLowerCase();
    selectedContact = null;
    selfLabel.textContent = '📷  Camera Off';

    if (!q) {
      contactDropdown.innerHTML = '';
      contactDropdown.classList.remove('visible');
      renderSuggestions();
      return;
    }

    const matches = SUGGESTED_CONTACTS.filter(n => n.toLowerCase().includes(q));
    if (matches.length === 0) {
      contactDropdown.innerHTML = '';
      contactDropdown.classList.remove('visible');
    } else {
      contactDropdown.innerHTML = '';
      matches.slice(0, 6).forEach(name => {
        const item = el('ft-dd-item');
        const av = el('ft-dd-av');
        av.style.background = gradientFor(name);
        av.textContent = initials(name);
        const nm = setHTML('ft-dd-name', name);
        item.append(av, nm);
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          selectContact(name);
        });
        contactDropdown.append(item);
      });
      contactDropdown.classList.add('visible');
    }
    renderSuggestions();
  });

  contactInput.addEventListener('blur', () => {
    setTimeout(() => {
      contactDropdown.classList.remove('visible');
    }, 150);
  });

  contactInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const name = contactInput.value.trim();
      if (name) startCall(name, 'video');
    }
  });

  /* =========================================================
     SEARCH INPUT
  ========================================================= */

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderRecents();
  });

  /* =========================================================
     INITIAL RENDER
  ========================================================= */

  renderRecents();
  renderSuggestions();

  return root;
}
