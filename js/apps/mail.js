// js/apps/mail.js — macOS Mail app module
// Follows APP_CONTRACT.md: exports content(win, api) returning one HTMLElement.
import { el, setHTML } from '../dom.js';

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_INBOX = [
  {
    id: 'm1', from: 'Tim Cook', email: 'tim@apple.com', subject: 'Welcome to macOS Sequoia',
    snippet: 'We’re thrilled to have you experience the next generation of Mac software…',
    body: `<p>Dear User,</p>
<p>We’re thrilled to have you experience the next generation of Mac software. macOS Sequoia brings powerful new features while staying true to the intuitive, productive experience you love.</p>
<p>Enjoy Safari updates, improved window management, and so much more.</p>
<p>Best,<br>Tim</p>`,
    date: 'Today 9:41 AM', ts: Date.now() - 3 * 60000, read: false, mailbox: 'inbox',
  },
  {
    id: 'm2', from: 'GitHub', email: 'noreply@github.com', subject: '[macOS-clone] PR #42 merged',
    snippet: 'Your pull request "Dock magnification physics" was merged into main…',
    body: `<p>Your pull request <strong>"Dock magnification physics"</strong> was successfully merged into <code>main</code> by the project maintainer.</p>
<p>🎉 Great work! The dock now has buttery-smooth spring physics on hover.</p>
<p><a style="color:var(--accent)">View on GitHub →</a></p>`,
    date: 'Today 8:15 AM', ts: Date.now() - 90 * 60000, read: false, mailbox: 'inbox',
  },
  {
    id: 'm3', from: 'Design Weekly', email: 'hello@designweekly.io', subject: 'The return of skeuomorphism?',
    snippet: 'This week we explore how tactile UI design is making a surprising comeback in…',
    body: `<h2 style="font-size:16px;margin-bottom:10px">This Week in Design</h2>
<p>Skeuomorphism — the design language that gave us leather-stitched calendars and linen textures — is quietly staging a comeback. Driven by nostalgia and a desire for warmth in increasingly sterile interfaces, designers are revisiting tactile metaphors.</p>
<p>This week we look at three studios leading the charge and what it means for the next wave of UI.</p>`,
    date: 'Yesterday', ts: Date.now() - 26 * 3600000, read: true, mailbox: 'inbox',
  },
  {
    id: 'm4', from: 'App Store Connect', email: 'noreply@apple.com', subject: 'Your app is ready for sale',
    snippet: 'Congratulations! "Pixel Canvas" has been approved and is now available on…',
    body: `<p>Congratulations!</p>
<p>Your app <strong>Pixel Canvas</strong> has been reviewed and approved. It is now live on the App Store and available to customers in all your selected territories.</p>
<p>Thank you for developing for Apple platforms.</p>`,
    date: 'Mon', ts: Date.now() - 3 * 86400000, read: true, mailbox: 'inbox',
  },
  {
    id: 'm5', from: 'Ada Lovelace', email: 'ada@enchantress.io', subject: 'Re: Algorithm review notes',
    snippet: 'The analytical engine approach you proposed is brilliant — I’ve annotated a few…',
    body: `<p>Hi,</p>
<p>The analytical engine approach you proposed is brilliant. I’ve annotated a few sections where I think we can optimise the loop structure further.</p>
<p>Let’s sync Thursday at 2pm?</p>
<p>— Ada</p>`,
    date: 'Sun', ts: Date.now() - 4 * 86400000, read: false, mailbox: 'inbox',
  },
  {
    id: 'm6', from: 'iCloud', email: 'no_reply@icloud.com', subject: 'Your storage is almost full',
    snippet: 'You’ve used 4.8 GB of your 5 GB iCloud storage. Upgrade to iCloud+ for more…',
    body: `<p>You’ve used <strong>4.8 GB</strong> of your 5 GB iCloud storage plan.</p>
<p>When iCloud storage is full, new photos, documents, and data will no longer upload to iCloud. Upgrade to iCloud+ to keep everything in sync.</p>`,
    date: 'Sat', ts: Date.now() - 5 * 86400000, read: true, mailbox: 'inbox',
  },
];

