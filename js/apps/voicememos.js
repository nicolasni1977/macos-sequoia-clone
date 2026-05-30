// js/apps/voicememos.js — Voice Memos app
// Recordings list, animated waveform while recording, playback, rename, delete, trim, transcribe.
import { el, setHTML } from '../dom.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function makeId() {
  return 'vm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Default seed memos shown on first launch
const SEED_MEMOS = [
  { id: 'vm_seed1', name: 'Ideas for project', duration: 142, ts: Date.now() - 86400000 * 3 },
  { id: 'vm_seed2', name: 'Meeting notes', duration: 328, ts: Date.now() - 86400000 * 7 },
  { id: 'vm_seed3', name: 'Grocery reminder', duration: 47, ts: Date.now() - 86400000 * 14 },
];

// ─── main export ────────────────────────────────────────────────────────────

export function content(win, api) {
  // ── state ──────────────────────────────────────────────────────────────────
  let memos = api.load('memos', null);
  if (!memos) {
    memos = JSON.parse(JSON.stringify(SEED_MEMOS));
    api.store('memos', memos);
  }

  let selectedId = memos.length > 0 ? memos[0].id : null;
  let isRecording = false;
  let recordSecs = 0;
  let recordTimer = null;
  let isPlaying = false;
  let playSecs = 0;
  let playTimer = null;
  let waveAnimId = null;
  let wavePhase = 0;

  // ── root layout ────────────────────────────────────────────────────────────
  const root = el('vm-root');

  // left panel: list
  const sidebar = el('vm-sidebar');
  const sidebarHeader = el('vm-sidebar-header');
  const sidebarTitle = el('vm-sidebar-title');
  sidebarTitle.textContent = 'Voice Memos';
  const searchBox = el('vm-search-box');
  searchBox.innerHTML = '<span class="vm-search-ic">🔍</span><input class="vm-search-input" placeholder="Search" />';
  sidebarHeader.append(sidebarTitle, searchBox);
  const memoList = el('vm-list');
  sidebar.append(sidebarHeader, memoList);

  // right panel: detail / record
  const detail = el('vm-detail');

  root.append(sidebar, detail);

  // ── detail regions ─────────────────────────────────────────────────────────
  const detailEmpty = el('vm-detail-empty');
  detailEmpty.innerHTML = '<div class="vm-big-mic">🎙️</div><div class="vm-empty-hint">Select a recording or tap the record button to start.</div>';

  const detailView = el('vm-detail-view');

  // record area (always at bottom of detail)
  const recordArea = el('vm-record-area');
  const waveCanvas = el('vm-wave-canvas', 'canvas');
  waveCanvas.width = 300;
  waveCanvas.height = 56;
  const timerDisplay = el('vm-timer');
  timerDisplay.textContent = '00:00';
  const recordBtn = el('vm-record-btn', 'button');
  recordBtn.innerHTML = '<span class="vm-rec-icon"></span>';
  const recordLabel = el('vm-record-label');
  recordLabel.textContent = 'Record';
  recordArea.append(waveCanvas, timerDisplay, recordBtn, recordLabel);

  detail.append(detailEmpty, detailView, recordArea);

  // detail view internals
  const dvTitle = el('vm-dv-title');
  const dvMeta = el('vm-dv-meta');
  const dvWaveform = el('vm-dv-waveform');
  const dvProgress = el('vm-dv-progress');
  const dvProgressTrack = el('vm-dv-progress-track');
  const dvProgressFill = el('vm-dv-progress-fill');
  const dvProgressThumb = el('vm-dv-progress-thumb');
  dvProgressTrack.append(dvProgressFill, dvProgressThumb);
  dvProgress.append(dvProgressTrack);
  const dvTime = el('vm-dv-time');
  const dvControls = el('vm-dv-controls');
  const dvPlayBtn = el('vm-play-btn', 'button');
  dvPlayBtn.innerHTML = '▶';
  const dvSkipBack = el('vm-skip-btn', 'button');
  dvSkipBack.innerHTML = '↺<sub>15</sub>';
  dvSkipBack.title = 'Rewind 15s';
  const dvSkipFwd = el('vm-skip-btn', 'button');
  dvSkipFwd.innerHTML = '↻<sub>15</sub>';
  dvSkipFwd.title = 'Forward 15s';
  dvControls.append(dvSkipBack, dvPlayBtn, dvSkipFwd);

  const dvActions = el('vm-dv-actions');
  const btnRename = el('vm-action-btn', 'button');
  btnRename.innerHTML = '✏️ Rename';
  const btnTrim = el('vm-action-btn', 'button');
  btnTrim.innerHTML = '✂️ Trim';
  const btnTranscribe = el('vm-action-btn', 'button');
  btnTranscribe.innerHTML = '📝 Transcribe';
  const btnDelete = el('vm-action-btn vm-action-danger', 'button');
  btnDelete.innerHTML = '🗑️ Delete';
  dvActions.append(btnRename, btnTrim, btnTranscribe, btnDelete);

  const dvTranscriptArea = el('vm-transcript-area');
  dvTranscriptArea.style.display = 'none';

  detailView.append(dvTitle, dvMeta, dvWaveform, dvProgress, dvTime, dvControls, dvActions, dvTranscriptArea);

  // ── waveform bars (static decorative, unique per memo) ─────────────────────
  function buildStaticWaveform(seed) {
    dvWaveform.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const bar = el('vm-wbar');
      const h = 20 + Math.abs(Math.sin(i * 0.7 + seed) * 28) + Math.abs(Math.sin(i * 1.3 + seed * 0.5) * 12);
      bar.style.height = h + 'px';
      dvWaveform.append(bar);
    }
  }

  // ── list rendering ─────────────────────────────────────────────────────────
  let searchFilter = '';

  function renderList() {
    memoList.innerHTML = '';
    const q = searchFilter.toLowerCase();
    const filtered = memos.filter((m) => m.name.toLowerCase().includes(q));
    if (filtered.length === 0) {
      const empty = el('vm-list-empty');
      empty.textContent = q ? 'No results.' : 'No recordings yet.';
      memoList.append(empty);
      return;
    }
    filtered.forEach((memo) => {
      const item = el('vm-list-item' + (memo.id === selectedId ? ' active' : ''));
      const nameEl = el('vm-item-name');
      nameEl.textContent = memo.name;
      const metaEl = el('vm-item-meta');
      metaEl.textContent = fmtDate(memo.ts) + ' · ' + fmtDuration(memo.duration);
      item.append(nameEl, metaEl);
      item.addEventListener('click', () => {
        selectedId = memo.id;
        stopPlayback();
        renderList();
        showDetail(memo);
      });
      memoList.append(item);
    });
  }

  // ── detail panel ───────────────────────────────────────────────────────────
  function showDetail(memo) {
    if (!memo) {
      detailEmpty.style.display = 'flex';
      detailView.style.display = 'none';
      return;
    }
    detailEmpty.style.display = 'none';
    detailView.style.display = 'flex';
    dvTitle.textContent = memo.name;
    dvMeta.textContent = new Date(memo.ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + ' · ' + fmtDuration(memo.duration);
    buildStaticWaveform(memo.id.charCodeAt(3) || 1);
    updatePlayUI(0, memo.duration);
    dvTranscriptArea.style.display = 'none';
    dvTranscriptArea.textContent = '';
    dvPlayBtn.innerHTML = '▶';
  }

  function updatePlayUI(secs, total) {
    const pct = total > 0 ? Math.min(secs / total, 1) : 0;
    dvProgressFill.style.width = (pct * 100) + '%';
    dvProgressThumb.style.left = (pct * 100) + '%';
    const remaining = Math.max(0, total - secs);
    dvTime.textContent = fmtDuration(secs) + ' / −' + fmtDuration(remaining);
    // tint played waveform bars
    const bars = dvWaveform.querySelectorAll('.vm-wbar');
    const cutoff = Math.floor(pct * bars.length);
    bars.forEach((b, i) => b.classList.toggle('played', i < cutoff));
  }

  // ── playback ───────────────────────────────────────────────────────────────
  function stopPlayback() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    isPlaying = false;
    dvPlayBtn.innerHTML = '▶';
    const memo = memos.find((m) => m.id === selectedId);
    if (memo) updatePlayUI(playSecs, memo.duration);
  }

  function startPlayback() {
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    isPlaying = true;
    dvPlayBtn.innerHTML = '⏸';
    playTimer = setInterval(() => {
      playSecs += 0.25;
      if (playSecs >= memo.duration) {
        playSecs = 0;
        stopPlayback();
        return;
      }
      updatePlayUI(playSecs, memo.duration);
    }, 250);
  }

  dvPlayBtn.addEventListener('click', () => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  });

  dvSkipBack.addEventListener('click', () => {
    playSecs = Math.max(0, playSecs - 15);
    const memo = memos.find((m) => m.id === selectedId);
    if (memo) updatePlayUI(playSecs, memo.duration);
  });

  dvSkipFwd.addEventListener('click', () => {
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    playSecs = Math.min(memo.duration, playSecs + 15);
    updatePlayUI(playSecs, memo.duration);
  });

  // progress bar scrub
  dvProgressTrack.addEventListener('click', (e) => {
    const rect = dvProgressTrack.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    playSecs = pct * memo.duration;
    updatePlayUI(playSecs, memo.duration);
  });

  // ── recording ──────────────────────────────────────────────────────────────
  const ctx = waveCanvas.getContext('2d');

  function drawWave() {
    const W = waveCanvas.width;
    const H = waveCanvas.height;
    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, W, H);

    const bars = 40;
    const barW = 4;
    const gap = (W - bars * barW) / (bars + 1);
    ctx.fillStyle = '#ff3b30';

    for (let i = 0; i < bars; i++) {
      // multi-frequency animated wave
      const t = wavePhase + i * 0.35;
      const amp = (Math.sin(t) * 0.5 + Math.sin(t * 2.3 + 1) * 0.3 + Math.sin(t * 0.7 + 2) * 0.2);
      const h = Math.max(4, Math.abs(amp) * (H * 0.75) + 4);
      const x = gap + i * (barW + gap);
      const y = (H - h) / 2;
      const r = Math.min(2, barW / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + h - r);
      ctx.quadraticCurveTo(x + barW, y + h, x + barW - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    }

    wavePhase += 0.18;
    waveAnimId = requestAnimationFrame(drawWave);
  }

  function stopWaveAnim() {
    if (waveAnimId) { cancelAnimationFrame(waveAnimId); waveAnimId = null; }
    ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
  }

  recordBtn.addEventListener('click', () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  });

  function startRecording() {
    stopPlayback();
    isRecording = true;
    recordSecs = 0;
    recordBtn.classList.add('recording');
    recordLabel.textContent = 'Tap to Stop';
    timerDisplay.textContent = '00:00';
    waveCanvas.style.display = 'block';
    wavePhase = 0;
    drawWave();
    recordTimer = setInterval(() => {
      recordSecs++;
      timerDisplay.textContent = fmtDuration(recordSecs);
    }, 1000);
  }

  function stopRecording() {
    if (!isRecording) return;
    clearInterval(recordTimer); recordTimer = null;
    isRecording = false;
    stopWaveAnim();
    recordBtn.classList.remove('recording');
    recordLabel.textContent = 'Record';
    waveCanvas.style.display = 'none';

    // create memo
    const now = Date.now();
    const defaultName = 'New Recording ' + new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const memo = { id: makeId(), name: defaultName, duration: Math.max(1, recordSecs), ts: now };
    memos.unshift(memo);
    api.store('memos', memos);
    selectedId = memo.id;
    playSecs = 0;
    renderList();
    showDetail(memo);
    api.toast('Recording saved: ' + defaultName);
  }

  // ── actions ────────────────────────────────────────────────────────────────
  btnRename.addEventListener('click', () => {
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    const newName = prompt('Rename recording:', memo.name);
    if (!newName || !newName.trim()) return;
    memo.name = newName.trim();
    api.store('memos', memos);
    renderList();
    dvTitle.textContent = memo.name;
    api.toast('Renamed to "' + memo.name + '"');
  });

  btnTrim.addEventListener('click', () => {
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    // cosmetic: show a fake trim dialog via toast + shorten duration a bit
    const trimSecs = Math.max(5, Math.floor(memo.duration * 0.8));
    if (memo.duration <= 5) { api.toast('Recording too short to trim.'); return; }
    memo.duration = trimSecs;
    api.store('memos', memos);
    stopPlayback();
    playSecs = 0;
    renderList();
    showDetail(memo);
    api.toast('Trimmed to ' + fmtDuration(trimSecs));
  });

  btnTranscribe.addEventListener('click', () => {
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    btnTranscribe.disabled = true;
    btnTranscribe.textContent = '⏳ Transcribing…';
    const fakeTexts = [
      'Hey, just a quick note. I wanted to remember to pick up coffee on the way home. Also, the design review is on Thursday — don\'t forget to bring the mockups.',
      'Meeting notes: discussed the Q3 roadmap. Action items — ship the new onboarding flow by end of month. Follow up with the design team about the icon refresh.',
      'Grocery list: milk, eggs, sourdough bread, avocados, olive oil, and those fancy crackers from the farmers\' market.',
      'Ideas: what if we made the dock magnification feel even more spring-like? Could try a higher stiffness value. Also the blur behind windows needs a second pass.',
    ];
    const text = fakeTexts[memo.id.charCodeAt(4) % fakeTexts.length];
    setTimeout(() => {
      dvTranscriptArea.style.display = 'block';
      dvTranscriptArea.textContent = text;
      btnTranscribe.disabled = false;
      btnTranscribe.textContent = '📝 Transcribe';
      api.toast('Transcription complete');
    }, 1800);
  });

  btnDelete.addEventListener('click', () => {
    const memo = memos.find((m) => m.id === selectedId);
    if (!memo) return;
    if (!confirm('Delete "' + memo.name + '"?')) return;
    stopPlayback();
    memos = memos.filter((m) => m.id !== selectedId);
    api.store('memos', memos);
    selectedId = memos.length > 0 ? memos[0].id : null;
    playSecs = 0;
    renderList();
    if (selectedId) showDetail(memos[0]);
    else showDetail(null);
    api.toast('Recording deleted.');
  });

  // ── search ─────────────────────────────────────────────────────────────────
  searchBox.querySelector('.vm-search-input').addEventListener('input', (e) => {
    searchFilter = e.target.value;
    renderList();
  });

  // ── initial render ─────────────────────────────────────────────────────────
  waveCanvas.style.display = 'none';
  renderList();
  const initialMemo = memos.find((m) => m.id === selectedId);
  showDetail(initialMemo || null);

  // cleanup on window close (best-effort, via MutationObserver on body)
  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      stopPlayback();
      stopWaveAnim();
      if (recordTimer) { clearInterval(recordTimer); }
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return root;
}
