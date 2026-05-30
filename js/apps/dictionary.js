// js/apps/dictionary.js — Dictionary: searchable definitions with synonyms.
import { el } from '../dom.js';

const WORDS = [
  { w: 'aesthetic', pr: '/esˈθedik/', pos: 'adjective', defs: ['Concerned with beauty or the appreciation of beauty.', 'Giving or designed to give pleasure through form or design.'], ex: 'The clone has a clean, native aesthetic.', syn: ['artistic', 'tasteful', 'elegant'] },
  { w: 'algorithm', pr: '/ˈalɡəˌriT͟Həm/', pos: 'noun', defs: ['A process or set of rules to be followed in calculations or problem-solving, especially by a computer.'], ex: 'The dock uses a falloff algorithm for magnification.', syn: ['procedure', 'method', 'routine'] },
  { w: 'cascade', pr: '/kasˈkād/', pos: 'noun', defs: ['A process whereby something is passed on through a series of stages.', 'A small waterfall, typically one of several.'], ex: 'New windows open in a gentle cascade.', syn: ['sequence', 'chain', 'flow'] },
  { w: 'ephemeral', pr: '/əˈfem(ə)rəl/', pos: 'adjective', defs: ['Lasting for a very short time.'], ex: 'A tooltip is an ephemeral hint that fades away.', syn: ['fleeting', 'transient', 'momentary'] },
  { w: 'gradient', pr: '/ˈɡrādēənt/', pos: 'noun', defs: ['A gradual change, especially of color from one to another.', 'The degree of a slope.'], ex: 'The wallpaper is a sweeping purple gradient.', syn: ['slope', 'incline', 'ramp'] },
  { w: 'heuristic', pr: '/hyo͞oˈristik/', pos: 'adjective', defs: ['Enabling someone to discover or learn something for themselves; a practical, rule-of-thumb approach.'], ex: 'Safari uses a heuristic to detect blocked frames.', syn: ['practical', 'experimental', 'empirical'] },
  { w: 'interface', pr: '/ˈin(t)ərˌfās/', pos: 'noun', defs: ['A point where two systems meet and interact.', 'The visual layer through which a user controls software.'], ex: 'The menu bar is part of the interface.', syn: ['boundary', 'connection', 'frontend'] },
  { w: 'iterate', pr: '/ˈidəˌrāt/', pos: 'verb', defs: ['Perform repeatedly; to refine through repeated cycles.'], ex: 'We iterate on the design until it feels right.', syn: ['repeat', 'reiterate', 'refine'] },
  { w: 'kerning', pr: '/ˈkərniNG/', pos: 'noun', defs: ['The spacing between individual letters in typography.'], ex: 'Careful kerning makes the title look crisp.', syn: ['spacing', 'tracking', 'letter-fit'] },
  { w: 'latency', pr: '/ˈlātnsē/', pos: 'noun', defs: ['The delay before a transfer of data begins following an instruction.'], ex: 'Local rendering keeps latency near zero.', syn: ['delay', 'lag', 'pause'] },
  { w: 'luminance', pr: '/ˈlo͞omənəns/', pos: 'noun', defs: ['The intensity of light emitted from a surface per unit area.'], ex: 'Dark mode lowers the screen’s luminance.', syn: ['brightness', 'glow', 'radiance'] },
  { w: 'magnify', pr: '/ˈmaɡnəˌfī/', pos: 'verb', defs: ['Make something appear larger than it is, especially with a lens.'], ex: 'Dock icons magnify under the cursor.', syn: ['enlarge', 'amplify', 'expand'] },
  { w: 'modular', pr: '/ˈmäjələr/', pos: 'adjective', defs: ['Composed of separate parts or units that can be combined.'], ex: 'The app uses a modular, per-app file layout.', syn: ['sectional', 'composable', 'component-based'] },
  { w: 'parallax', pr: '/ˈperəˌlaks/', pos: 'noun', defs: ['The apparent shift of an object against a background due to a change in viewpoint.'], ex: 'Layered backgrounds create a subtle parallax.', syn: ['shift', 'displacement', 'offset'] },
  { w: 'pixel', pr: '/ˈpiksəl/', pos: 'noun', defs: ['A minute area of illumination on a display, one of many that compose an image.'], ex: 'The clone aims to be pixel-perfect.', syn: ['dot', 'point', 'sample'] },
  { w: 'raster', pr: '/ˈrastər/', pos: 'noun', defs: ['A rectangular grid of pixels representing an image.'], ex: 'Photos are stored as raster data.', syn: ['bitmap', 'grid', 'pixel-map'] },
  { w: 'render', pr: '/ˈrendər/', pos: 'verb', defs: ['Process and display graphics or text on screen.', 'Provide or give (a service).'], ex: 'The browser renders the page into the window.', syn: ['draw', 'display', 'paint'] },
  { w: 'responsive', pr: '/rəˈspänsiv/', pos: 'adjective', defs: ['Reacting quickly and positively; adapting layout to available space.'], ex: 'The Launchpad grid is responsive.', syn: ['adaptive', 'reactive', 'flexible'] },
  { w: 'serendipity', pr: '/ˌserənˈdipədē/', pos: 'noun', defs: ['The occurrence of happy or beneficial events by chance.'], ex: 'A bit of serendipity led to a cleaner design.', syn: ['chance', 'fortune', 'luck'] },
  { w: 'skeuomorphism', pr: '/ˌsko͞oəˈmôrˌfizəm/', pos: 'noun', defs: ['Design that imitates real-world materials and objects in software.'], ex: 'Glossy icons are a touch of skeuomorphism.', syn: ['realism', 'imitation', 'mimicry'] },
  { w: 'ubiquitous', pr: '/yo͞oˈbikwədəs/', pos: 'adjective', defs: ['Present, appearing, or found everywhere.'], ex: 'The menu bar is ubiquitous across apps.', syn: ['omnipresent', 'universal', 'pervasive'] },
  { w: 'vector', pr: '/ˈvektər/', pos: 'noun', defs: ['A graphic defined by mathematical paths rather than pixels.', 'A quantity having direction and magnitude.'], ex: 'Icons drawn as vectors scale cleanly.', syn: ['path', 'outline', 'direction'] },
  { w: 'vibrancy', pr: '/ˈvībrənsē/', pos: 'noun', defs: ['The state of being full of energy and life; in UI, a translucent, blurred material.'], ex: 'The dock’s vibrancy blurs the wallpaper behind it.', syn: ['energy', 'translucency', 'liveliness'] },
  { w: 'viewport', pr: '/ˈvyo͞oˌpôrt/', pos: 'noun', defs: ['The visible area of a graphical interface or web page.'], ex: 'Windows are clamped within the viewport.', syn: ['frame', 'view area', 'window'] },
];

