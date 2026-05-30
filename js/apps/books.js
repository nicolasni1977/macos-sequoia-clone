// js/apps/books.js — Apple Books-style reader with real public-domain bestsellers.
// Full texts are fetched on demand from /books/*.txt (Project Gutenberg, public domain).
import { el, setHTML } from '../dom.js';

const BOOKS = [
  {
    id: 'pride', title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813,
    file: '/books/pride-and-prejudice.txt',
    cover: 'linear-gradient(150deg,#6d5bd0,#b06ab3 55%,#e0a3a3)', emoji: '💍',
    blurb: 'One of the best-selling novels of all time (20M+ copies) — Elizabeth Bennet, Mr. Darcy, and the perils of first impressions.',
  },
  {
    id: 'sherlock', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', year: 1892,
    file: '/books/sherlock-holmes.txt',
    cover: 'linear-gradient(150deg,#1f2c3a,#3a6073 60%,#16a085)', emoji: '🔍',
    blurb: 'Twelve classic mysteries featuring the world’s most famous detective and his companion, Dr. Watson.',
  },
];

const cache = {}; // id -> { chapters }

function parseBook(text) {
  const paras = text.replace(/\r/g, '').split(/\n\s*\n/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean);
  const isHead = (p) => p.length < 70 && (
    /^chapter\s+[\divxlcdm]+/i.test(p) ||
    /^adventure\s+[ivxlcdm]+/i.test(p) ||
    /^[IVXLC]{1,6}\.\s+\S/.test(p)
  );
  const chapters = [];
  let cur = null;
  paras.forEach((p) => {
    if (isHead(p)) { cur = { title: p.replace(/\s+/g, ' ').replace(/[[\]]+/g, '').trim(), paras: [] }; chapters.push(cur); }
    else { if (!cur) { cur = { title: 'Title Page', paras: [] }; chapters.push(cur); } cur.paras.push(p); }
  });
  return chapters.length ? chapters : [{ title: 'Book', paras }];
}

