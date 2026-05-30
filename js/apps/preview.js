// js/apps/preview.js — Preview: image & PDF viewer with Quick Look feel
// Follows the APP CONTRACT: export function content(win, api) { … return rootEl; }
import { el, setHTML } from '../dom.js';

/* ------------------------------------------------------------------ */
/*  Mock document catalogue                                             */
/* ------------------------------------------------------------------ */

const GRAD_PRESETS = [
  'linear-gradient(135deg,#ff9a9e,#fad0c4)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#84fab0,#8fd3f4)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f7971e,#ffd200)',
  'linear-gradient(135deg,#11998e,#38ef7d)',
];

// Mock PDF pages (rendered as styled HTML cards)
const PDF_PAGES = [
  {
    title: 'Annual Report 2025',
    body: `<h1 style="font-size:20px;font-weight:800;margin-bottom:12px">Annual Report 2025</h1>
<p style="margin-bottom:8px;line-height:1.6">This document summarises performance across all business units for the fiscal year ending December 2025. Revenue grew 18 % year-over-year, driven by strong demand in the cloud and productivity segments.</p>
<p style="margin-bottom:8px;line-height:1.6">Key achievements include the successful launch of three major product lines and the expansion into five new markets.</p>
<div style="margin:16px 0;padding:12px;background:rgba(10,132,255,0.08);border-left:3px solid #0a84ff;border-radius:4px">
  <strong>Revenue:</strong> $4.2 B &nbsp;|&nbsp; <strong>Growth:</strong> +18 % &nbsp;|&nbsp; <strong>Markets:</strong> 42
</div>
<p style="line-height:1.6">Management remains confident in the long-term trajectory and the continued investment in research and engineering capability.</p>`,
  },
  {
    title: 'Financial Highlights',
    body: `<h2 style="font-size:17px;font-weight:700;margin-bottom:14px">Financial Highlights — Q4 2025</h2>
<table style="width:100%;border-collapse:collapse;font-size:13px">
  <thead><tr>
    <th style="text-align:left;padding:6px 10px;border-bottom:1.5px solid #ddd">Metric</th>
    <th style="text-align:right;padding:6px 10px;border-bottom:1.5px solid #ddd">Q4 2025</th>
    <th style="text-align:right;padding:6px 10px;border-bottom:1.5px solid #ddd">Q4 2024</th>
    <th style="text-align:right;padding:6px 10px;border-bottom:1.5px solid #ddd">YoY</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:5px 10px;border-bottom:0.5px solid #eee">Total Revenue</td><td style="text-align:right;padding:5px 10px;border-bottom:0.5px solid #eee">$1.12 B</td><td style="text-align:right;padding:5px 10px;border-bottom:0.5px solid #eee">$0.95 B</td><td style="text-align:right;padding:5px 10px;border-bottom:0.5px solid #eee;color:#34c759">+18%</td></tr>
    <tr><td style="padding:5px 10px;border-bottom:0.5px solid #eee">Operating Income</td><td style="text-align:right;padding:5px 10px;border-bottom:0.5px solid #eee">$310 M</td><td style="text-align:right;padding:5px 10px;border-bottom:0.5px solid #eee">$260 M</td><td style="text-align:right;padding:5px 10px;border-bottom:0.5px solid #eee;color:#34c759">+19%</td></tr>
    <tr><td style="padding:5px 10px">Net Profit Margin</td><td style="text-align:right;padding:5px 10px">27.7%</td><td style="text-align:right;padding:5px 10px">27.4%</td><td style="text-align:right;padding:5px 10px;color:#34c759">+0.3 pp</td></tr>
  </tbody>
</table>`,
  },
  {
    title: 'Strategy & Outlook',
    body: `<h2 style="font-size:17px;font-weight:700;margin-bottom:12px">Strategic Priorities 2026</h2>
<ol style="padding-left:20px;line-height:2;font-size:13.5px">
  <li>Accelerate AI integration across the product suite</li>
  <li>Expand cloud infrastructure to APAC and EMEA regions</li>
  <li>Deepen partnerships with enterprise customers in finance and healthcare</li>
  <li>Grow the developer ecosystem by 40 % through tooling investments</li>
</ol>
<p style="margin-top:14px;line-height:1.6;font-size:13.5px">The board has approved a capital allocation of $800 M for research and acquisitions in 2026, with particular focus on machine learning infrastructure.</p>`,
  },
  {
    title: 'Risk Factors',
    body: `<h2 style="font-size:17px;font-weight:700;margin-bottom:12px">Risk Factors</h2>
<p style="margin-bottom:10px;line-height:1.6;font-size:13.5px">As with any forward-looking business, management identifies the following material risks:</p>
<ul style="padding-left:18px;line-height:2;font-size:13.5px">
  <li>Regulatory changes in key markets (EU AI Act, US export controls)</li>
  <li>Macroeconomic headwinds affecting enterprise software spend</li>
  <li>Cybersecurity threats and data-privacy compliance obligations</li>
  <li>Competition from large incumbents and well-funded start-ups</li>
</ul>`,
  },
];

