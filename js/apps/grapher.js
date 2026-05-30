// js/apps/grapher.js — Grapher: an interactive 2D function plotter on <canvas>.
// Follows the APP CONTRACT: export function content(win, api) { … return rootEl; }
import { el, setHTML } from '../dom.js';

const COLORS = ['#0a84ff', '#ff375f', '#34c759', '#ff9f0a', '#bf5af2', '#5ac8fa'];

const PRESETS = [
  { label: 'sin(x)', expr: 'sin(x)' },
  { label: 'x²', expr: 'x^2' },
  { label: 'x³ − 3x', expr: 'x^3 - 3*x' },
  { label: '1/x', expr: '1/x' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: 'tan(x)', expr: 'tan(x)' },
  { label: 'cos(x)·x', expr: 'cos(x)*x' },
];

// Build a numeric evaluator from a user expression, or null if unsafe/invalid.
function compile(raw) {
  const expr = (raw || '').trim().replace(/\^/g, '**');
  if (!expr) return null;
  // Reject anything that could escape simple math (assignments, blocks, props).
  if (/[;={}\[\]`]|=>|\bconstructor\b|\bimport\b|\bwhile\b|\bfunction\b/.test(expr)) return null;
  let fn;
  try {
    // Function-constructor bodies run sloppy, so `with (Math)` is allowed.
    fn = new Function('x', `with (Math) { return (${expr}); }`);
    const test = fn(1);
    if (typeof test !== 'number') return null;
  } catch { return null; }
  return fn;
}

export function content(win, api) {
  const root = el('gr-root');

  /* ---- View state (world units) ---- */
  let scale = 38;            // pixels per unit
  let originX = 0, originY = 0; // canvas px of world (0,0); set on first layout
  let placed = false;
  const curves = [];         // { expr, fn, color }

  /* ---- Toolbar ---- */
  const toolbar = el('gr-toolbar');
  const inputWrap = el('gr-input-wrap');
  const colorDot = el('gr-color-dot');
  const input = el('gr-input', 'input');
  input.type = 'text';
  input.placeholder = 'Enter a function of x,  e.g.  sin(x) * x';
  input.spellcheck = false;
  input.autocomplete = 'off';
  const plotBtn = el('gr-plot-btn', 'button');
  plotBtn.textContent = 'Plot';
  inputWrap.append(setHTML('gr-fx', 'ƒ(x) ='), colorDot, input, plotBtn);

  const tools = el('gr-tools');
  const zoomOut = toolBtn('−', 'Zoom out');
  const zoomIn = toolBtn('+', 'Zoom in');
  const resetBtn = toolBtn('⤢', 'Reset view');
  const clearBtn = toolBtn('🗑', 'Clear all');
  tools.append(zoomOut, zoomIn, resetBtn, clearBtn);

  toolbar.append(inputWrap, tools);

  /* ---- Preset chips ---- */
  const chips = el('gr-chips');
  PRESETS.forEach((p) => {
    const c = el('gr-chip', 'button');
    c.textContent = p.label;
    c.addEventListener('click', () => { input.value = p.expr; addCurve(p.expr); });
    chips.append(c);
  });

  /* ---- Canvas ---- */
  const stage = el('gr-stage');
  const canvas = el('gr-canvas', 'canvas');
  const legend = el('gr-legend');
  const readout = el('gr-readout');
  readout.textContent = 'x: –   y: –';
  stage.append(canvas, legend, readout);

  root.append(toolbar, chips, stage);
  const ctx = canvas.getContext('2d');

  /* ---- Sizing ---- */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!placed) { originX = w / 2; originY = h / 2; placed = true; }
    draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  /* ---- Drawing ---- */
  function draw() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    drawGrid(w, h);
    curves.forEach((c) => drawCurve(c, w, h));
  }

  function drawGrid(w, h) {
    // minor grid
    const step = scale;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    for (let x = originX % step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = originY % step; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    // axes
    ctx.strokeStyle = 'rgba(0,0,0,0.42)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, originY); ctx.lineTo(w, originY);
    ctx.moveTo(originX, 0); ctx.lineTo(originX, h);
    ctx.stroke();
    // unit labels along axes
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '11px -apple-system, system-ui, sans-serif';
    const unitStep = niceStep();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let u = Math.ceil((-originX / scale)); u <= (w - originX) / scale; u++) {
      if (u === 0 || u % unitStep !== 0) continue;
      const px = originX + u * scale;
      ctx.fillRect(px - 0.5, originY - 3, 1, 6);
      ctx.fillText(String(u), px, originY + 5);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = Math.ceil((-originY / scale)); v <= (h - originY) / scale; v++) {
      if (v === 0 || v % unitStep !== 0) continue;
      const py = originY + v * scale;
      ctx.fillRect(originX - 3, py - 0.5, 6, 1);
      ctx.fillText(String(-v), originX - 6, py);
    }
  }
  function niceStep() {
    if (scale > 60) return 1;
    if (scale > 30) return 1;
    if (scale > 16) return 2;
    if (scale > 8) return 5;
    return 10;
  }

  function drawCurve(curve, w, h) {
    ctx.strokeStyle = curve.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let prevY = null, started = false;
    for (let px = 0; px <= w; px++) {
      const xw = (px - originX) / scale;
      const yw = curve.fn(xw);
      if (!isFinite(yw)) { started = false; prevY = null; continue; }
      const py = originY - yw * scale;
      // break across steep discontinuities (e.g. tan, 1/x)
      if (prevY !== null && Math.abs(py - prevY) > h * 1.5) { started = false; }
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
      prevY = py;
    }
    ctx.stroke();
  }

  /* ---- Curve management ---- */
  function addCurve(raw) {
    const fn = compile(raw);
    if (!fn) { api.toast('Hmm, that isn’t a valid function of x.'); input.classList.add('gr-invalid'); setTimeout(() => input.classList.remove('gr-invalid'), 600); return; }
    const color = COLORS[curves.length % COLORS.length];
    curves.push({ expr: raw.trim(), fn, color });
    renderLegend();
    nextColorDot();
    draw();
  }
  function removeCurve(i) { curves.splice(i, 1); renderLegend(); nextColorDot(); draw(); }
  function clearAll() { curves.length = 0; renderLegend(); nextColorDot(); draw(); }

  function renderLegend() {
    legend.innerHTML = '';
    if (!curves.length) { legend.classList.add('gr-empty'); return; }
    legend.classList.remove('gr-empty');
    curves.forEach((c, i) => {
      const row = el('gr-legend-row');
      row.innerHTML = `<span class="gr-swatch" style="background:${c.color}"></span><span class="gr-leg-expr">ƒ(x) = ${c.expr}</span><span class="gr-leg-x">×</span>`;
      row.querySelector('.gr-leg-x').addEventListener('click', () => removeCurve(i));
      legend.append(row);
    });
  }
  function nextColorDot() { colorDot.style.background = COLORS[curves.length % COLORS.length]; }

  /* ---- Interaction: drag to pan, wheel to zoom ---- */
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'crosshair'; });
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (dragging) {
      originX += e.clientX - lastX; originY += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY; draw();
    }
    // live readout
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const xw = (e.clientX - rect.left - originX) / scale;
      const yw = (originY - (e.clientY - rect.top)) / scale;
      readout.textContent = `x: ${xw.toFixed(2)}   y: ${yw.toFixed(2)}`;
    }
  }
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newScale = Math.max(6, Math.min(260, scale * factor));
    // keep the point under the cursor fixed
    originX = mx - (mx - originX) * (newScale / scale);
    originY = my - (my - originY) * (newScale / scale);
    scale = newScale;
    draw();
  }, { passive: false });

  function zoomBy(factor) {
    const w = stage.clientWidth / 2, h = stage.clientHeight / 2;
    const newScale = Math.max(6, Math.min(260, scale * factor));
    originX = w - (w - originX) * (newScale / scale);
    originY = h - (h - originY) * (newScale / scale);
    scale = newScale; draw();
  }
  zoomIn.addEventListener('click', () => zoomBy(1.25));
  zoomOut.addEventListener('click', () => zoomBy(1 / 1.25));
  resetBtn.addEventListener('click', () => { scale = 38; originX = stage.clientWidth / 2; originY = stage.clientHeight / 2; draw(); });
  clearBtn.addEventListener('click', clearAll);

  plotBtn.addEventListener('click', () => { addCurve(input.value); input.focus(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { addCurve(input.value); } });

  /* ---- Init ---- */
  nextColorDot();
  renderLegend();
  input.value = 'sin(x)';
  // Robust first paint: poll until the stage has been laid out, rather than
  // relying solely on requestAnimationFrame/ResizeObserver (which browsers
  // throttle for backgrounded tabs).
  let initTries = 60;
  (function init() {
    if (stage.clientWidth > 0 && stage.clientHeight > 0) {
      resize();
      if (!curves.length) addCurve('sin(x)');
    } else if (initTries-- > 0) {
      setTimeout(init, 50);
    }
  })();

  win.el?.addEventListener?.('os:closing', () => ro.disconnect());
  return root;

  function toolBtn(label, title) {
    const b = el('gr-tool-btn', 'button');
    b.textContent = label; b.title = title;
    return b;
  }
}
