// js/apps/shortcuts.js — macOS Shortcuts app
// Part of the macOS Sequoia web clone. Vanilla JS, no external deps.
import { el, setHTML } from '../dom.js';

/* ─── Prebuilt shortcut gallery ─── */
const GALLERY = [
  {
    id: 'g-morning', name: 'Morning Routine', glyph: '🌅', color: '#ff9500',
    cat: 'Featured', steps: ['Disable Do Not Disturb', 'Open Weather', 'Play Morning Playlist', 'Show Calendar'],
  },
  {
    id: 'g-screenshot', name: 'Screenshot & Share', glyph: '📸', color: '#0a84ff',
    cat: 'Featured', steps: ['Take Screenshot', 'Save to Photos', 'Copy to Clipboard', 'Show Toast'],
  },
  {
    id: 'g-focus', name: 'Focus Mode', glyph: '🎯', color: '#ff375f',
    cat: 'Featured', steps: ['Enable Do Not Disturb', 'Close All Windows', 'Open Notes', 'Start Timer'],
  },
  {
    id: 'g-battery', name: 'Battery Saver', glyph: '🔋', color: '#34c759',
    cat: 'Featured', steps: ['Lower Brightness', 'Disable Wi-Fi', 'Enable Low Power Mode', 'Show Alert'],
  },
  {
    id: 'g-meeting', name: 'Join Meeting', glyph: '📹', color: '#bf5af2',
    cat: 'Productivity', steps: ['Open Calendar', 'Get Meeting Link', 'Open FaceTime', 'Mute Notifications'],
  },
  {
    id: 'g-travel', name: 'Travel Mode', glyph: '✈️', color: '#ff6961',
    cat: 'Productivity', steps: ['Open Maps', 'Check Weather', 'Set Alarm', 'Enable Location'],
  },
  {
    id: 'g-music', name: 'Play Workout Mix', glyph: '🏃', color: '#ff9f0a',
    cat: 'Media', steps: ['Open Music', 'Search Playlist "Workout"', 'Set Volume to 80%', 'Enable Shuffle'],
  },
  {
    id: 'g-news', name: 'Morning Briefing', glyph: '📰', color: '#636366',
    cat: 'Media', steps: ['Open News', 'Open Weather', 'Show Today Summary', 'Open Calendar'],
  },
  {
    id: 'g-study', name: 'Study Session', glyph: '📚', color: '#5ac8fa',
    cat: 'Education', steps: ['Open Notes', 'Enable Focus Mode', 'Start 25-min Timer', 'Mute Notifications'],
  },
  {
    id: 'g-dev', name: 'Developer Setup', glyph: '💻', color: '#30d158',
    cat: 'Developer', steps: ['Open Terminal', 'Open Notes', 'Enable Do Not Disturb', 'Show Reminder'],
  },
  {
    id: 'g-sleep', name: 'Bedtime Routine', glyph: '🌙', color: '#5e5ce6',
    cat: 'Featured', steps: ['Enable Do Not Disturb', 'Lower Brightness', 'Set Morning Alarm', 'Close All Apps'],
  },
  {
    id: 'g-share', name: 'Share Location', glyph: '📍', color: '#ff3b30',
    cat: 'Location', steps: ['Get Current Location', 'Copy Coordinates', 'Open Messages', 'Send Location'],
  },
];

/* ─── Action palette for the builder ─── */
const ACTION_PALETTE = [
  { id: 'a-notif',   label: 'Show Notification',   glyph: '🔔', color: '#ff9500' },
  { id: 'a-open',    label: 'Open App',             glyph: '🚀', color: '#0a84ff' },
  { id: 'a-wait',    label: 'Wait',                 glyph: '⏳', color: '#636366' },
  { id: 'a-alert',   label: 'Show Alert',           glyph: '⚠️', color: '#ff3b30' },
  { id: 'a-text',    label: 'Get Text Input',       glyph: '⌨️', color: '#30d158' },
  { id: 'a-url',     label: 'Open URL',             glyph: '🌐', color: '#5ac8fa' },
  { id: 'a-timer',   label: 'Set Timer',            glyph: '⏱️', color: '#ff9f0a' },
  { id: 'a-copy',    label: 'Copy to Clipboard',    glyph: '📋', color: '#bf5af2' },
  { id: 'a-volume',  label: 'Set Volume',           glyph: '🔊', color: '#ff6961' },
  { id: 'a-weather', label: 'Get Weather',          glyph: '🌤️', color: '#5e5ce6' },
  { id: 'a-photo',   label: 'Take Screenshot',      glyph: '📸', color: '#ff375f' },
  { id: 'a-file',    label: 'Save File',            glyph: '💾', color: '#34c759' },
];