// Image documents (gradient-based, no external assets)
const IMAGE_DOCS = [
  { name: 'Sunrise.heic',       grad: GRAD_PRESETS[0], label: '🌅' },
  { name: 'Abstract Art.png',   grad: GRAD_PRESETS[1], label: '🎨' },
  { name: 'Ocean View.jpg',     grad: GRAD_PRESETS[2], label: '🌊' },
  { name: 'Desert Dusk.heic',   grad: GRAD_PRESETS[3], label: '🌵' },
  { name: 'Mountain Lake.png',  grad: GRAD_PRESETS[4], label: '🏔️' },
  { name: 'Neon City.jpg',      grad: GRAD_PRESETS[5], label: '🌃' },
  { name: 'Aurora.heic',        grad: GRAD_PRESETS[6], label: '🌌' },
  { name: 'Spring Garden.png',  grad: GRAD_PRESETS[7], label: '🌸' },
  { name: 'Golden Hour.jpg',    grad: GRAD_PRESETS[8], label: '✨' },
  { name: 'Storm Clouds.heic',  grad: GRAD_PRESETS[9], label: '⛈️' },
];

const PDF_DOC = {
  name: 'Annual Report 2025.pdf',
  glyph: '📕',
  pages: PDF_PAGES,
};

// All sidebar items (images first, then the PDF)
const ALL_DOCS = [
  ...IMAGE_DOCS.map((d, i) => ({ type: 'image', ...d, idx: i })),
  { type: 'pdf', ...PDF_DOC, idx: 0 },
];

/* ------------------------------------------------------------------ */
/*  Main content factory                                                */
/* ------------------------------------------------------------------ */