export function content(win, api) {
  const root = el('dict-root');
  const sidebar = el('dict-sidebar');
  const searchWrap = el('dict-search');
  searchWrap.innerHTML = '<span>🔍</span>';
  const input = el('dict-input', 'input');
  input.placeholder = 'Search'; input.spellcheck = false; input.autocomplete = 'off';
  searchWrap.append(input);
  const list = el('dict-list');
  sidebar.append(searchWrap, list);

  const pane = el('dict-pane');
  root.append(sidebar, pane);

  let active = WORDS[0];

  function renderList(filter = '') {
    const q = filter.trim().toLowerCase();
    list.innerHTML = '';
    const items = WORDS.filter((d) => !q || d.w.includes(q) || d.syn.some((s) => s.includes(q)));
    if (!items.length) { list.append(Object.assign(el('dict-noresult'), { textContent: 'No definitions found' })); return; }
    items.forEach((d) => {
      const row = el('dict-row' + (d === active ? ' active' : ''));
      row.innerHTML = `<span class="dict-row-word">${d.w}</span><span class="dict-row-pos">${d.pos}</span>`;
      row.addEventListener('click', () => { active = d; renderList(input.value); renderPane(d); });
      list.append(row);
    });
  }

  function renderPane(d) {
    pane.innerHTML = `
      <div class="dict-word">${d.w}</div>
      <div class="dict-pron">${d.pr} · <span class="dict-listen" title="Pronounce">🔊</span></div>
      <div class="dict-pos-line">${d.pos}</div>
      <ol class="dict-defs">${d.defs.map((x) => `<li>${x}</li>`).join('')}</ol>
      <div class="dict-ex-label">Example</div>
      <div class="dict-ex">“${d.ex}”</div>
      <div class="dict-syn-label">Synonyms</div>
      <div class="dict-syns">${d.syn.map((s) => `<span class="dict-syn">${s}</span>`).join('')}</div>`;
    pane.querySelectorAll('.dict-syn').forEach((chip) => chip.addEventListener('click', () => {
      const found = WORDS.find((x) => x.w === chip.textContent);
      if (found) { active = found; input.value = ''; renderList(); renderPane(found); }
      else api.toast(`No entry for “${chip.textContent}”`);
    }));
    pane.querySelector('.dict-listen').addEventListener('click', () => api.toast(`🔊 ${d.w}  ${d.pr}`));
    pane.scrollTop = 0;
  }

  input.addEventListener('input', () => {
    renderList(input.value);
    const first = list.querySelector('.dict-row');
    // keep selection if it still matches; otherwise preview the first match
    if (first && !list.querySelector('.dict-row.active')) {
      const w = first.querySelector('.dict-row-word').textContent;
      const d = WORDS.find((x) => x.w === w);
      if (d) { active = d; first.classList.add('active'); renderPane(d); }
    }
  });

  renderList();
  renderPane(active);
  return root;
}