const CATEGORIES = ['All', 'Featured', 'Productivity', 'Media', 'Education', 'Developer', 'Location'];

/* ─── Helpers ─── */
function makeEl(cls, tag = 'div') {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function uid() {
  return 'sc-' + Math.random().toString(36).slice(2, 8);
}

export function content(win, api) {
  /* ── Load persisted shortcuts ── */
  let myShortcuts = api.load('myShortcuts', []);

  /* ── Root layout ── */
  const root = makeEl('sc-root');

  /* ── Sidebar ── */
  const sidebar = makeEl('sc-sidebar');
  const sidebarHeader = makeEl('sc-sidebar-header');
  sidebarHeader.innerHTML = '<span class="sc-sidebar-logo">⚡</span><span>Shortcuts</span>';
  sidebar.append(sidebarHeader);

  const navItems = [
    { id: 'gallery',  label: 'Gallery',      glyph: '🏪' },
    { id: 'mine',     label: 'My Shortcuts',  glyph: '⚡' },
    { id: 'all',      label: 'All Shortcuts', glyph: '📋' },
  ];

  let activeNavId = 'gallery';

  navItems.forEach(({ id, label, glyph }) => {
    const item = makeEl('sc-nav-item' + (id === activeNavId ? ' active' : ''));
    item.dataset.nav = id;
    item.innerHTML = `<span class="sc-nav-glyph">${glyph}</span><span>${label}</span>`;
    item.addEventListener('click', () => {
      sidebar.querySelectorAll('.sc-nav-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      activeNavId = id;
      renderMain(id);
    });
    sidebar.append(item);
  });

  /* Divider + New Shortcut button */
  const divider = makeEl('sc-sidebar-divider');
  sidebar.append(divider);

  const newBtn = makeEl('sc-new-btn', 'button');
  newBtn.innerHTML = '<span class="sc-plus">+</span> New Shortcut';
  newBtn.addEventListener('click', openBuilder);
  sidebar.append(newBtn);

  /* ── Main area ── */
  const main = makeEl('sc-main');

  root.append(sidebar, main);

  /* ══════════════════════════════════════════════
     RENDER MAIN CONTENT
  ══════════════════════════════════════════════ */
  function renderMain(view) {
    main.innerHTML = '';
    if (view === 'gallery') renderGallery();
    else if (view === 'mine') renderMine();
    else renderAll();
  }

  /* ── Gallery view ── */
  function renderGallery() {
    let filterCat = 'All';

    const header = makeEl('sc-content-header');
    header.innerHTML = '<h1>Gallery</h1><p>Explore prebuilt shortcuts to power up your day.</p>';
    main.append(header);

    /* Category filter chips */
    const chips = makeEl('sc-chips');
    CATEGORIES.forEach((cat) => {
      const chip = makeEl('sc-chip' + (cat === filterCat ? ' active' : ''), 'button');
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        filterCat = cat;
        chips.querySelectorAll('.sc-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        renderGrid(cat);
      });
      chips.append(chip);
    });
    main.append(chips);

    const grid = makeEl('sc-gallery-grid');
    main.append(grid);

    function renderGrid(cat) {
      grid.innerHTML = '';
      const filtered = cat === 'All' ? GALLERY : GALLERY.filter((s) => s.cat === cat);
      filtered.forEach((sc) => {
        const card = makeEl('sc-gallery-card');
        card.style.setProperty('--sc-card-color', sc.color);
        card.innerHTML = `
          <div class="sc-card-icon" style="background:${sc.color}">${sc.glyph}</div>
          <div class="sc-card-body">
            <div class="sc-card-name">${sc.name}</div>
            <div class="sc-card-cat">${sc.cat}</div>
          </div>
          <button class="sc-card-add" title="Add to My Shortcuts">+</button>
        `;
        card.querySelector('.sc-card-add').addEventListener('click', (e) => {
          e.stopPropagation();
          addFromGallery(sc);
        });
        card.addEventListener('click', () => previewShortcut(sc));
        grid.append(card);
      });
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="sc-empty">No shortcuts in this category.</div>';
      }
    }

    renderGrid(filterCat);
  }

  /* ── My Shortcuts view ── */
  function renderMine() {
    const header = makeEl('sc-content-header');
    header.innerHTML = '<h1>My Shortcuts</h1><p>Your personal collection of shortcuts.</p>';
    main.append(header);

    if (myShortcuts.length === 0) {
      const empty = makeEl('sc-empty-state');
      empty.innerHTML = `
        <div class="sc-empty-glyph">⚡</div>
        <div class="sc-empty-title">No Shortcuts Yet</div>
        <div class="sc-empty-sub">Add shortcuts from the Gallery or create your own.</div>
        <button class="sc-empty-btn">Create Shortcut</button>
      `;
      empty.querySelector('.sc-empty-btn').addEventListener('click', openBuilder);
      main.append(empty);
      return;
    }

    const grid = makeEl('sc-mine-grid');
    myShortcuts.forEach((sc, idx) => renderMineCard(grid, sc, idx));
    main.append(grid);
  }

  function renderMineCard(grid, sc, idx) {
    const card = makeEl('sc-mine-card');
    card.style.setProperty('--sc-card-color', sc.color || '#636366');
    card.innerHTML = `
      <div class="sc-mine-icon" style="background:${sc.color || '#636366'}">${sc.glyph || '⚡'}</div>
      <div class="sc-mine-name">${sc.name}</div>
      <div class="sc-mine-steps">${(sc.steps || []).length} steps</div>
      <div class="sc-mine-actions">
        <button class="sc-run-btn" title="Run">▶</button>
        <button class="sc-del-btn" title="Delete">🗑️</button>
      </div>
    `;
    card.querySelector('.sc-run-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      runShortcut(sc);
    });
    card.querySelector('.sc-del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteShortcut(idx);
    });
    card.addEventListener('click', () => previewShortcut(sc));
    grid.append(card);
  }

  /* ── All Shortcuts view ── */
  function renderAll() {
    const header = makeEl('sc-content-header');
    header.innerHTML = '<h1>All Shortcuts</h1><p>Gallery and your custom shortcuts in one place.</p>';
    main.append(header);

    const combined = [...GALLERY, ...myShortcuts];
    const grid = makeEl('sc-gallery-grid');
    combined.forEach((sc) => {
      const card = makeEl('sc-gallery-card');
      card.style.setProperty('--sc-card-color', sc.color || '#636366');
      card.innerHTML = `
        <div class="sc-card-icon" style="background:${sc.color || '#636366'}">${sc.glyph || '⚡'}</div>
        <div class="sc-card-body">
          <div class="sc-card-name">${sc.name}</div>
          <div class="sc-card-cat">${sc.cat || 'Custom'}</div>
        </div>
        <button class="sc-run-btn-sm" title="Run">▶</button>
      `;
      card.querySelector('.sc-run-btn-sm').addEventListener('click', (e) => {
        e.stopPropagation();
        runShortcut(sc);
      });
      card.addEventListener('click', () => previewShortcut(sc));
      grid.append(card);
    });
    main.append(grid);
  }

  /* ══════════════════════════════════════════════
     SHORTCUT RUNNER — animated steps
  ══════════════════════════════════════════════ */
  function runShortcut(sc) {
    const steps = sc.steps || [];
    if (steps.length === 0) {
      api.toast(`${sc.glyph || '⚡'} ${sc.name}: No steps to run.`);
      return;
    }

    /* Build runner overlay */
    const overlay = makeEl('sc-runner-overlay');
    overlay.innerHTML = `
      <div class="sc-runner">
        <div class="sc-runner-header">
          <div class="sc-runner-icon" style="background:${sc.color || '#636366'}">${sc.glyph || '⚡'}</div>
          <div class="sc-runner-title">${sc.name}</div>
        </div>
        <div class="sc-runner-steps" id="sc-runner-steps"></div>
        <div class="sc-runner-progress">
          <div class="sc-runner-bar" id="sc-runner-bar"></div>
        </div>
        <button class="sc-runner-close" id="sc-runner-close">Done</button>
      </div>
    `;
    root.append(overlay);

    const stepsEl = overlay.querySelector('#sc-runner-steps');
    const bar = overlay.querySelector('#sc-runner-bar');
    const closeBtn = overlay.querySelector('#sc-runner-close');
    closeBtn.style.display = 'none';

    /* Animate steps one by one */
    let i = 0;
    function nextStep() {
      if (i >= steps.length) {
        bar.style.width = '100%';
        closeBtn.style.display = '';
        api.toast(`⚡ "${sc.name}" completed!`);
        return;
      }
      const stepEl = makeEl('sc-runner-step');
      stepEl.innerHTML = `<span class="sc-step-spinner"></span><span class="sc-step-label">${steps[i]}</span>`;
      stepsEl.append(stepEl);
      stepsEl.scrollTop = stepsEl.scrollHeight;

      /* Animate: spinner → check */
      setTimeout(() => {
        stepEl.classList.add('done');
        stepEl.querySelector('.sc-step-spinner').textContent = '✓';
        i++;
        bar.style.width = Math.round((i / steps.length) * 100) + '%';
        setTimeout(nextStep, 300);
      }, 650);
    }
    nextStep();

    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ══════════════════════════════════════════════
     PREVIEW PANEL (slide-in detail sheet)
  ══════════════════════════════════════════════ */
  function previewShortcut(sc) {
    /* Remove any existing preview */
    root.querySelector('.sc-preview-panel')?.remove();

    const panel = makeEl('sc-preview-panel');
    const alreadyMine = myShortcuts.some((m) => m.id === sc.id) ||
                        GALLERY.some((g) => g.id === sc.id && myShortcuts.some((m) => m.name === sc.name));
    const isGallery = GALLERY.some((g) => g.id === sc.id);
    const isCustomMine = myShortcuts.some((m) => m.id === sc.id && !GALLERY.some((g) => g.id === m.id));

    panel.innerHTML = `
      <div class="sc-preview-top">
        <div class="sc-preview-icon" style="background:${sc.color || '#636366'}">${sc.glyph || '⚡'}</div>
        <div class="sc-preview-info">
          <div class="sc-preview-name">${sc.name}</div>
          <div class="sc-preview-cat">${sc.cat || 'Custom'} · ${(sc.steps || []).length} steps</div>
        </div>
        <button class="sc-preview-close">×</button>
      </div>
      <div class="sc-preview-steps-title">Steps</div>
      <ol class="sc-preview-steps-list">
        ${(sc.steps || []).map((s, i) => `<li><span class="sc-step-num">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
      <div class="sc-preview-btns">
        <button class="sc-preview-run">▶ Run</button>
        ${isGallery && !isCustomMine ? `<button class="sc-preview-addmine">Add to My Shortcuts</button>` : ''}
      </div>
    `;
    panel.querySelector('.sc-preview-close').addEventListener('click', () => panel.remove());
    panel.querySelector('.sc-preview-run').addEventListener('click', () => {
      panel.remove();
      runShortcut(sc);
    });
    const addBtn = panel.querySelector('.sc-preview-addmine');
    if (addBtn) addBtn.addEventListener('click', () => {
      addFromGallery(sc);
      panel.remove();
    });

    root.append(panel);
    /* Trigger slide animation */
    requestAnimationFrame(() => panel.classList.add('open'));
  }

  /* ══════════════════════════════════════════════
     BUILDER MODAL — drag-drop action palette
  ══════════════════════════════════════════════ */
  function openBuilder(prefill) {
    root.querySelector('.sc-builder-overlay')?.remove();

    let builderSteps = prefill ? [...(prefill.steps || [])] : [];
    let dragSrcIdx = null;

    const overlay = makeEl('sc-builder-overlay');
    overlay.innerHTML = `
      <div class="sc-builder">
        <div class="sc-builder-header">
          <span class="sc-builder-title">New Shortcut</span>
          <button class="sc-builder-close">×</button>
        </div>

        <div class="sc-builder-body">
          <!-- Left: palette -->
          <div class="sc-palette">
            <div class="sc-palette-title">Actions</div>
            <div class="sc-palette-list" id="sc-palette-list"></div>
          </div>

          <!-- Right: editor -->
          <div class="sc-editor">
            <div class="sc-editor-top">
              <label class="sc-field-label">Name</label>
              <input class="sc-name-input" id="sc-name-input" type="text" placeholder="My Shortcut" maxlength="60" />
            </div>

            <div class="sc-editor-top" style="margin-top:10px">
              <label class="sc-field-label">Icon &amp; Color</label>
              <div class="sc-icon-row" id="sc-icon-row">
                ${['⚡','🚀','🎯','💡','🌟','🔥','🎵','📱','💻','🌈'].map((g) =>
                  `<button class="sc-glyph-btn" data-glyph="${g}">${g}</button>`
                ).join('')}
              </div>
              <div class="sc-color-row" id="sc-color-row">
                ${['#ff9500','#0a84ff','#ff375f','#34c759','#bf5af2','#ff6961','#5ac8fa','#30d158','#5e5ce6','#636366'].map((c) =>
                  `<button class="sc-color-btn" data-color="${c}" style="background:${c}"></button>`
                ).join('')}
              </div>
            </div>

            <div class="sc-editor-steps-label">Steps <span class="sc-steps-count" id="sc-steps-count">0</span></div>
            <div class="sc-editor-steps" id="sc-editor-steps">
              <div class="sc-steps-placeholder" id="sc-steps-ph">Drag actions here or click + to add</div>
            </div>
          </div>
        </div>

        <div class="sc-builder-footer">
          <button class="sc-builder-cancel">Cancel</button>
          <button class="sc-builder-save">Save Shortcut</button>
        </div>
      </div>
    `;

    /* State */
    let selectedGlyph = '⚡';
    let selectedColor = '#ff9500';

    /* Glyph / color selection */
    overlay.querySelectorAll('.sc-glyph-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.sc-glyph-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGlyph = btn.dataset.glyph;
      });
    });
    /* Default selections */
    overlay.querySelector('[data-glyph="⚡"]').classList.add('active');
    overlay.querySelector('[data-color="#ff9500"]').classList.add('active');

    overlay.querySelectorAll('.sc-color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.sc-color-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    /* Palette — click to add action */
    const paletteList = overlay.querySelector('#sc-palette-list');
    ACTION_PALETTE.forEach((action) => {
      const item = makeEl('sc-palette-item', 'button');
      item.setAttribute('draggable', 'true');
      item.dataset.actionId = action.id;
      item.innerHTML = `<span class="sc-pal-icon" style="background:${action.color}">${action.glyph}</span><span class="sc-pal-label">${action.label}</span><span class="sc-pal-add">+</span>`;
      item.addEventListener('click', () => addStep(action.label));
      /* drag from palette */
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/action-label', action.label);
        e.dataTransfer.effectAllowed = 'copy';
        dragSrcIdx = null;
      });
      paletteList.append(item);
    });

    /* Steps area */
    const stepsEl = overlay.querySelector('#sc-editor-steps');
    const stepsCountEl = overlay.querySelector('#sc-steps-count');
    const stepsPlaceholder = overlay.querySelector('#sc-steps-ph');

    /* Populate if prefilled */
    if (builderSteps.length) refreshStepsUI();

    function addStep(label) {
      builderSteps.push(label);
      refreshStepsUI();
    }

    function removeStep(idx) {
      builderSteps.splice(idx, 1);
      refreshStepsUI();
    }

    function moveStep(from, to) {
      if (from === to || to < 0 || to >= builderSteps.length) return;
      const [item] = builderSteps.splice(from, 1);
      builderSteps.splice(to, 0, item);
      refreshStepsUI();
    }

    function refreshStepsUI() {
      /* Remove all step rows, keep placeholder */
      Array.from(stepsEl.querySelectorAll('.sc-step-row')).forEach((r) => r.remove());
      stepsPlaceholder.style.display = builderSteps.length ? 'none' : '';
      stepsCountEl.textContent = builderSteps.length;

      builderSteps.forEach((label, idx) => {
        const row = makeEl('sc-step-row');
        row.setAttribute('draggable', 'true');
        row.dataset.idx = idx;
        row.innerHTML = `
          <span class="sc-step-drag">⠿</span>
          <span class="sc-step-num-badge">${idx + 1}</span>
          <span class="sc-step-text">${label}</span>
          <span class="sc-step-remove" data-idx="${idx}">×</span>
        `;
        row.querySelector('.sc-step-remove').addEventListener('click', () => removeStep(idx));

        /* Drag-to-reorder */
        row.addEventListener('dragstart', (e) => {
          dragSrcIdx = idx;
          e.dataTransfer.effectAllowed = 'move';
          row.classList.add('dragging');
        });
        row.addEventListener('dragend', () => row.classList.remove('dragging'));
        row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drag-over'); });
        row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
        row.addEventListener('drop', (e) => {
          e.preventDefault();
          row.classList.remove('drag-over');
          const toIdx = parseInt(row.dataset.idx);
          if (dragSrcIdx !== null) {
            moveStep(dragSrcIdx, toIdx);
          } else {
            /* Dropped from palette */
            const label = e.dataTransfer.getData('text/action-label');
            if (label) { builderSteps.splice(toIdx, 0, label); refreshStepsUI(); }
          }
          dragSrcIdx = null;
        });

        stepsEl.append(row);
      });
    }

    /* Drop on steps area (when empty or end of list) */
    stepsEl.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = dragSrcIdx !== null ? 'move' : 'copy'; });
    stepsEl.addEventListener('drop', (e) => {
      e.preventDefault();
      /* Only handle drops that didn't land on a step-row */
      if (e.target.closest('.sc-step-row')) return;
      if (dragSrcIdx !== null) return; /* reorder handled by step row */
      const label = e.dataTransfer.getData('text/action-label');
      if (label) addStep(label);
    });

    /* Save */
    overlay.querySelector('.sc-builder-save').addEventListener('click', () => {
      const nameInput = overlay.querySelector('#sc-name-input');
      const name = (nameInput.value || '').trim() || 'My Shortcut';
      if (builderSteps.length === 0) {
        api.toast('Add at least one action to your shortcut.');
        return;
      }
      const newSc = {
        id: uid(),
        name,
        glyph: selectedGlyph,
        color: selectedColor,
        cat: 'Custom',
        steps: [...builderSteps],
      };
      myShortcuts.push(newSc);
      api.store('myShortcuts', myShortcuts);
      overlay.remove();
      api.toast(`⚡ "${name}" saved to My Shortcuts!`);
      /* Refresh view */
      renderMain(activeNavId);
    });

    /* Cancel / close */
    overlay.querySelector('.sc-builder-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('.sc-builder-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    root.append(overlay);
  }

  /* ══════════════════════════════════════════════
     UTILITY ACTIONS
  ══════════════════════════════════════════════ */
  function addFromGallery(sc) {
    const already = myShortcuts.some((m) => m.id === sc.id);
    if (already) {
      api.toast(`"${sc.name}" is already in My Shortcuts.`);
      return;
    }
    const copy = { ...sc, id: uid(), cat: sc.cat || 'Gallery' };
    myShortcuts.push(copy);
    api.store('myShortcuts', myShortcuts);
    api.toast(`⚡ "${sc.name}" added to My Shortcuts!`);
    /* If we are on "mine" view, refresh */
    if (activeNavId === 'mine') renderMain('mine');
  }

  function deleteShortcut(idx) {
    const sc = myShortcuts[idx];
    myShortcuts.splice(idx, 1);
    api.store('myShortcuts', myShortcuts);
    api.toast(`"${sc?.name || 'Shortcut'}" deleted.`);
    renderMain(activeNavId);
  }

  /* ── Initial render ── */
  renderMain(activeNavId);

  return root;
}