export function content(win, api) {
  const root = el('books-root');
  const library = el('books-library');
  const reader = el('books-reader hidden');
  root.append(library, reader);

  let fontSize = api.load('fontSize', 19);

  /* ---------- Library ---------- */
  function buildLibrary() {
    library.innerHTML = '<div class="books-title">Reading Now</div>';
    const shelf = el('books-shelf');
    BOOKS.forEach((b) => {
      const card = el('book-card');
      const saved = api.load('pos-' + b.id, 0);
      card.innerHTML = `
        <div class="book-cover" style="background:${b.cover}">
          <span class="book-cover-emoji">${b.emoji}</span>
          <span class="book-cover-title">${b.title}</span>
          <span class="book-cover-author">${b.author}</span>
        </div>
        <div class="book-meta">
          <div class="book-name">${b.title}</div>
          <div class="book-author">${b.author} · ${b.year}</div>
          <div class="book-blurb">${b.blurb}</div>
          <button class="book-open">${saved ? 'Continue Reading' : 'Read Now'}</button>
        </div>`;
      card.querySelector('.book-open').addEventListener('click', () => openBook(b));
      card.querySelector('.book-cover').addEventListener('click', () => openBook(b));
      shelf.append(card);
    });
    library.append(shelf);
    library.append(setHTML('books-foot', 'Free, full-text classics from Project Gutenberg (public domain).'));
  }

  /* ---------- Reader ---------- */
  async function openBook(b) {
    library.classList.add('hidden');
    reader.classList.remove('hidden');
    reader.innerHTML = `<div class="reader-loading"><div class="reader-spinner"></div>Opening “${b.title}”…</div>`;

    let chapters = cache[b.id];
    if (!chapters) {
      try {
        const res = await fetch(b.file);
        if (!res.ok) throw new Error(res.status);
        const text = await res.text();
        chapters = parseBook(text);
        cache[b.id] = chapters;
      } catch (e) {
        reader.innerHTML = `<div class="reader-loading">Couldn’t load this book (${e.message}).<br>
          <button class="book-open" style="margin-top:14px">← Back to Library</button></div>`;
        reader.querySelector('.book-open').addEventListener('click', backToLibrary);
        return;
      }
    }
    const saved = api.load('pos-' + b.id, null);
    let idx;
    if (saved == null) {
      // First open: skip front matter, start at the first real chapter.
      idx = chapters.findIndex((c) => /^(chapter\s|adventure\s|[ivxlc]{1,6}\.\s)/i.test(c.title));
      if (idx < 0) idx = 0;
    } else {
      idx = Math.min(saved, chapters.length - 1);
    }
    renderReader(b, chapters, idx);
  }

  function renderReader(b, chapters, idx) {
    api.store('pos-' + b.id, idx);
    api.setTitle('Books — ' + b.title);
    const ch = chapters[idx];
    reader.innerHTML = '';

    const bar = el('reader-bar');
    bar.innerHTML = `
      <button class="reader-btn reader-back">‹ Library</button>
      <div class="reader-bar-title">${b.title}</div>
      <div class="reader-bar-tools">
        <button class="reader-btn" data-a="toc">☰</button>
        <button class="reader-btn" data-a="smaller">A−</button>
        <button class="reader-btn" data-a="bigger">A+</button>
      </div>`;

    const page = el('reader-page');
    page.style.fontSize = fontSize + 'px';
    const chTitle = el('reader-ch-title');
    chTitle.textContent = ch.title;
    page.append(chTitle);
    ch.paras.forEach((p) => page.append(Object.assign(document.createElement('p'), { className: 'reader-p', textContent: p })));

    const nav = el('reader-nav');
    nav.innerHTML = `
      <button class="reader-btn" data-a="prev" ${idx === 0 ? 'disabled' : ''}>‹ Previous</button>
      <span class="reader-progress">${idx + 1} / ${chapters.length}</span>
      <button class="reader-btn" data-a="next" ${idx === chapters.length - 1 ? 'disabled' : ''}>Next ›</button>`;

    reader.append(bar, page, nav);

    bar.querySelector('.reader-back').addEventListener('click', backToLibrary);
    bar.querySelector('[data-a="smaller"]').addEventListener('click', () => { fontSize = Math.max(13, fontSize - 1); api.store('fontSize', fontSize); page.style.fontSize = fontSize + 'px'; });
    bar.querySelector('[data-a="bigger"]').addEventListener('click', () => { fontSize = Math.min(28, fontSize + 1); api.store('fontSize', fontSize); page.style.fontSize = fontSize + 'px'; });
    bar.querySelector('[data-a="toc"]').addEventListener('click', () => toggleTOC(b, chapters, idx));
    nav.querySelector('[data-a="prev"]').addEventListener('click', () => { if (idx > 0) renderReader(b, chapters, idx - 1); });
    nav.querySelector('[data-a="next"]').addEventListener('click', () => { if (idx < chapters.length - 1) renderReader(b, chapters, idx + 1); });
    page.scrollTop = 0;
  }

  function toggleTOC(b, chapters, idx) {
    const existing = reader.querySelector('.reader-toc');
    if (existing) { existing.remove(); return; }
    const toc = el('reader-toc');
    toc.innerHTML = '<div class="reader-toc-head">Contents</div>';
    chapters.forEach((c, i) => {
      const row = el('reader-toc-row' + (i === idx ? ' active' : ''));
      row.textContent = c.title;
      row.addEventListener('click', () => { toc.remove(); renderReader(b, chapters, i); });
      toc.append(row);
    });
    reader.append(toc);
  }

  function backToLibrary() {
    reader.classList.add('hidden');
    library.classList.remove('hidden');
    api.setTitle('Books');
    buildLibrary();
  }

  buildLibrary();
  return root;
}