const SEED_VIP = [
  {
    id: 'v1', from: 'Ada Lovelace', email: 'ada@enchantress.io', subject: 'VIP: Lunch tomorrow?',
    snippet: 'Are you free tomorrow around noon? I found a wonderful new café near the museum…',
    body: `<p>Hi,</p><p>Are you free tomorrow around noon? I found a wonderful new café near the museum — great coffee and sandwiches. Would love to catch up!</p><p>— Ada</p>`,
    date: 'Today 11:30 AM', ts: Date.now() - 30 * 60000, read: false, mailbox: 'vip',
  },
];

const SEED_SENT = [
  {
    id: 's1', from: 'Me', email: 'me@mac.com', subject: 'Re: Algorithm review notes',
    snippet: 'Thursday at 2pm works perfectly for me. Looking forward to it!',
    body: `<p>Thursday at 2pm works perfectly for me. Looking forward to going through your annotations!</p><p>— Me</p>`,
    date: 'Sun', ts: Date.now() - 4 * 86400000, read: true, mailbox: 'sent',
  },
  {
    id: 's2', from: 'Me', email: 'me@mac.com', subject: 'Dock magnification PR',
    snippet: 'Just pushed the spring physics implementation. Ready for review when you get a chance.',
    body: `<p>Just pushed the spring physics implementation — uses a cubic bezier to simulate momentum on hover enter/leave. Ready for review when you get a chance.</p><p>— Me</p>`,
    date: 'Mon', ts: Date.now() - 3 * 86400000, read: true, mailbox: 'sent',
  },
];

const SEED_DRAFTS = [
  {
    id: 'd1', from: 'Me', email: 'me@mac.com', subject: 'Ideas for next sprint',
    snippet: 'Here are a few things I’ve been thinking about for the upcoming sprint…',
    body: `<p>Here are a few things I’ve been thinking about for the upcoming sprint:</p><p>1. Improved window snap zones<br>2. Menubar clock with world clocks popover<br>3. Live wallpaper support</p>`,
    date: 'Today', ts: Date.now() - 60 * 60000, read: true, mailbox: 'drafts',
  },
];

const SEED_JUNK = [
  {
    id: 'j1', from: 'Promotions Bot', email: 'promo@spammy.biz', subject: '🎉 You WON an iPhone!!!',
    snippet: 'Click here to claim your prize before midnight tonight — don’t miss out…',
    body: `<p>Congratulations lucky winner! You have been selected to receive a FREE iPhone. Click the link below to claim your prize NOW!!!</p>`,
    date: 'Yesterday', ts: Date.now() - 28 * 3600000, read: true, mailbox: 'junk',
  },
];

