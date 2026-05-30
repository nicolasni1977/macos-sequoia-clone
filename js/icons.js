// Crafted SVG app icons — squircle tiles + clean monochrome symbols, one
// consistent visual language across every app. Shared gradient defs injected once.

const GRADS = {
  blue: ['#54a8ff', '#1f6fe0'], indigo: ['#7b86ff', '#3b46d6'], sky: ['#5cc6ff', '#2a8fe0'],
  green: ['#5fd36a', '#1faf43'], mint: ['#54e0b0', '#10a87e'], teal: ['#37d6c8', '#119a96'],
  red: ['#ff6f6f', '#e23640'], pink: ['#ff84b6', '#f0468f'], orange: ['#ffb44a', '#ff8a1e'],
  amber: ['#ffcf45', '#f5a200'], yellow: ['#ffe05a', '#f7c200'], purple: ['#b478ff', '#7b35e6'],
  graphite: ['#7a828c', '#3b424b'], dark: ['#454b54', '#181c22'], slate: ['#9aa3b2', '#5b6473'],
  paper: ['#fbfbfd', '#e9e9ee'],
};

const TILE = {
  finder: 'blue', safari: 'sky', mail: 'indigo', messages: 'green', maps: 'mint', photos: 'pink',
  facetime: 'green', calendar: 'paper', contacts: 'slate', reminders: 'orange', notes: 'yellow',
  freeform: 'teal', tv: 'dark', music: 'pink', podcasts: 'purple', news: 'red', stocks: 'dark',
  home: 'orange', voicememos: 'red', findmy: 'mint', photobooth: 'purple', preview: 'slate',
  textedit: 'slate', calculator: 'dark', dictionary: 'graphite', clock: 'dark', weather: 'sky',
  books: 'orange', appstore: 'blue', settings: 'slate', terminal: 'dark', activity: 'graphite',
  diskutil: 'slate', console: 'graphite', keychain: 'graphite', screenshot: 'graphite',
  automator: 'purple', quicktime: 'indigo', fontbook: 'slate', imagecapture: 'teal',
  colorsync: 'pink', grapher: 'teal', chess: 'graphite', stickies: 'yellow', shortcuts: 'pink',
  numbers: 'green', pages: 'orange', keynote: 'indigo', garageband: 'orange', imovie: 'purple',
  missioncontrol: 'graphite', siri: 'purple', timemachine: 'graphite', sysinfo: 'slate',
  launchpad: 'graphite',
};
const LIGHT = new Set(['calendar']);

