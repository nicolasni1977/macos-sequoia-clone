// js/apps/chess.js — a playable 2-player chess board (click to select & move).
// Movement rules per piece + captures + auto-queen promotion. (No check/castle/
// en-passant — capturing a king ends the game, which keeps it simple but fun.)
import { el } from '../dom.js';

const GLYPH = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};
const BACK = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

function initialBoard() {
  const bd = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    bd[0][c] = { t: BACK[c], c: 'b' };
    bd[1][c] = { t: 'p', c: 'b' };
    bd[6][c] = { t: 'p', c: 'w' };
    bd[7][c] = { t: BACK[c], c: 'w' };
  }
  return bd;
}

const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function legalMoves(bd, r, c) {
  const p = bd[r][c];
  if (!p) return [];
  const me = p.c, moves = [];
  const empty = (r2, c2) => inB(r2, c2) && !bd[r2][c2];
  const enemy = (r2, c2) => inB(r2, c2) && bd[r2][c2] && bd[r2][c2].c !== me;
  const slide = (dirs) => dirs.forEach(([dr, dc]) => {
    let r2 = r + dr, c2 = c + dc;
    while (inB(r2, c2)) {
      if (!bd[r2][c2]) { moves.push([r2, c2]); }
      else { if (bd[r2][c2].c !== me) moves.push([r2, c2]); break; }
      r2 += dr; c2 += dc;
    }
  });

  if (p.t === 'p') {
    const dir = me === 'w' ? -1 : 1;
    const start = me === 'w' ? 6 : 1;
    if (empty(r + dir, c)) {
      moves.push([r + dir, c]);
      if (r === start && empty(r + 2 * dir, c)) moves.push([r + 2 * dir, c]);
    }
    [[dir, -1], [dir, 1]].forEach(([dr, dc]) => { if (enemy(r + dr, c + dc)) moves.push([r + dr, c + dc]); });
  } else if (p.t === 'n') {
    [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
      const r2 = r + dr, c2 = c + dc;
      if (inB(r2, c2) && (!bd[r2][c2] || bd[r2][c2].c !== me)) moves.push([r2, c2]);
    });
  } else if (p.t === 'k') {
    [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => {
      const r2 = r + dr, c2 = c + dc;
      if (inB(r2, c2) && (!bd[r2][c2] || bd[r2][c2].c !== me)) moves.push([r2, c2]);
    });
  } else if (p.t === 'b') {
    slide([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
  } else if (p.t === 'r') {
    slide([[-1, 0], [1, 0], [0, -1], [0, 1]]);
  } else if (p.t === 'q') {
    slide([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
  }
  return moves;
}

export function content(win, api) {
  let bd = initialBoard();
  let turn = 'w';
  let sel = null;            // [r,c] selected
  let legal = [];            // legal destinations for sel
  let last = null;           // [[r,c],[r,c]] last move
  let over = null;           // winner color or null
  const captured = { w: [], b: [] }; // pieces each side has captured

  const root = el('ch-root');
  const bar = el('ch-bar');
  const trayTop = el('ch-tray');
  const boardWrap = el('ch-board-wrap');
  const boardEl = el('ch-board');
  boardWrap.append(boardEl);
  const trayBot = el('ch-tray');
  root.append(bar, trayTop, boardWrap, trayBot);

  function statusText() {
    if (over) return `${over === 'w' ? 'White' : 'Black'} wins! 👑`;
    return `${turn === 'w' ? 'White' : 'Black'} to move`;
  }

  function renderBar() {
    bar.innerHTML = `<span class="ch-turn-dot ${turn}"></span><span class="ch-status">${statusText()}</span>
      <button class="ch-reset">↺ New Game</button>`;
    bar.querySelector('.ch-reset').addEventListener('click', reset);
  }

  function renderTrays() {
    // white's captured (black pieces) shown on top tray; black's on bottom
    trayTop.innerHTML = captured.w.map((t) => `<span class="ch-cap">${GLYPH.b[t]}</span>`).join('') || '<span class="ch-tray-empty">—</span>';
    trayBot.innerHTML = captured.b.map((t) => `<span class="ch-cap">${GLYPH.w[t]}</span>`).join('') || '<span class="ch-tray-empty">—</span>';
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = el('ch-sq ' + ((r + c) % 2 ? 'dark' : 'light'));
        sq.dataset.r = r; sq.dataset.c = c;
        if (sel && sel[0] === r && sel[1] === c) sq.classList.add('sel');
        if (last && ((last[0][0] === r && last[0][1] === c) || (last[1][0] === r && last[1][1] === c))) sq.classList.add('lastmove');
        const isLegal = legal.some(([lr, lc]) => lr === r && lc === c);
        if (isLegal) sq.classList.add(bd[r][c] ? 'cap-target' : 'move-target');
        const p = bd[r][c];
        if (p) {
          const pe = el('ch-piece ' + p.c);
          pe.textContent = GLYPH[p.c][p.t];
          sq.append(pe);
        }
        sq.addEventListener('click', () => onSquare(r, c));
        boardEl.append(sq);
      }
    }
  }

  function onSquare(r, c) {
    if (over) return;
    const p = bd[r][c];
    if (sel) {
      const target = legal.find(([lr, lc]) => lr === r && lc === c);
      if (target) { doMove(sel, [r, c]); return; }
      if (p && p.c === turn) { select(r, c); return; }
      sel = null; legal = []; renderBoard(); return;
    }
    if (p && p.c === turn) select(r, c);
  }

  function select(r, c) {
    sel = [r, c];
    legal = legalMoves(bd, r, c);
    renderBoard();
  }

  function doMove(from, to) {
    const [fr, fc] = from, [tr, tc] = to;
    const piece = bd[fr][fc];
    const target = bd[tr][tc];
    if (target) {
      captured[piece.c].push(target.t);
      if (target.t === 'k') over = piece.c; // king captured → game over
    }
    bd[tr][tc] = piece;
    bd[fr][fc] = null;
    // promotion
    if (piece.t === 'p' && (tr === 0 || tr === 7)) piece.t = 'q';
    last = [from, to];
    sel = null; legal = [];
    if (!over) turn = turn === 'w' ? 'b' : 'w';
    renderBar(); renderTrays(); renderBoard();
    if (over) api.toast(`Checkmate-ish! ${over === 'w' ? 'White' : 'Black'} wins.`);
  }

  function reset() {
    bd = initialBoard(); turn = 'w'; sel = null; legal = []; last = null; over = null;
    captured.w = []; captured.b = [];
    renderBar(); renderTrays(); renderBoard();
    api.toast('New game — White to move');
  }

  renderBar(); renderTrays(); renderBoard();
  return root;
}