const SEED_TRASH = [
  {
    id: 't1', from: 'Newsletter XYZ', email: 'news@xyz.com', subject: 'Weekly digest — Issue #204',
    snippet: 'This week: top stories from around the web curated just for you…',
    body: `<p>Here is your weekly digest. Top stories this week...</p>`,
    date: 'Last week', ts: Date.now() - 8 * 86400000, read: true, mailbox: 'trash',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts) {
  const now = Date.now();
  const diff = now - ts;
  const d = new Date(ts);
  if (diff < 86400000 && new Date().getDate() === d.getDate()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (diff < 7 * 86400000) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function genId() {
  return 'msg-' + Math.random().toString(36).slice(2, 9);
}

// ── Main export ───────────────────────────────────────────────────────────────
export function content(win, api) {
  // ── State ──────────────────────────────────────────────────────────────────
  const allMail = api.load('messages', null);
  let messages = allMail
    ? allMail
    : [...SEED_INBOX, ...SEED_VIP, ...SEED_SENT, ...SEED_DRAFTS, ...SEED_JUNK, ...SEED_TRASH];

  function save() { api.store('messages', messages); }

  function mailboxMessages(mb) {
    return messages.filter((m) => m.mailbox === mb)
      .sort((a, b) => b.ts - a.ts);
  }

  function unreadCount(mb) {
    return messages.filter((m) => m.mailbox === mb && !m.read).length;
  }

  let activeMailbox = 'inbox';
  let selectedId = null;

  // ── Root layout ────────────────────────────────────────────────────────────
  const root = el('mail-root');

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = el('mail-sidebar');

  const mailboxDefs = [
    { id: 'inbox',  label: 'Inbox',  glyph: '📥' },
    { id: 'vip',    label: 'VIP',    glyph: '⭐' },
    { id: 'sent',   label: 'Sent',   glyph: '📤' },
    { id: 'drafts', label: 'Drafts', glyph: '📝' },
    { id: 'junk',   label: 'Junk',   glyph: '🚫' },
    { id: 'trash',  label: 'Trash',  glyph: '🗑️' },
  ];

  const sidebarHeader = setHTML('mail-sidebar-header', '<span>Mailboxes</span>');
  sidebar.append(sidebarHeader);

  const mailboxRows = {};
  const unreadBadges = {};

  mailboxDefs.forEach(({ id, label, glyph }) => {
    const row = el('mail-mb-row');
    row.dataset.mb = id;

    const icon = el('mail-mb-icon');
    icon.textContent = glyph;

    const lbl = el('mail-mb-label');
    lbl.textContent = label;

    const badge = el('mail-mb-badge');
    badge.style.display = 'none';

    row.append(icon, lbl, badge);
    sidebar.append(row);
    mailboxRows[id] = row;
    unreadBadges[id] = badge;

    row.addEventListener('click', () => selectMailbox(id));
  });

  // Compose button
  const composeBtn = el('mail-compose-btn', 'button');
  composeBtn.title = 'Compose new message';
  composeBtn.innerHTML = '✏️ Compose';
  composeBtn.addEventListener('click', () => openCompose());
  sidebar.append(composeBtn);

  // ── Message list pane ──────────────────────────────────────────────────────
  const listPane = el('mail-list-pane');

  const listHeader = el('mail-list-header');
  const listTitle = el('mail-list-title');
  listTitle.textContent = 'Inbox';
  listHeader.append(listTitle);
  listPane.append(listHeader);

  const listScroll = el('mail-list-scroll');
  listPane.append(listScroll);

  // ── Reading pane ───────────────────────────────────────────────────────────
  const readPane = el('mail-read-pane');
  const readEmpty = el('mail-read-empty');
  readEmpty.innerHTML = '<span class="mail-read-empty-icon">✉️</span><div>No message selected</div>';
  readPane.append(readEmpty);

  root.append(sidebar, listPane, readPane);

  // ── Badge updater ──────────────────────────────────────────────────────────
  function updateBadges() {
    mailboxDefs.forEach(({ id }) => {
      const count = unreadCount(id);
      const badge = unreadBadges[id];
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // ── Mailbox selector ───────────────────────────────────────────────────────
  function selectMailbox(mb) {
    activeMailbox = mb;
    selectedId = null;

    Object.values(mailboxRows).forEach((r) => r.classList.remove('active'));
    mailboxRows[mb].classList.add('active');

    const def = mailboxDefs.find((d) => d.id === mb);
    listTitle.textContent = def ? def.label : mb;

    renderList();
    renderReadPane(null);
  }

  // ── Message list renderer ──────────────────────────────────────────────────
  function renderList() {
    listScroll.innerHTML = '';
    const msgs = mailboxMessages(activeMailbox);

    if (msgs.length === 0) {
      const empty = el('mail-list-empty');
      empty.textContent = 'No messages';
      listScroll.append(empty);
      return;
    }

    msgs.forEach((msg) => {
      const item = el('mail-msg-item' + (msg.read ? '' : ' unread') + (msg.id === selectedId ? ' selected' : ''));
      item.dataset.id = msg.id;

      const topRow = el('mail-msg-top');

      const fromEl = el('mail-msg-from');
      fromEl.textContent = msg.from;

      const dateEl = el('mail-msg-date');
      dateEl.textContent = formatDate(msg.ts);

      topRow.append(fromEl, dateEl);

      const subjEl = el('mail-msg-subj');
      subjEl.textContent = msg.subject;

      const snippetEl = el('mail-msg-snippet');
      snippetEl.textContent = msg.snippet;

      const unreadDot = el('mail-unread-dot');

      item.append(unreadDot, topRow, subjEl, snippetEl);

      item.addEventListener('click', () => selectMessage(msg.id));
      listScroll.append(item);
    });
  }

  // ── Message selector ───────────────────────────────────────────────────────
  function selectMessage(id) {
    selectedId = id;

    // Mark as read
    const msg = messages.find((m) => m.id === id);
    if (msg && !msg.read) {
      msg.read = true;
      save();
      updateBadges();
    }

    // Update list item active states
    listScroll.querySelectorAll('.mail-msg-item').forEach((item) => {
      item.classList.toggle('selected', item.dataset.id === id);
      const m = messages.find((m) => m.id === item.dataset.id);
      if (m && m.read) item.classList.remove('unread');
    });

    renderReadPane(msg);
  }

  // ── Reading pane renderer ──────────────────────────────────────────────────
  function renderReadPane(msg) {
    readPane.innerHTML = '';

    if (!msg) {
      readPane.append(readEmpty);
      return;
    }

    // Header
    const header = el('mail-read-header');

    const subj = el('mail-read-subject');
    subj.textContent = msg.subject;

    const meta = el('mail-read-meta');

    const avatar = el('mail-read-avatar');
    avatar.textContent = msg.from.charAt(0).toUpperCase();
    // Deterministic color from name
    const colors = ['#0a84ff','#30d158','#ff9f0a','#bf5af2','#ff375f','#5ac8fa','#ffd60a'];
    const colorIdx = msg.from.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length;
    avatar.style.background = colors[colorIdx];

    const metaText = el('mail-read-meta-text');
    const fromLine = el('mail-read-from');
    fromLine.innerHTML = `<strong>${msg.from}</strong> <span class="mail-read-email">&lt;${msg.email}&gt;</span>`;
    const toLine = el('mail-read-to');
    toLine.innerHTML = `To: <span>me@mac.com</span>`;
    const dateLine = el('mail-read-dateline');
    dateLine.textContent = msg.date;

    metaText.append(fromLine, toLine, dateLine);
    meta.append(avatar, metaText);

    // Actions
    const actions = el('mail-read-actions');
    const replyBtn = el('mail-action-btn', 'button');
    replyBtn.innerHTML = '↩ Reply';
    replyBtn.addEventListener('click', () => openCompose({ to: msg.email, subject: 'Re: ' + msg.subject }));

    const forwardBtn = el('mail-action-btn', 'button');
    forwardBtn.innerHTML = '↪ Forward';
    forwardBtn.addEventListener('click', () => openCompose({ subject: 'Fwd: ' + msg.subject, body: `\n\n--- Forwarded message ---\nFrom: ${msg.from}\nSubject: ${msg.subject}\n\n${msg.body.replace(/<[^>]+>/g, '')}` }));

    const deleteBtn = el('mail-action-btn danger', 'button');
    deleteBtn.innerHTML = '🗑 Delete';
    deleteBtn.addEventListener('click', () => deleteMessage(msg.id));

    actions.append(replyBtn, forwardBtn, deleteBtn);

    header.append(subj, meta, actions);

    // Divider
    const divider = el('mail-read-divider');

    // Body
    const body = el('mail-read-body');
    body.innerHTML = msg.body;

    readPane.append(header, divider, body);
  }

  // ── Delete handler ─────────────────────────────────────────────────────────
  function deleteMessage(id) {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return;

    const msg = messages[idx];
    if (msg.mailbox === 'trash') {
      messages.splice(idx, 1);
      api.toast('Message permanently deleted');
    } else {
      msg.mailbox = 'trash';
      msg.read = true;
      api.toast('Moved to Trash');
    }

    save();
    updateBadges();
    selectedId = null;
    renderList();
    renderReadPane(null);
  }

  // ── Compose modal ──────────────────────────────────────────────────────────
  function openCompose(prefill = {}) {
    // Remove any existing modal
    const existing = root.querySelector('.mail-compose-modal');
    if (existing) existing.remove();

    const modal = el('mail-compose-modal');

    const modalInner = el('mail-compose-inner');

    // Title bar
    const titleBar = el('mail-compose-titlebar');
    const titleText = el('mail-compose-title');
    titleText.textContent = 'New Message';

    const closeBtn = el('mail-compose-close', 'button');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => modal.remove());

    titleBar.append(closeBtn, titleText);

    // To field
    const toRow = el('mail-compose-row');
    const toLabel = el('mail-compose-label');
    toLabel.textContent = 'To:';
    const toInput = el('mail-compose-input', 'input');
    toInput.type = 'text';
    toInput.placeholder = 'recipient@example.com';
    toInput.value = prefill.to || '';
    toRow.append(toLabel, toInput);

    // Subject field
    const subjRow = el('mail-compose-row');
    const subjLabel = el('mail-compose-label');
    subjLabel.textContent = 'Subject:';
    const subjInput = el('mail-compose-input', 'input');
    subjInput.type = 'text';
    subjInput.placeholder = 'Subject';
    subjInput.value = prefill.subject || '';
    subjRow.append(subjLabel, subjInput);

    // Body field
    const bodyArea = el('mail-compose-body', 'textarea');
    bodyArea.placeholder = 'Write your message here…';
    bodyArea.value = prefill.body || '';

    // Footer
    const footer = el('mail-compose-footer');

    const discardBtn = el('mail-compose-discard', 'button');
    discardBtn.textContent = 'Discard';
    discardBtn.addEventListener('click', () => modal.remove());

    const saveDraftBtn = el('mail-compose-draft', 'button');
    saveDraftBtn.textContent = 'Save Draft';
    saveDraftBtn.addEventListener('click', () => {
      if (!subjInput.value.trim() && !bodyArea.value.trim()) {
        api.toast('Nothing to save as draft.');
        return;
      }
      const draft = {
        id: genId(),
        from: 'Me', email: 'me@mac.com',
        subject: subjInput.value.trim() || '(No Subject)',
        snippet: bodyArea.value.trim().slice(0, 80) || '(No content)',
        body: '<p>' + bodyArea.value.replace(/\n/g, '</p><p>') + '</p>',
        date: 'Today', ts: Date.now(),
        read: true, mailbox: 'drafts',
      };
      messages.push(draft);
      save();
      updateBadges();
      if (activeMailbox === 'drafts') renderList();
      api.toast('Draft saved');
      modal.remove();
    });

    const sendBtn = el('mail-compose-send', 'button');
    sendBtn.textContent = '📨 Send';
    sendBtn.addEventListener('click', () => {
      const to = toInput.value.trim();
      const subj = subjInput.value.trim();
      const body = bodyArea.value.trim();

      if (!to) { api.toast('Please enter a recipient.'); toInput.focus(); return; }
      if (!subj) { api.toast('Please enter a subject.'); subjInput.focus(); return; }

      const sent = {
        id: genId(),
        from: 'Me', email: 'me@mac.com',
        subject: subj,
        snippet: body.slice(0, 80) || '(No content)',
        body: '<p>' + body.replace(/\n/g, '</p><p>') + '</p>',
        date: 'Today', ts: Date.now(),
        read: true, mailbox: 'sent',
      };
      messages.push(sent);
      save();
      if (activeMailbox === 'sent') renderList();
      api.toast('Message sent to ' + to);
      modal.remove();
    });

    footer.append(discardBtn, saveDraftBtn, sendBtn);

    modalInner.append(titleBar, toRow, subjRow, bodyArea, footer);
    modal.append(modalInner);
    root.append(modal);

    // Focus the appropriate field
    setTimeout(() => {
      if (prefill.to) subjInput.focus();
      else toInput.focus();
    }, 30);
  }

  // ── Initial render ─────────────────────────────────────────────────────────
  updateBadges();
  selectMailbox('inbox');

  // Select first message automatically
  const firstMsgs = mailboxMessages('inbox');
  if (firstMsgs.length > 0) {
    selectMessage(firstMsgs[0].id);
  }

  return root;
}