// White symbol markup drawn in a 100×100 viewBox (group provides white stroke).
const S = {
  finder: '<path d="M37 43v5M63 43v5"/><path d="M36 60q14 11 28 0"/>',
  safari: '<circle cx="50" cy="50" r="25"/><path d="M50 50 63 37 53 53Z" fill="#ff5b5b" stroke="#ff5b5b"/><path d="M50 50 37 63 47 47Z" fill="none" stroke="#fff"/>',
  mail: '<rect x="28" y="35" width="44" height="30" rx="6"/><path d="M30 39 50 53 70 39"/>',
  messages: '<path d="M30 35h40a8 8 0 0 1 8 8v11a8 8 0 0 1-8 8H49l-12 9v-9h-3a8 8 0 0 1-8-8V43a8 8 0 0 1 8-8Z" fill="#fff" stroke="none"/>',
  maps: '<path d="M50 28a16 16 0 0 1 16 16c0 13-16 28-16 28S34 57 34 44a16 16 0 0 1 16-16Z"/><circle cx="50" cy="44" r="5.5" fill="#ff5b5b" stroke="#ff5b5b"/>',
  photos: '<g stroke="none" fill="#fff"><circle cx="50" cy="35" r="9"/><circle cx="63" cy="42.5" r="9"/><circle cx="63" cy="57.5" r="9"/><circle cx="50" cy="65" r="9"/><circle cx="37" cy="57.5" r="9"/><circle cx="37" cy="42.5" r="9"/></g><circle cx="50" cy="50" r="7" fill="#ffd23f" stroke="none"/>',
  facetime: '<rect x="29" y="38" width="30" height="24" rx="6"/><path d="M61 46 73 40V60L61 54Z" fill="#34c759" stroke="#34c759"/>',
  calendar: '<rect x="29" y="33" width="42" height="36" rx="6"/><path d="M29 41h42" stroke="#ff5b5b" stroke-width="8"/><path d="M40 29v8M60 29v8"/><text x="50" y="63" font-size="18" font-weight="600" fill="#fff" stroke="none" text-anchor="middle" font-family="-apple-system,sans-serif">17</text>',
  contacts: '<circle cx="50" cy="43" r="9"/><path d="M33 68a17 15 0 0 1 34 0"/>',
  reminders: '<circle cx="37" cy="43" r="4.5" fill="#ff9f0a" stroke="#ff9f0a"/><path d="M48 43h19"/><circle cx="37" cy="57" r="4"/><path d="M48 57h19"/>',
  notes: '<path d="M36 40h28" stroke="#ffd23f" stroke-width="7"/><path d="M36 50h28M36 60h18"/>',
  freeform: '<rect x="31" y="37" width="16" height="16" rx="3"/><rect x="53" y="47" width="16" height="16" rx="3"/><path d="M47 45h6"/>',
  tv: '<rect x="30" y="35" width="40" height="27" rx="4"/><path d="M44 69h12"/>',
  music: '<path d="M44 63V35l20-5v28"/><ellipse cx="39" cy="63" rx="6" ry="5" fill="#ff6b9d" stroke="none"/><ellipse cx="59" cy="58" rx="6" ry="5" fill="#ff6b9d" stroke="none"/>',
  podcasts: '<circle cx="50" cy="60" r="4.5" fill="#bf5af2" stroke="none"/><path d="M40 52a14 14 0 0 1 20 0"/><path d="M34 45a23 23 0 0 1 32 0"/>',
  news: '<rect x="30" y="33" width="40" height="34" rx="4"/><path d="M37 42h12" stroke="#ff5b5b" stroke-width="6.5"/><path d="M37 50h26M37 58h26"/>',
  stocks: '<path d="M32 60 44 48 52 54 67 37" stroke="#34c759"/><path d="M60 37h7v7" stroke="#34c759"/>',
  home: '<path d="M31 50 50 32 69 50" stroke="#ff9f0a"/><path d="M37 47v20h26V47"/>',
  voicememos: '<rect x="44" y="30" width="12" height="24" rx="6"/><path d="M36 50a14 14 0 0 0 28 0M50 64v6"/>',
  findmy: '<circle cx="50" cy="50" r="5" fill="#fff" stroke="none"/><circle cx="50" cy="50" r="13"/><path d="M67 50a17 17 0 0 0-17-17"/>',
  photobooth: '<rect x="30" y="40" width="40" height="24" rx="6"/><circle cx="50" cy="52" r="7"/><rect x="42" y="33" width="11" height="8" rx="2"/>',
  preview: '<rect x="30" y="33" width="40" height="34" rx="5"/><circle cx="42" cy="45" r="4"/><path d="M32 63 46 52 56 60 68 49"/>',
  textedit: '<path d="M38 30h16l12 12v26a3 3 0 0 1-3 3H38a3 3 0 0 1-3-3V33a3 3 0 0 1 3-3z"/><path d="M54 30v12h12"/><path d="M42 50h16M42 58h12"/>',
  calculator: '<rect x="33" y="29" width="34" height="42" rx="6"/><path d="M40 41h20"/><circle cx="41" cy="54" r="2.5" fill="#fff" stroke="none"/><circle cx="50" cy="54" r="2.5" fill="#fff" stroke="none"/><circle cx="59" cy="54" r="2.5" fill="#ff9f0a" stroke="none"/><circle cx="41" cy="63" r="2.5" fill="#fff" stroke="none"/><circle cx="50" cy="63" r="2.5" fill="#fff" stroke="none"/>',
  dictionary: '<rect x="34" y="30" width="32" height="40" rx="4"/><path d="M44 60l6-18 6 18M46 53h8"/>',
  clock: '<circle cx="50" cy="50" r="23"/><path d="M50 50V36"/><path d="M50 50l13 6" stroke="#ff5b5b"/>',
  weather: '<circle cx="44" cy="44" r="9" fill="#ffd23f" stroke="#ffd23f"/><path d="M44 28v5M44 55v5M28 44h5M55 44h5M33 33l3 3M52 52l3 3" stroke="#ffd23f"/><path d="M41 62a9 9 0 0 1 0-18 11 11 0 0 1 21 3 8 8 0 0 1-2 15Z" fill="#fff" stroke="#fff"/>',
  books: '<path d="M50 38v30M31 41q9-4 19-2v30q-10-2-19 2zM69 41q-9-4-19-2"/>',
  appstore: '<path d="M37 64 50 35 63 64M43.5 55h13"/>',
  settings: '<circle cx="50" cy="50" r="9"/><g stroke-width="7"><path d="M50 28v8M50 64v8M28 50h8M64 50h8M34 34l6 6M60 60l6 6M66 34l-6 6M40 60l-6 6"/></g>',
  terminal: '<path d="M34 41 45 50 34 59"/><path d="M50 60h16" stroke="#34c759"/>',
  activity: '<path d="M30 50h9l5-13 8 26 6-15 4 2h8"/>',
  diskutil: '<circle cx="50" cy="50" r="20"/><circle cx="50" cy="50" r="5"/><path d="M50 30v8"/>',
  console: '<rect x="30" y="34" width="40" height="32" rx="4"/><path d="M30 44h40"/><path d="M37 53l5 4-5 4M48 61h10"/>',
  keychain: '<circle cx="42" cy="44" r="9"/><path d="M48 50 64 66M58 60l5-5M54 64l5-5"/>',
  screenshot: '<path d="M34 42v-6a2 2 0 0 1 2-2h6M58 34h6a2 2 0 0 1 2 2v6M66 58v6a2 2 0 0 1-2 2h-6M42 66h-6a2 2 0 0 1-2-2v-6"/><circle cx="50" cy="50" r="6"/>',
  automator: '<rect x="36" y="40" width="28" height="22" rx="5"/><circle cx="44" cy="51" r="2.6" fill="#fff" stroke="none"/><circle cx="56" cy="51" r="2.6" fill="#fff" stroke="none"/><path d="M50 40v-6"/><circle cx="50" cy="32" r="2.4" fill="#fff" stroke="none"/>',
  quicktime: '<circle cx="50" cy="50" r="20"/><path d="M45 41l15 9-15 9z" fill="#fff" stroke="#fff"/>',
  fontbook: '<path d="M37 65 48 35 59 65M42 55h13"/>',
  imagecapture: '<rect x="31" y="40" width="38" height="24" rx="5"/><circle cx="50" cy="52" r="7"/><path d="M50 26v9M46 31l4 4 4-4"/>',
  colorsync: '<path d="M50 32c9 11 15 17 15 25a15 15 0 0 1-30 0c0-8 6-14 15-25z"/>',
  grapher: '<path d="M30 50h40M50 30v40"/><path d="M32 64q14-34 36 0" stroke-width="5"/>',
  chess: '<text x="50" y="46" dy="0.36em" text-anchor="middle" font-size="42" fill="#fff" stroke="none">♞</text><rect x="36" y="69" width="28" height="4.5" rx="2.2" fill="#d99a45" stroke="none"/>',
  stickies: '<path d="M34 34h24l8 8v24a2 2 0 0 1-2 2H34a2 2 0 0 1-2-2V36a2 2 0 0 1 2-2z"/><path d="M58 34v8h8"/>',
  shortcuts: '<rect x="32" y="32" width="23" height="23" rx="7"/><rect x="45" y="45" width="23" height="23" rx="7"/>',
  numbers: '<rect x="31" y="31" width="38" height="38" rx="6"/><path d="M44 31v38M31 44h38M31 56h38"/>',
  pages: '<path d="M38 30h16l12 12v26a3 3 0 0 1-3 3H38a3 3 0 0 1-3-3V33a3 3 0 0 1 3-3z"/><path d="M54 30v12h12"/><path d="M43 53l9-9 4 4-9 9h-4z" fill="#fff" stroke="#fff"/>',
  keynote: '<rect x="30" y="34" width="40" height="24" rx="3"/><path d="M50 58v8M42 66h16"/>',
  garageband: '<circle cx="50" cy="55" r="13"/><circle cx="50" cy="55" r="4"/><path d="M50 42V28M44 28h12"/>',
  imovie: '<path d="M50 30 55.5 41.5 68 43 59 51.5 61.5 64 50 57.5 38.5 64 41 51.5 32 43 44.5 41.5Z" fill="#fff" stroke="#fff" stroke-width="3"/>',
  missioncontrol: '<rect x="32" y="34" width="15" height="13" rx="2"/><rect x="53" y="34" width="15" height="13" rx="2"/><rect x="32" y="53" width="15" height="13" rx="2"/><rect x="53" y="53" width="15" height="13" rx="2"/>',
  siri: '<circle cx="50" cy="50" r="17"/><circle cx="50" cy="50" r="9"/>',
  timemachine: '<circle cx="50" cy="50" r="16"/><path d="M50 50V40M50 50l8 4"/><path d="M50 28a22 22 0 1 1-19 11" stroke-width="5"/><path d="M31 33v6h6"/>',
  sysinfo: '<circle cx="50" cy="50" r="18"/><path d="M50 47v15"/><circle cx="50" cy="40" r="2" fill="#fff" stroke="none"/>',
};

