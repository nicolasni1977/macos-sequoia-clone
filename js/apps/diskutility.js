// js/apps/diskutility.js — Disk Utility: volumes, capacity bars, animated First Aid.
import { el, setHTML } from '../dom.js';

const SEG_COLORS = { System: '#8e8e93', Apps: '#0a84ff', Documents: '#ff9f0a', Photos: '#ff375f', Other: '#bf5af2', Free: '#e5e5ea' };

const DISKS = [
  {
    group: 'Internal', id: 'mac-hd', name: 'Macintosh HD', type: 'APFS Volume', mount: '/',
    connection: 'Apple Fabric', total: 994, smart: 'Verified',
    segs: [['System', 24], ['Apps', 86], ['Documents', 142], ['Photos', 63], ['Other', 38]],
  },
  {
    group: 'Internal', id: 'mac-data', name: 'Macintosh HD — Data', type: 'APFS Volume', mount: '/System/Volumes/Data',
    connection: 'Apple Fabric', total: 994, smart: 'Verified',
    segs: [['System', 4], ['Apps', 12], ['Documents', 410], ['Photos', 120], ['Other', 66]],
  },
  {
    group: 'External', id: 'backup', name: 'Time Capsule', type: 'APFS Volume', mount: '/Volumes/Backup',
    connection: 'USB‑C', total: 2000, smart: 'Verified',
    segs: [['Documents', 880], ['Photos', 410], ['Other', 120]],
  },
  {
    group: 'Disk Images', id: 'installer', name: 'Installer.dmg', type: 'Disk Image', mount: '—',
    connection: 'Disk Image', total: 12, smart: 'Not Supported',
    segs: [['Apps', 8]],
  },
];

const fmtGB = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' TB' : g + ' GB';

