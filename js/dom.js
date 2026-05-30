// Shared DOM helpers. App modules import { el, setHTML } from './dom.js'.
// apps.js re-exports these so existing imports (e.g. windowManager.js) keep working.

export const el = (cls, tag = 'div') => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

export const setHTML = (cls, html, tag = 'div') => {
  const n = el(cls, tag);
  n.innerHTML = html;
  return n;
};