const letter = (ch) => `<text x="50" y="50" dy="0.345em" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" font-weight="500" font-size="44" fill="#fff" stroke="none">${(ch || '?').toUpperCase()}</text>`;
const LAUNCHPAD_SYM = '<g fill="#fff" stroke="none"><rect x="30" y="30" width="12" height="12" rx="3"/><rect x="44" y="30" width="12" height="12" rx="3"/><rect x="58" y="30" width="12" height="12" rx="3"/><rect x="30" y="44" width="12" height="12" rx="3"/><rect x="44" y="44" width="12" height="12" rx="3"/><rect x="58" y="44" width="12" height="12" rx="3"/><rect x="30" y="58" width="12" height="12" rx="3"/><rect x="44" y="58" width="12" height="12" rx="3"/><rect x="58" y="58" width="12" height="12" rx="3"/></g>';

const SVGNS = 'http://www.w3.org/2000/svg';
let injected = false;
export function injectIconDefs() {
  if (injected || !document.body) return;
  injected = true;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = '<defs>' + Object.entries(GRADS).map(([k, [a, b]]) =>
    `<linearGradient id="icg-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('') + '</defs>';
  document.body.appendChild(svg);
}

function shape(inner) {
  return `<svg class="appicon" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="${SVGNS}">${inner}</svg>`;
}
const SHAPES = {
  folder: shape('<defs><linearGradient id="icf-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a828c"/><stop offset="1" stop-color="#3b424b"/></linearGradient><linearGradient id="icf-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b929c"/><stop offset="1" stop-color="#4a515b"/></linearGradient></defs><path d="M16 35a7 7 0 0 1 7-7h17l7 7h30a7 7 0 0 1 7 7v4H16Z" fill="url(#icf-a)"/><path d="M16 42a7 7 0 0 1 7-7h54a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H23a7 7 0 0 1-7-7Z" fill="url(#icf-b)"/>'),
  drive: shape('<defs><linearGradient id="icd-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf3"/><stop offset="1" stop-color="#b9c2cf"/></linearGradient></defs><rect x="18" y="33" width="64" height="34" rx="7" fill="url(#icd-a)" stroke="#9aa6b5" stroke-width="1.5"/><circle cx="68" cy="50" r="4" fill="#7d8794"/><rect x="27" y="46" width="22" height="8" rx="4" fill="#aab4c2"/>'),
  trash: shape('<g fill="none" stroke="#dfe3ea" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><path d="M35 39h30l-3 31a5 5 0 0 1-5 5H43a5 5 0 0 1-5-5Z"/><path d="M30 39h40"/><path d="M43 39v-4a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v4"/><path d="M45 48v19M50 48v19M55 48v19" stroke-width="3"/></g>'),
};

export function iconHTML(id, name = '') {
  if (SHAPES[id]) return SHAPES[id];
  if (id === 'machd') return SHAPES.drive;
  const tile = 'graphite'; // uniform monochrome set — every app reads like the chess tile
  let sym = id === 'launchpad' ? LAUNCHPAD_SYM : S[id];
  if (!sym) sym = letter((name || id)[0]);
  return `<svg class="appicon" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="${SVGNS}">`
    + `<rect x="6" y="6" width="88" height="88" rx="22" fill="url(#icg-${tile})"/>`
    + `<rect x="6" y="6" width="88" height="42" rx="22" fill="#fff" opacity="0.13"/>`
    + `<rect x="6.8" y="6.8" width="86.4" height="86.4" rx="21.3" fill="none" stroke="#fff" stroke-opacity="0.30" stroke-width="1.2"/>`
    + `<g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${sym}</g>`
    + `</svg>`;
}
