// js/apps/reminders.js — macOS Reminders clone
// Import shared DOM helpers; do NOT import from apps.js (avoids cycles).
import { el, setHTML } from '../dom.js';

/* ============================================================
   Data model helpers
   ============================================================ */

/** Generate a simple unique id */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Default smart lists (always present, cannot be deleted) */
const SMART_LISTS = [
  { id: 'today',     name: 'Today',     glyph: '⭐', color: '#ff9f0a', smart: true },
  { id: 'scheduled', name: 'Scheduled', glyph: '📅', color: '#ff3b30', smart: true },
  { id: 'all',       name: 'All',       glyph: '📋', color: '#6e6e73', smart: true },
  { id: 'flagged',   name: 'Flagged',   glyph: '🚩', color: '#ff3b30', smart: true },
];

/** Priority labels and badge colours */
const PRIORITY = {
  none:   { label: '',       badge: null },
  low:    { label: '!',      badge: '#34c759' },
  medium: { label: '!!',     badge: '#ff9f0a' },
  high:   { label: '!!!',    badge: '#ff3b30' },
};

const LIST_COLORS = ['#0a84ff', '#34c759', '#ff9f0a', '#ff3b30', '#bf5af2', '#ff375f', '#5ac8fa', '#ac8e68'];

/** Format a Date for display */
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return '⚠ Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Today's ISO date string (yyyy-mm-dd) */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   Main content factory
   ============================================================ */

