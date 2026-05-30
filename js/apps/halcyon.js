// Halcyon — the iPod Classic web app, embedded as its own self-contained
// document inside an iframe. The full app lives at /apps/halcyon/index.html;
// here we just frame it so it runs sandboxed from the rest of the desktop.
export function content(win, api) {
  const root = document.createElement('div');
  root.className = 'halcyon-app';

  const frame = document.createElement('iframe');
  frame.className = 'halcyon-frame';
  frame.src = 'apps/halcyon/index.html';
  frame.title = 'Halcyon — iPod Classic';
  // No autoplay permission: audio only starts on a real user gesture (pressing
  // play on the wheel), so opening the app never blasts sound unexpectedly.
  // The iPod handles its own pointer/touch/keyboard input internally.
  root.append(frame);
  return root;
}
