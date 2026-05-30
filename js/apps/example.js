// Minimal reference app module demonstrating the app contract.
// See APP_CONTRACT.md. Not registered by default — copy as a starting point.
import { el, setHTML } from '../dom.js';

export function content(win, api) {
  const root = el('example-root'); // window body already has class .app-example

  root.append(setHTML('example-title', 'Hello from Example'));

  // Persisted counter (namespaced per app via api.store / api.load)
  let count = api.load('count', 0);
  const btn = el('example-btn', 'button');
  btn.textContent = `Clicked ${count} times`;
  btn.addEventListener('click', () => {
    count += 1;
    api.store('count', count);
    btn.textContent = `Clicked ${count} times`;
    api.toast('Saved!');
  });
  root.append(btn);

  if (api.theme() === 'dark') root.classList.add('is-dark');

  return root; // ONE HTMLElement
}