export function content(win, api) {
  /* ---------- state ---------- */
  let activeDocIdx = 0;       // index into ALL_DOCS
  let zoomLevel    = 1.0;     // current zoom (0.25 – 4.0)
  let rotation     = 0;       // degrees, multiple of 90
  let pdfPage      = 0;       // 0-based page index for PDF docs
  let markupActive = false;   // whether markup toolbar is expanded
  let recentOpen   = api.load('recentOpen', []);   // array of doc names

  const ZOOM_STEP    = 0.25;
  const ZOOM_MIN     = 0.25;
  const ZOOM_MAX     = 4.0;

  /* ---------- root shell ---------- */
  const root = el('pv-root');

  /* ====== TOOLBAR ====== */
  const toolbar = el('pv-toolbar');

  // Left group: sidebar toggle + navigation arrows
  const tlLeft = el('pv-tl-group');
  const btnSidebarToggle = makeBtn('☰', 'Toggle sidebar', 'pv-tb-btn');
  const btnBack     = makeBtn('‹', 'Previous',   'pv-tb-btn pv-nav-btn');
  const btnForward  = makeBtn('›', 'Next',        'pv-tb-btn pv-nav-btn');
  tlLeft.append(btnSidebarToggle, btnBack, btnForward);

  // Center group: doc title
  const tlCenter = el('pv-tl-center');
  const docTitle = el('pv-doc-title');
  tlCenter.append(docTitle);

  // Right group: zoom / rotate / markup / share
  const tlRight = el('pv-tl-group pv-tl-right');
  const btnZoomOut  = makeBtn('−', 'Zoom out',     'pv-tb-btn');
  const zoomLabel   = el('pv-zoom-label');
  const btnZoomIn   = makeBtn('+', 'Zoom in',      'pv-tb-btn');
  const btnFit      = makeBtn('⤢', 'Fit to window','pv-tb-btn');
  const btnRotateL  = makeBtn('↺', 'Rotate left',  'pv-tb-btn');
  const btnRotateR  = makeBtn('↻', 'Rotate right', 'pv-tb-btn');
  const btnMarkup   = makeBtn('✏️', 'Markup',       'pv-tb-btn pv-markup-toggle');
  const btnShare    = makeBtn('↑', 'Share',         'pv-tb-btn');
  tlRight.append(btnZoomOut, zoomLabel, btnZoomIn, btnFit,
                 sep(), btnRotateL, btnRotateR,
                 sep(), btnMarkup, btnShare);

  toolbar.append(tlLeft, tlCenter, tlRight);

  /* ====== MARKUP TOOLBAR ====== */
  const markupBar = el('pv-markup-bar');
  markupBar.innerHTML = `
    <button class="pv-mu-btn pv-mu-pen" title="Pen">✏️</button>
    <button class="pv-mu-btn pv-mu-highlight" title="Highlight">🖊️</button>
    <button class="pv-mu-btn pv-mu-text" title="Text">T</button>
    <button class="pv-mu-btn pv-mu-shape" title="Rectangle">▭</button>
    <button class="pv-mu-btn pv-mu-arrow" title="Arrow">↗</button>
    <div class="pv-mu-sep"></div>
    <span class="pv-mu-label">Colour:</span>
    <button class="pv-mu-color pv-mu-red   pv-mu-color-active" data-color="#ff3b30" title="Red"></button>
    <button class="pv-mu-color pv-mu-blue"  data-color="#0a84ff" title="Blue"></button>
    <button class="pv-mu-color pv-mu-green" data-color="#34c759" title="Green"></button>
    <button class="pv-mu-color pv-mu-yel"   data-color="#ffd60a" title="Yellow"></button>
    <div class="pv-mu-sep"></div>
    <button class="pv-mu-btn pv-mu-done" id="pv-mu-done">Done</button>`;
  markupBar.classList.add('pv-hidden');

  // Markup tool selection
  let activeMarkupTool = null;
  markupBar.querySelectorAll('.pv-mu-btn:not(.pv-mu-done)').forEach((b) => {
    b.addEventListener('click', () => {
      markupBar.querySelectorAll('.pv-mu-btn').forEach((x) => x.classList.remove('pv-mu-active'));
      b.classList.add('pv-mu-active');
      activeMarkupTool = b.title;
      api.toast(`${b.title} tool selected`);
    });
  });
  markupBar.querySelectorAll('.pv-mu-color').forEach((b) => {
    b.addEventListener('click', () => {
      markupBar.querySelectorAll('.pv-mu-color').forEach((x) => x.classList.remove('pv-mu-color-active'));
      b.classList.add('pv-mu-color-active');
    });
  });
  markupBar.querySelector('#pv-mu-done').addEventListener('click', closeMarkup);

  /* ====== BODY (sidebar + viewer) ====== */
  const body = el('pv-body');

  /* -- Sidebar -- */
  const sidebar = el('pv-sidebar');
  const sbHeader = setHTML('pv-sb-header', `
    <span class="pv-sb-title">Thumbnails</span>
    <button class="pv-sb-sort-btn" title="Sort">↕</button>`);
  const sbList = el('pv-sb-list');
  sidebar.append(sbHeader, sbList);

  /* -- Viewer -- */
  const viewerWrap = el('pv-viewer-wrap');
  const viewer     = el('pv-viewer');
  const canvas     = el('pv-canvas');   // the transformable inner element
  viewer.append(canvas);

  /* ====== OPEN RECENT panel (overlays the viewer area) ====== */
  const recentPanel = el('pv-recent-panel');
  recentPanel.innerHTML = `
    <div class="pv-recent-title">Open Recent</div>
    <div class="pv-recent-list"></div>
    <div class="pv-recent-hint">Select a file from the sidebar to preview it.</div>`;

  // viewerWrap is position:relative; recentPanel is position:absolute over it
  viewerWrap.append(viewer, recentPanel);
  body.append(sidebar, viewerWrap);

  /* -- PDF page nav bar (visible only for PDF) -- */
  const pdfNav = el('pv-pdf-nav');
  pdfNav.innerHTML = `
    <button class="pv-tb-btn pv-pdf-prev" title="Previous page">‹</button>
    <span class="pv-pdf-info"></span>
    <button class="pv-tb-btn pv-pdf-next" title="Next page">›</button>`;
  pdfNav.classList.add('pv-hidden');

  /* ====== Assemble root ====== */
  root.append(toolbar, markupBar, body, pdfNav);

  /* ------------------------------------------------------------------ */
  /*  Sidebar population                                                  */
  /* ------------------------------------------------------------------ */

  function buildSidebar() {
    sbList.innerHTML = '';
    ALL_DOCS.forEach((doc, i) => {
      const item = el('pv-sb-item');
      item.dataset.idx = i;

      const thumb = el('pv-sb-thumb');
      if (doc.type === 'image') {
        thumb.style.background = doc.grad;
        thumb.textContent = doc.label;
      } else {
        thumb.classList.add('pv-sb-thumb-pdf');
        thumb.textContent = '📕';
      }

      const nameEl = el('pv-sb-name');
      nameEl.textContent = doc.name;

      item.append(thumb, nameEl);
      item.addEventListener('click', () => openDoc(i));
      sbList.append(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Open / render a document                                            */
  /* ------------------------------------------------------------------ */

  function openDoc(idx) {
    activeDocIdx = idx;
    const doc = ALL_DOCS[idx];

    // Highlight sidebar
    sbList.querySelectorAll('.pv-sb-item').forEach((el, i) => {
      el.classList.toggle('pv-sb-active', i === idx);
    });

    // Scroll thumbnail into view
    const activeThumb = sbList.querySelector('.pv-sb-active');
    if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest' });

    // Reset transforms
    zoomLevel = 1.0;
    rotation  = 0;
    pdfPage   = 0;

    // Update title
    docTitle.textContent = doc.name;
    api.setTitle('Preview — ' + doc.name);

    // Track recent
    trackRecent(doc.name);

    // Show viewer, hide recent panel
    recentPanel.classList.add('pv-hidden');
    viewer.classList.remove('pv-hidden');

    // Render
    if (doc.type === 'image') {
      renderImage(doc);
      pdfNav.classList.add('pv-hidden');
    } else {
      renderPdf(doc);
    }

    updateNavBtns();
    updateZoomLabel();
  }

  function renderImage(doc) {
    canvas.innerHTML = '';
    canvas.className = 'pv-canvas pv-canvas-img';

    const img = el('pv-img-display');
    img.style.background = doc.grad;
    img.innerHTML = `<span class="pv-img-emoji">${doc.label}</span>
      <span class="pv-img-meta">${doc.name}</span>`;
    canvas.append(img);
    applyTransform();
  }

  function renderPdf(doc) {
    canvas.innerHTML = '';
    canvas.className = 'pv-canvas pv-canvas-pdf';
    renderPdfPage(doc, pdfPage);

    // PDF nav bar
    pdfNav.classList.remove('pv-hidden');
    updatePdfNav(doc);

    pdfNav.querySelector('.pv-pdf-prev').onclick = () => {
      if (pdfPage > 0) { pdfPage--; renderPdfPage(doc, pdfPage); updatePdfNav(doc); }
    };
    pdfNav.querySelector('.pv-pdf-next').onclick = () => {
      if (pdfPage < doc.pages.length - 1) { pdfPage++; renderPdfPage(doc, pdfPage); updatePdfNav(doc); }
    };
    applyTransform();
  }

  function renderPdfPage(doc, pageIdx) {
    canvas.innerHTML = '';
    const page = doc.pages[pageIdx];
    const sheet = el('pv-pdf-page');
    sheet.innerHTML = page.body;
    // Page number stamp
    const stamp = el('pv-pdf-pagestamp');
    stamp.textContent = `Page ${pageIdx + 1} of ${doc.pages.length}`;
    sheet.append(stamp);
    canvas.append(sheet);
    applyTransform();
    updatePdfNav(doc);
  }

  function updatePdfNav(doc) {
    const info = pdfNav.querySelector('.pv-pdf-info');
    if (info) info.textContent = `Page ${pdfPage + 1} / ${doc.pages.length}`;
    const prev = pdfNav.querySelector('.pv-pdf-prev');
    const next = pdfNav.querySelector('.pv-pdf-next');
    if (prev) prev.disabled = (pdfPage === 0);
    if (next) next.disabled = (pdfPage === doc.pages.length - 1);
  }

  /* ------------------------------------------------------------------ */
  /*  Transform (zoom + rotation)                                         */
  /* ------------------------------------------------------------------ */

  function applyTransform() {
    canvas.style.transform = `rotate(${rotation}deg) scale(${zoomLevel})`;
    canvas.style.transformOrigin = 'center center';
    updateZoomLabel();
  }

  function updateZoomLabel() {
    zoomLabel.textContent = Math.round(zoomLevel * 100) + '%';
  }

  function zoomIn() {
    zoomLevel = Math.min(ZOOM_MAX, +(zoomLevel + ZOOM_STEP).toFixed(2));
    applyTransform();
  }

  function zoomOut() {
    zoomLevel = Math.max(ZOOM_MIN, +(zoomLevel - ZOOM_STEP).toFixed(2));
    applyTransform();
  }

  function fitToWindow() {
    zoomLevel = 1.0;
    rotation  = 0;
    applyTransform();
    api.toast('Fit to window');
  }

  function rotateLeft()  { rotation = (rotation - 90 + 360) % 360; applyTransform(); }
  function rotateRight() { rotation = (rotation + 90) % 360; applyTransform(); }

  /* ------------------------------------------------------------------ */
  /*  Navigation (prev / next document)                                   */
  /* ------------------------------------------------------------------ */

  function prevDoc() {
    if (activeDocIdx > 0) openDoc(activeDocIdx - 1);
  }

  function nextDoc() {
    if (activeDocIdx < ALL_DOCS.length - 1) openDoc(activeDocIdx + 1);
  }

  function updateNavBtns() {
    btnBack.disabled    = (activeDocIdx === 0);
    btnForward.disabled = (activeDocIdx === ALL_DOCS.length - 1);
  }

  /* ------------------------------------------------------------------ */
  /*  Markup toolbar                                                       */
  /* ------------------------------------------------------------------ */

  function openMarkup() {
    markupActive = true;
    markupBar.classList.remove('pv-hidden');
    btnMarkup.classList.add('pv-tb-active');
    api.toast('Markup toolbar open');
  }

  function closeMarkup() {
    markupActive = false;
    markupBar.classList.add('pv-hidden');
    btnMarkup.classList.remove('pv-tb-active');
    activeMarkupTool = null;
  }

  /* ------------------------------------------------------------------ */
  /*  Open Recent tracking                                                 */
  /* ------------------------------------------------------------------ */

  function trackRecent(name) {
    recentOpen = recentOpen.filter((n) => n !== name);
    recentOpen.unshift(name);
    if (recentOpen.length > 6) recentOpen = recentOpen.slice(0, 6);
    api.store('recentOpen', recentOpen);
    renderRecentList();
  }

  function renderRecentList() {
    const listEl = recentPanel.querySelector('.pv-recent-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    recentOpen.forEach((name) => {
      const doc = ALL_DOCS.find((d) => d.name === name);
      if (!doc) return;
      const item = el('pv-recent-item');
      const icon = doc.type === 'image'
        ? `<span class="pv-recent-icon" style="background:${doc.grad}">${doc.label}</span>`
        : `<span class="pv-recent-icon pv-recent-icon-pdf">📕</span>`;
      item.innerHTML = `${icon}<span class="pv-recent-name">${name}</span>`;
      item.addEventListener('click', () => {
        const idx = ALL_DOCS.indexOf(doc);
        if (idx >= 0) openDoc(idx);
      });
      listEl.append(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Sidebar toggle                                                       */
  /* ------------------------------------------------------------------ */

  let sidebarVisible = true;
  function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
    sidebar.classList.toggle('pv-sidebar-hidden', !sidebarVisible);
    btnSidebarToggle.classList.toggle('pv-tb-active', sidebarVisible);
  }

  /* ------------------------------------------------------------------ */
  /*  Wheel zoom (pinch-style via Ctrl+wheel)                             */
  /* ------------------------------------------------------------------ */

  viewerWrap.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn(); else zoomOut();
    }
  }, { passive: false });

  /* ------------------------------------------------------------------ */
  /*  Wire toolbar buttons                                                 */
  /* ------------------------------------------------------------------ */

  btnSidebarToggle.addEventListener('click', toggleSidebar);
  btnBack.addEventListener('click', prevDoc);
  btnForward.addEventListener('click', nextDoc);
  btnZoomOut.addEventListener('click', zoomOut);
  btnZoomIn.addEventListener('click', zoomIn);
  btnFit.addEventListener('click', fitToWindow);
  btnRotateL.addEventListener('click', rotateLeft);
  btnRotateR.addEventListener('click', rotateRight);
  btnMarkup.addEventListener('click', () => {
    if (markupActive) closeMarkup(); else openMarkup();
  });
  btnShare.addEventListener('click', () => api.toast('Shared! (simulated)'));

  zoomLabel.title = 'Click to reset zoom';
  zoomLabel.style.cursor = 'default';
  zoomLabel.addEventListener('click', fitToWindow);

  /* ------------------------------------------------------------------ */
  /*  Keyboard shortcuts (active only while window is focused)            */
  /* ------------------------------------------------------------------ */

  function onKey(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key === '=')  { e.preventDefault(); zoomIn(); }
    if (meta && e.key === '-')  { e.preventDefault(); zoomOut(); }
    if (meta && e.key === '0')  { e.preventDefault(); fitToWindow(); }
    if (e.key === 'ArrowLeft')  prevDoc();
    if (e.key === 'ArrowRight') nextDoc();
    if (e.key === 'ArrowUp' && ALL_DOCS[activeDocIdx]?.type === 'pdf' && pdfPage > 0) {
      pdfPage--; renderPdfPage(ALL_DOCS[activeDocIdx], pdfPage);
    }
    if (e.key === 'ArrowDown' && ALL_DOCS[activeDocIdx]?.type === 'pdf' && pdfPage < PDF_PAGES.length - 1) {
      pdfPage++; renderPdfPage(ALL_DOCS[activeDocIdx], pdfPage);
    }
  }

  win.el.addEventListener('focusin', () => document.addEventListener('keydown', onKey));
  win.el.addEventListener('focusout', () => document.removeEventListener('keydown', onKey));

  /* ------------------------------------------------------------------ */
  /*  Init                                                                 */
  /* ------------------------------------------------------------------ */

  buildSidebar();
  renderRecentList();
  updateNavBtns();
  updateZoomLabel();
  btnSidebarToggle.classList.add('pv-tb-active');

  // Show recent panel initially if we have history, else open first image
  if (recentOpen.length > 0) {
    const lastName = recentOpen[0];
    const lastIdx  = ALL_DOCS.findIndex((d) => d.name === lastName);
    if (lastIdx >= 0) {
      openDoc(lastIdx);
    } else {
      openDoc(0);
    }
  } else {
    openDoc(0);
  }

  return root;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeBtn(label, title, cls) {
  const b = el(cls, 'button');
  b.textContent = label;
  b.title = title;
  return b;
}

function sep() {
  return el('pv-tb-sep');
}