export function content(win, api) {
  /* ---------- Load persisted state ---------- */
  let lists    = api.load('lists',     []);
  let reminders = api.load('reminders', []);

  // Seed default data on first launch
  if (reminders.length === 0) {
    const demoListId = uid();
    lists = [
      { id: demoListId, name: 'Personal', color: '#0a84ff' },
    ];
    reminders = [
      { id: uid(), listId: demoListId, text: 'Buy coffee beans',         done: false, flagged: false, priority: 'none', dueDate: '',          notes: '' },
      { id: uid(), listId: demoListId, text: 'Reply to design review',   done: false, flagged: true,  priority: 'high', dueDate: todayISO(),  notes: 'Email from Ada' },
      { id: uid(), listId: demoListId, text: 'Ship dock magnification',  done: true,  flagged: false, priority: 'none', dueDate: '',          notes: '' },
      { id: uid(), listId: demoListId, text: 'Water the plants',         done: false, flagged: false, priority: 'low',  dueDate: todayISO(),  notes: '' },
      { id: uid(), listId: demoListId, text: 'Read MDN on transforms',   done: true,  flagged: false, priority: 'none', dueDate: '',          notes: '' },
    ];
    save();
  }

  function save() {
    api.store('lists', lists);
    api.store('reminders', reminders);
  }

  /* ---------- Active view state ---------- */
  let activeListId = 'all';  // smart list id or custom list id
  let editingRemId = null;   // which reminder is being detailed

  /* ---------- Root layout ---------- */
  const root = el('rem-root');

  /* ---- Sidebar ---- */
  const sidebar = el('rem-sidebar');
  const mainPane = el('rem-main');
  root.append(sidebar, mainPane);

  /* ============================================================
     Sidebar rendering
     ============================================================ */

  function countFor(listId) {
    const undone = reminders.filter((r) => !r.done);
    switch (listId) {
      case 'today':     return undone.filter((r) => r.dueDate === todayISO()).length;
      case 'scheduled': return undone.filter((r) => !!r.dueDate).length;
      case 'all':       return undone.length;
      case 'flagged':   return undone.filter((r) => r.flagged).length;
      default:          return undone.filter((r) => r.listId === listId).length;
    }
  }

  function renderSidebar() {
    sidebar.innerHTML = '';

    // Smart lists grid (2×2 card grid)
    const smartGrid = el('rem-smart-grid');
    SMART_LISTS.forEach((sl) => {
      const card = el('rem-smart-card' + (activeListId === sl.id ? ' active' : ''));
      card.dataset.id = sl.id;
      const cnt = countFor(sl.id);
      card.innerHTML = `
        <div class="rem-sc-icon" style="background:${sl.color}">${sl.glyph}</div>
        <div class="rem-sc-count">${cnt || ''}</div>
        <div class="rem-sc-name">${sl.name}</div>
      `;
      card.addEventListener('click', () => selectList(sl.id));
      smartGrid.append(card);
    });
    sidebar.append(smartGrid);

    // "My Lists" section
    const section = el('rem-sb-section');
    const secHead = el('rem-sb-section-head');
    secHead.innerHTML = '<span>My Lists</span>';
    const addListBtn = el('rem-sb-add-btn', 'button');
    addListBtn.title = 'Add List';
    addListBtn.textContent = '+';
    addListBtn.addEventListener('click', addList);
    secHead.append(addListBtn);
    section.append(secHead);

    lists.forEach((lst) => {
      const row = el('rem-sb-row' + (activeListId === lst.id ? ' active' : ''));
      row.dataset.id = lst.id;
      const cnt = countFor(lst.id);
      row.innerHTML = `
        <span class="rem-sb-dot" style="background:${lst.color}"></span>
        <span class="rem-sb-name">${escHtml(lst.name)}</span>
        <span class="rem-sb-count">${cnt > 0 ? cnt : ''}</span>
      `;
      row.addEventListener('click', () => selectList(lst.id));
      // Right-click to delete list
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm(`Delete list "${lst.name}" and all its reminders?`)) {
          reminders = reminders.filter((r) => r.listId !== lst.id);
          lists = lists.filter((l) => l.id !== lst.id);
          save();
          if (activeListId === lst.id) activeListId = 'all';
          renderAll();
        }
      });
      section.append(row);
    });

    sidebar.append(section);
  }

  /* ============================================================
     Add List
     ============================================================ */

  function addList() {
    const name = prompt('List name:');
    if (!name || !name.trim()) return;
    const color = LIST_COLORS[lists.length % LIST_COLORS.length];
    const newList = { id: uid(), name: name.trim(), color };
    lists.push(newList);
    save();
    selectList(newList.id);
  }

  /* ============================================================
     Main pane rendering
     ============================================================ */

  function getActiveLabel() {
    const sl = SMART_LISTS.find((s) => s.id === activeListId);
    if (sl) return sl.name;
    const lst = lists.find((l) => l.id === activeListId);
    return lst ? lst.name : 'Reminders';
  }

  function getActiveColor() {
    const sl = SMART_LISTS.find((s) => s.id === activeListId);
    if (sl) return sl.color;
    const lst = lists.find((l) => l.id === activeListId);
    return lst ? lst.color : '#0a84ff';
  }

  function getVisibleReminders() {
    switch (activeListId) {
      case 'today':     return reminders.filter((r) => r.dueDate === todayISO());
      case 'scheduled': return reminders.filter((r) => !!r.dueDate);
      case 'all':       return [...reminders];
      case 'flagged':   return reminders.filter((r) => r.flagged);
      default:          return reminders.filter((r) => r.listId === activeListId);
    }
  }

  function renderMain() {
    mainPane.innerHTML = '';

    const color = getActiveColor();
    const label = getActiveLabel();

    /* ---- Header ---- */
    const header = el('rem-header');
    const count  = getVisibleReminders().filter((r) => !r.done).length;
    header.innerHTML = `
      <div class="rem-header-count" style="color:${color}">${count > 0 ? count : ''}</div>
      <div class="rem-header-title" style="color:${color}">${escHtml(label)}</div>
    `;
    mainPane.append(header);

    /* ---- Add reminder input ---- */
    // Show add input only for user lists and "All"
    if (activeListId !== 'today' && activeListId !== 'scheduled' && activeListId !== 'flagged') {
      const addRow = el('rem-add-row');
      const addIcon = el('rem-add-icon');
      addIcon.textContent = '+';
      addIcon.style.color = color;
      const addInput = el('rem-add-input', 'input');
      addInput.type = 'text';
      addInput.placeholder = 'Add Reminder';
      addRow.append(addIcon, addInput);
      mainPane.append(addRow);

      addInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && addInput.value.trim()) {
          addReminder(addInput.value.trim());
          addInput.value = '';
        }
      });
    }

    /* ---- Reminder list ---- */
    const items = getVisibleReminders();

    // Separate done/undone
    const undone = items.filter((r) => !r.done);
    const done   = items.filter((r) => r.done);

    const listEl = el('rem-list');

    function renderGroup(group) {
      group.forEach((rem) => {
        listEl.append(buildReminderRow(rem, color));
      });
    }

    renderGroup(undone);

    if (done.length > 0) {
      // Collapsible "Completed" section
      const compHeader = el('rem-comp-header');
      compHeader.textContent = `Completed (${done.length})`;
      let compVisible = false;
      const compGroup = el('rem-comp-group');
      compGroup.style.display = 'none';
      done.forEach((rem) => compGroup.append(buildReminderRow(rem, color)));

      compHeader.addEventListener('click', () => {
        compVisible = !compVisible;
        compGroup.style.display = compVisible ? 'block' : 'none';
        compHeader.classList.toggle('open', compVisible);
      });
      listEl.append(compHeader, compGroup);
    }

    mainPane.append(listEl);
  }

  /* ============================================================
     Reminder row builder
     ============================================================ */

  function buildReminderRow(rem, accentColor) {
    const row = el('rem-row');
    row.dataset.id = rem.id;
    if (rem.done) row.classList.add('done');

    // Check circle
    const check = el('rem-circle', 'button');
    check.title = rem.done ? 'Mark incomplete' : 'Mark complete';
    check.style.borderColor = accentColor;
    if (rem.done) {
      check.style.background = accentColor;
      check.innerHTML = '<svg viewBox="0 0 12 10" width="12" height="10"><polyline points="1,5 4.5,8.5 11,1" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    check.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDone(rem.id);
    });

    // Priority badge
    const pr = PRIORITY[rem.priority] || PRIORITY.none;
    const priBadge = el('rem-pri');
    if (pr.badge) {
      priBadge.textContent = pr.label;
      priBadge.style.color = pr.badge;
    }

    // Text + notes + due
    const body = el('rem-row-body');
    const textEl = el('rem-row-text');
    textEl.textContent = rem.text;

    const meta = el('rem-row-meta');
    const parts = [];
    if (rem.dueDate) {
      const ds = fmtDate(rem.dueDate);
      const cls = rem.dueDate < todayISO() ? 'overdue' : (rem.dueDate === todayISO() ? 'today-due' : '');
      parts.push(`<span class="rem-due ${cls}">${ds}</span>`);
    }
    if (rem.notes) parts.push(`<span class="rem-notes-hint">${escHtml(rem.notes)}</span>`);
    meta.innerHTML = parts.join('<span class="rem-meta-sep"> · </span>');

    body.append(textEl);
    if (parts.length) body.append(meta);

    // Flag button
    const flagBtn = el('rem-flag-btn', 'button');
    flagBtn.title = rem.flagged ? 'Remove flag' : 'Flag';
    flagBtn.textContent = '🚩';
    flagBtn.classList.toggle('active', rem.flagged);
    flagBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFlag(rem.id);
    });

    // Delete button (shown on hover via CSS)
    const delBtn = el('rem-del-btn', 'button');
    delBtn.title = 'Delete';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteReminder(rem.id);
    });

    row.append(check, priBadge, body, flagBtn, delBtn);

    // Click row to open detail panel
    row.addEventListener('click', () => {
      openDetail(rem.id);
    });

    return row;
  }

  /* ============================================================
     Detail panel (right-click or row click on a reminder)
     ============================================================ */

  function openDetail(remId) {
    // Remove any existing detail
    mainPane.querySelector('.rem-detail')?.remove();

    const rem = reminders.find((r) => r.id === remId);
    if (!rem) return;

    editingRemId = remId;

    const detail = el('rem-detail');

    const dTitle = el('rem-detail-title');
    dTitle.textContent = 'Details';

    const closeBtn = el('rem-detail-close', 'button');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      detail.remove();
      editingRemId = null;
    });

    dTitle.append(closeBtn);
    detail.append(dTitle);

    // Title field
    const nameField = el('rem-detail-field');
    nameField.innerHTML = '<label>Title</label>';
    const nameInput = el('rem-detail-input', 'input');
    nameInput.value = rem.text;
    nameInput.addEventListener('change', () => {
      rem.text = nameInput.value.trim() || rem.text;
      save();
      renderReminderRow(rem);
    });
    nameField.append(nameInput);
    detail.append(nameField);

    // Notes field
    const notesField = el('rem-detail-field');
    notesField.innerHTML = '<label>Notes</label>';
    const notesInput = el('rem-detail-textarea', 'textarea');
    notesInput.value = rem.notes || '';
    notesInput.rows = 3;
    notesInput.addEventListener('change', () => {
      rem.notes = notesInput.value;
      save();
      renderReminderRow(rem);
    });
    notesField.append(notesInput);
    detail.append(notesField);

    // Due date
    const dueField = el('rem-detail-field');
    dueField.innerHTML = '<label>Due Date</label>';
    const dueInput = el('rem-detail-input', 'input');
    dueInput.type = 'date';
    dueInput.value = rem.dueDate || '';
    dueInput.addEventListener('change', () => {
      rem.dueDate = dueInput.value;
      save();
      renderAll();
    });
    dueField.append(dueInput);
    detail.append(dueField);

    // Priority selector
    const priField = el('rem-detail-field');
    priField.innerHTML = '<label>Priority</label>';
    const priSel = el('rem-detail-select', 'select');
    [['none', 'None'], ['low', 'Low !'], ['medium', 'Medium !!'], ['high', 'High !!!']]
      .forEach(([val, lbl]) => {
        const opt = el(null, 'option');
        opt.value = val;
        opt.textContent = lbl;
        if (rem.priority === val) opt.selected = true;
        priSel.append(opt);
      });
    priSel.addEventListener('change', () => {
      rem.priority = priSel.value;
      save();
      renderReminderRow(rem);
    });
    priField.append(priSel);
    detail.append(priField);

    // Flagged toggle
    const flagField = el('rem-detail-field rem-detail-toggle-row');
    flagField.innerHTML = '<label>Flagged</label>';
    const flagToggle = el('rem-detail-toggle', 'button');
    flagToggle.classList.toggle('on', rem.flagged);
    flagToggle.addEventListener('click', () => {
      rem.flagged = !rem.flagged;
      flagToggle.classList.toggle('on', rem.flagged);
      save();
      renderAll();
    });
    flagField.append(flagToggle);
    detail.append(flagField);

    // List assignment (for non-smart views)
    if (lists.length > 0) {
      const lstField = el('rem-detail-field');
      lstField.innerHTML = '<label>List</label>';
      const lstSel = el('rem-detail-select', 'select');
      lists.forEach((lst) => {
        const opt = el(null, 'option');
        opt.value = lst.id;
        opt.textContent = lst.name;
        if (rem.listId === lst.id) opt.selected = true;
        lstSel.append(opt);
      });
      lstSel.addEventListener('change', () => {
        rem.listId = lstSel.value;
        save();
        renderAll();
      });
      lstField.append(lstSel);
      detail.append(lstField);
    }

    mainPane.append(detail);
  }

  /* Update just one row in place without full re-render */
  function renderReminderRow(rem) {
    const existing = mainPane.querySelector(`.rem-row[data-id="${rem.id}"]`);
    if (!existing) return;
    const color = getActiveColor();
    const newRow = buildReminderRow(rem, color);
    existing.replaceWith(newRow);
  }

  /* ============================================================
     Actions
     ============================================================ */

  function addReminder(text) {
    // Determine which list to add to
    let targetListId;
    if (SMART_LISTS.some((s) => s.id === activeListId)) {
      // Smart list — pick first user list or create one
      if (lists.length === 0) {
        const defaultId = uid();
        lists.push({ id: defaultId, name: 'Reminders', color: '#0a84ff' });
      }
      targetListId = lists[0].id;
    } else {
      targetListId = activeListId;
    }

    const rem = {
      id: uid(),
      listId: targetListId,
      text,
      done: false,
      flagged: false,
      priority: 'none',
      dueDate: activeListId === 'today' ? todayISO() : '',
      notes: '',
    };
    reminders.push(rem);
    save();
    renderAll();
    api.toast('Reminder added');
  }

  function toggleDone(remId) {
    const rem = reminders.find((r) => r.id === remId);
    if (!rem) return;
    rem.done = !rem.done;
    save();
    renderAll();
  }

  function toggleFlag(remId) {
    const rem = reminders.find((r) => r.id === remId);
    if (!rem) return;
    rem.flagged = !rem.flagged;
    save();
    renderAll();
  }

  function deleteReminder(remId) {
    reminders = reminders.filter((r) => r.id !== remId);
    if (editingRemId === remId) {
      mainPane.querySelector('.rem-detail')?.remove();
      editingRemId = null;
    }
    save();
    renderAll();
  }

  /* ============================================================
     Navigation
     ============================================================ */

  function selectList(id) {
    activeListId = id;
    editingRemId = null;
    renderAll();
  }

  function renderAll() {
    renderSidebar();
    renderMain();
  }

  /* ============================================================
     Utility
     ============================================================ */

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ============================================================
     Initial render
     ============================================================ */
  renderAll();

  return root;
}
