// js/apps/messages.js — iMessage-style Messages app for the macOS web clone.
// Follows the APP_CONTRACT: export function content(win, api) { return rootEl; }
import { el, setHTML } from '../dom.js';

// ─── Seed data ─────────────────────────────────────────────────────────────
const SEED_THREADS = [
  {
    id: 'ada',
    name: 'Ada Lovelace',
    avatar: '🦋',
    messages: [
      { from: 'them', text: 'Hey! Ready for the design review?', ts: Date.now() - 3600000 * 5 },
      { from: 'me',   text: 'Almost! Just finishing the last mockup 🎨', ts: Date.now() - 3600000 * 4 },
      { from: 'them', text: 'See you at the review!', ts: Date.now() - 3600000 * 3 },
    ],
  },
  {
    id: 'grace',
    name: 'Grace Hopper',
    avatar: '⚓',
    messages: [
      { from: 'them', text: 'The compiler is finally done 🎉', ts: Date.now() - 86400000 },
      { from: 'me',   text: 'That took forever haha — congrats!', ts: Date.now() - 86400000 + 120000 },
      { from: 'them', text: 'Worth it. Bugs are down 40%', ts: Date.now() - 86400000 + 300000 },
    ],
  },
  {
    id: 'alan',
    name: 'Alan Turing',
    avatar: '🧮',
    messages: [
      { from: 'me',   text: 'Did you crack the puzzle?', ts: Date.now() - 86400000 * 2 },
      { from: 'them', text: 'Did you solve it?', ts: Date.now() - 86400000 * 2 + 600000 },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    avatar: '👨‍👩‍👧',
    messages: [
      { from: 'them', text: 'Dinner Sunday?', ts: Date.now() - 86400000 * 3 },
      { from: 'me',   text: 'I’ll be there! 🍽️', ts: Date.now() - 86400000 * 3 + 60000 },
    ],
  },
  {
    id: 'tim',
    name: 'Tim Berners-Lee',
    avatar: '🕸️',
    messages: [
      { from: 'them', text: 'Have you read the new CSS spec?', ts: Date.now() - 86400000 * 5 },
      { from: 'me',   text: 'Yes! Nesting is finally here 🙌', ts: Date.now() - 86400000 * 5 + 300000 },
    ],
  },
];

// Canned auto-replies per contact
const REPLIES = {
  ada:    ['On my way!', 'Sounds good 👍', 'See you soon!', 'Love that idea!', 'LOL 😂'],
  grace:  ['Totally agree.', 'Debug it and ship it 🚢', 'Nice one!', 'Running the tests now…', 'LGTM!'],
  alan:   ['Interesting problem…', 'Let me think about that.', 'The answer is 42.', 'Computationally speaking…', '🤔'],
  family: ['❤️', 'Miss you all!', 'Mom says hi!', 'See you Sunday!', '😄'],
  tim:    ['The web is for everyone.', 'Check the RFC.', 'Interesting!', 'Have you tried the polyfill?', '👀'],
};

const GENERIC_REPLIES = ['👍', 'Got it!', 'Sure!', 'Sounds good.', 'On it!', '😊', 'Cool!'];

function getReplies(id) {
  return REPLIES[id] || GENERIC_REPLIES;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fmtFullTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pickReply(id) {
  const pool = getReplies(id);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function content(win, api) {
  // ── Load/initialise persisted threads ──────────────────────────────────
  let threads = api.load('threads', null);
  if (!threads) {
    threads = SEED_THREADS;
    api.store('threads', threads);
  }

  let activeId = threads[0]?.id ?? null;
  let searchQuery = '';

  // ── Root layout ─────────────────────────────────────────────────────────
  const root = el('msg-root');

  // ── Sidebar ─────────────────────────────────────────────────────────────
  const sidebar = el('msg-sidebar');

  // Search bar
  const searchWrap = el('msg-search-wrap');
  const searchInput = el('msg-search-input', 'input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔍 Search';
  searchInput.setAttribute('aria-label', 'Search conversations');
  searchWrap.append(searchInput);
  sidebar.append(searchWrap);

  const convList = el('msg-conv-list');
  sidebar.append(convList);

  // ── Chat pane ───────────────────────────────────────────────────────────
  const chatPane = el('msg-chat-pane');

  const chatHeader = el('msg-chat-header');
  const headerAvatar = el('msg-header-avatar');
  const headerInfo = el('msg-header-info');
  const headerName = el('msg-header-name');
  const headerStatus = el('msg-header-status');
  headerStatus.textContent = 'iMessage';
  headerInfo.append(headerName, headerStatus);
  chatHeader.append(headerAvatar, headerInfo);
  chatPane.append(chatHeader);

  const threadEl = el('msg-thread');
  chatPane.append(threadEl);

  // Composer
  const composerWrap = el('msg-composer-wrap');
  const composerInput = el('msg-composer-input', 'input');
  composerInput.type = 'text';
  composerInput.placeholder = 'iMessage';
  composerInput.setAttribute('aria-label', 'Message input');
  const sendBtn = el('msg-send-btn', 'button');
  sendBtn.setAttribute('aria-label', 'Send message');
  sendBtn.innerHTML = '<span class="msg-send-arrow">↑</span>';
  composerWrap.append(composerInput, sendBtn);
  chatPane.append(composerWrap);

  root.append(sidebar, chatPane);

  // ── State helpers ────────────────────────────────────────────────────────
  function saveThreads() {
    api.store('threads', threads);
  }

  function getThread(id) {
    return threads.find((t) => t.id === id) || null;
  }

  function lastMsg(thread) {
    return thread.messages[thread.messages.length - 1] || null;
  }

  // ── Render conversation list ─────────────────────────────────────────────
  function renderConvList() {
    convList.innerHTML = '';
    const q = searchQuery.toLowerCase().trim();
    const visible = q
      ? threads.filter((t) => {
          if (t.name.toLowerCase().includes(q)) return true;
          return t.messages.some((m) => m.text.toLowerCase().includes(q));
        })
      : threads;

    if (visible.length === 0) {
      const empty = el('msg-conv-empty');
      empty.textContent = q ? 'No results' : 'No conversations';
      convList.append(empty);
      return;
    }

    visible.forEach((thread) => {
      const row = el('msg-conv-row' + (thread.id === activeId ? ' active' : ''));
      row.dataset.id = thread.id;

      const avatarEl = el('msg-conv-avatar');
      avatarEl.textContent = thread.avatar;

      const bodyEl = el('msg-conv-body');
      const nameEl = el('msg-conv-name');
      nameEl.textContent = thread.name;
      const previewEl = el('msg-conv-preview');
      const lm = lastMsg(thread);
      previewEl.textContent = lm
        ? (lm.from === 'me' ? 'You: ' : '') + lm.text
        : '';

      const timeEl = el('msg-conv-time');
      timeEl.textContent = lm ? fmtTime(lm.ts) : '';

      const metaEl = el('msg-conv-meta');
      metaEl.append(nameEl, timeEl);
      bodyEl.append(metaEl, previewEl);
      row.append(avatarEl, bodyEl);

      row.addEventListener('click', () => {
        activeId = thread.id;
        renderConvList();
        renderThread();
        composerInput.focus();
      });

      convList.append(row);
    });
  }

  // ── Render chat thread ───────────────────────────────────────────────────
  function renderThread() {
    const thread = getThread(activeId);
    threadEl.innerHTML = '';

    if (!thread) {
      const empty = el('msg-thread-empty');
      empty.innerHTML = '<span class="msg-thread-empty-glyph">💬</span><span>Select a conversation</span>';
      threadEl.append(empty);
      headerName.textContent = '';
      headerAvatar.textContent = '';
      return;
    }

    headerName.textContent = thread.name;
    headerAvatar.textContent = thread.avatar;

    // Group messages with date separators
    let lastDateStr = '';
    thread.messages.forEach((msg) => {
      const d = new Date(msg.ts);
      const dateStr = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      if (dateStr !== lastDateStr) {
        lastDateStr = dateStr;
        const sep = el('msg-date-sep');
        sep.textContent = dateStr;
        threadEl.append(sep);
      }

      const bubbleWrap = el('msg-bubble-wrap ' + (msg.from === 'me' ? 'sent' : 'received'));
      const bubble = el('msg-bubble');
      bubble.textContent = msg.text;
      const time = el('msg-bubble-time');
      time.textContent = fmtFullTime(msg.ts);
      bubbleWrap.append(bubble, time);
      threadEl.append(bubbleWrap);
    });

    // Scroll to bottom
    requestAnimationFrame(() => {
      threadEl.scrollTop = threadEl.scrollHeight;
    });
  }

  // ── Send a message ───────────────────────────────────────────────────────
  function sendMessage() {
    const text = composerInput.value.trim();
    if (!text || !activeId) return;

    const thread = getThread(activeId);
    if (!thread) return;

    // Append sent bubble
    thread.messages.push({ from: 'me', text, ts: Date.now() });
    composerInput.value = '';
    saveThreads();
    renderConvList();
    renderThread();

    // Update send button state
    updateSendBtn();

    // Schedule a canned reply after a short delay
    const delay = 900 + Math.random() * 1400;
    setTimeout(() => {
      const reply = pickReply(thread.id);
      thread.messages.push({ from: 'them', text: reply, ts: Date.now() });
      saveThreads();
      renderConvList();
      // Only re-render thread if still in same conversation
      if (activeId === thread.id) {
        renderThread();
      }
    }, delay);
  }

  // ── Send button enabled/disabled ─────────────────────────────────────────
  function updateSendBtn() {
    const hasText = composerInput.value.trim().length > 0;
    sendBtn.classList.toggle('active', hasText);
    sendBtn.disabled = !hasText;
  }

  composerInput.addEventListener('input', updateSendBtn);
  composerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  // ── Search ───────────────────────────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderConvList();
  });

  // Clear search on Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchQuery = '';
      renderConvList();
      searchInput.blur();
    }
  });

  // ── Initial render ───────────────────────────────────────────────────────
  updateSendBtn();
  renderConvList();
  renderThread();

  return root;
}