export function content(win, api) {
  const root = el('du-root');

  /* Toolbar */
  const toolbar = el('du-toolbar');
  const acts = [
    ['firstaid', '🩺', 'First Aid'], ['partition', '◐', 'Partition'],
    ['erase', '⌫', 'Erase'], ['restore', '↺', 'Restore'],
    ['mount', '⏏', 'Unmount'], ['info', 'ⓘ', 'Info'],
  ];
  acts.forEach(([id, ic, label]) => {
    const b = el('du-tb-btn', 'button');
    b.dataset.act = id;
    b.innerHTML = `<span class="du-tb-ic">${ic}</span><span class="du-tb-label">${label}</span>`;
    b.addEventListener('click', () => onAction(id));
    toolbar.append(b);
  });

  const body = el('du-body');
  const sidebar = el('du-sidebar');
  const main = el('du-main');
  body.append(sidebar, main);
  root.append(toolbar, body);

  let active = DISKS[0];

  /* Sidebar grouped by section */
  function buildSidebar() {
    sidebar.innerHTML = '';
    ['Internal', 'External', 'Disk Images'].forEach((group) => {
      const items = DISKS.filter((d) => d.group === group);
      if (!items.length) return;
      sidebar.append(setHTML('du-sb-group', group));
      items.forEach((d) => {
        const row = el('du-sb-item' + (d === active ? ' active' : ''));
        row.innerHTML = `<span class="du-sb-ic">${d.group === 'Disk Images' ? '💿' : d.group === 'External' ? '💾' : '🖴'}</span>
          <span class="du-sb-text"><span class="du-sb-name">${d.name}</span><span class="du-sb-cap">${fmtGB(d.total)}</span></span>`;
        row.addEventListener('click', () => { active = d; buildSidebar(); renderMain(); });
        sidebar.append(row);
      });
    });
  }

  function renderMain() {
    const d = active;
    const used = d.segs.reduce((s, [, g]) => s + g, 0);
    const free = Math.max(0, d.total - used);
    const segs = [...d.segs, ['Free', free]];

    main.innerHTML = `
      <div class="du-head">
        <div class="du-head-ic">${d.group === 'Disk Images' ? '💿' : '🖴'}</div>
        <div>
          <div class="du-head-name">${d.name}</div>
          <div class="du-head-sub">${d.type} · ${d.connection}</div>
        </div>
        <div class="du-head-usage">
          <div class="du-usage-num">${fmtGB(free)}</div>
          <div class="du-usage-lbl">free of ${fmtGB(d.total)}</div>
        </div>
      </div>
      <div class="du-bar"></div>
      <div class="du-legend"></div>
      <div class="du-info">
        <div class="du-info-card">
          <div class="du-info-row"><span>Mount Point</span><span>${d.mount}</span></div>
          <div class="du-info-row"><span>Type</span><span>${d.type}</span></div>
          <div class="du-info-row"><span>Capacity</span><span>${fmtGB(d.total)}</span></div>
          <div class="du-info-row"><span>Available</span><span>${fmtGB(free)}</span></div>
          <div class="du-info-row"><span>Used</span><span>${fmtGB(used)}</span></div>
          <div class="du-info-row"><span>Connection</span><span>${d.connection}</span></div>
          <div class="du-info-row"><span>S.M.A.R.T. Status</span><span class="${d.smart === 'Verified' ? 'du-ok' : ''}">${d.smart}</span></div>
        </div>
      </div>`;

    const bar = main.querySelector('.du-bar');
    const legend = main.querySelector('.du-legend');
    segs.forEach(([label, gb]) => {
      if (gb <= 0) return;
      const seg = el('du-seg');
      seg.style.width = (gb / d.total * 100) + '%';
      seg.style.background = SEG_COLORS[label] || '#ccc';
      seg.title = `${label}: ${fmtGB(gb)}`;
      bar.append(seg);
      const li = el('du-legend-item');
      li.innerHTML = `<span class="du-dot" style="background:${SEG_COLORS[label] || '#ccc'}"></span>
        <span class="du-leg-label">${label}</span><span class="du-leg-gb">${fmtGB(gb)}</span>`;
      legend.append(li);
    });
    // grow animation
    requestAnimationFrame(() => bar.classList.add('grown'));
  }

  function onAction(id) {
    if (id === 'firstaid') return runFirstAid();
    if (id === 'erase') return api.toast(`Erasing “${active.name}” is disabled in this clone.`);
    if (id === 'mount') return api.toast(`${active.name} unmounted (simulated)`);
    if (id === 'info') return api.quickLook({
      type: 'info', title: active.name, glyph: '🖴', name: active.name,
      rows: [['Type', active.type], ['Capacity', fmtGB(active.total)], ['Mount Point', active.mount], ['Connection', active.connection], ['S.M.A.R.T.', active.smart]],
    });
    api.toast(`${id[0].toUpperCase() + id.slice(1)}: not available in this clone.`);
  }

  function runFirstAid() {
    const overlay = el('du-modal-overlay');
    overlay.innerHTML = `
      <div class="du-modal">
        <div class="du-modal-head">🩺 Running First Aid on “${active.name}”</div>
        <div class="du-modal-log" id="du-log"></div>
        <div class="du-modal-bar"><div class="du-modal-fill" id="du-fill"></div></div>
        <div class="du-modal-foot"><button class="du-modal-btn" id="du-done" disabled>Done</button></div>
      </div>`;
    root.append(overlay);
    const log = overlay.querySelector('#du-log');
    const fill = overlay.querySelector('#du-fill');
    const done = overlay.querySelector('#du-done');
    const lines = [
      'Verifying file system…',
      'Checking volume bitmap…',
      'Checking extent allocations…',
      'Checking the object map…',
      'Checking snapshots…',
      'Verifying allocated space…',
      'The volume appears to be OK.',
    ];
    let i = 0;
    (function step() {
      if (i >= lines.length) {
        fill.style.width = '100%';
        log.insertAdjacentHTML('beforeend', `<div class="du-log-ok">✓ Operation successful.</div>`);
        log.scrollTop = log.scrollHeight;
        done.disabled = false;
        return;
      }
      log.insertAdjacentHTML('beforeend', `<div>${lines[i]}</div>`);
      log.scrollTop = log.scrollHeight;
      i++;
      fill.style.width = Math.round(i / lines.length * 100) + '%';
      setTimeout(step, 460);
    })();
    done.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay && !done.disabled) overlay.remove(); });
  }

  buildSidebar();
  renderMain();
  return root;
}
