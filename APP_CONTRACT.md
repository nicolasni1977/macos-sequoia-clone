# App Contract — macOS Sequoia Web Clone

Authoritative contract for adding/editing an app in this shell. It reflects the
real, working patterns in the codebase (`js/apps.js`, `js/windowManager.js`,
`js/dom.js`, `js/shell.js`).

---

## 1. What an app is

An app is one entry in the `APPS` array in `js/apps.js`:

```js
{
  id,        // unique string id, e.g. 'notes'  (windows, dock, CSS scope, storage)
  name,      // display name, e.g. 'Notes'      (titlebar, dock tooltip, menu bar)
  icon,      // dock-icon gradient class, e.g. 'ic-notes' (defined in css/dock.css)
  glyph,     // emoji shown inside the icon, e.g. '📝'
  cat,       // 'system' | 'internet' | 'media' | 'productivity' | 'dev'
  size,      // [width, height] initial window size in px, e.g. [720, 500]
  content,   // (win, api) => HTMLElement   — REQUIRED, see below
  fixed,     // optional: true disables resize/maximize (e.g. Calculator)
}
```

`APP_MAP` and `DOCK_LAYOUT` are derived from / reference `APPS`.

---

## 2. The `content(win, api)` signature

```js
function content(win, api) {
  // build your UI...
  return rootElement; // ONE HTMLElement, appended into the window body
}
```

- **Must return exactly one `HTMLElement`.** The window manager appends it into
  `win.body`. Returning nothing yields an empty window.
- Called once, when the window is created.
- Throwing is caught by the window manager and shown as an error in the window.

### `win` — the window object

```js
{
  id,        // window id, e.g. 'win-3'
  appId,     // this app's id
  el,        // the .window root element
  body,      // the .window-body element your content goes into (has class app-<id>)
  titlebar,  // the .titlebar element
  x, y, w, h,
  minimized, maximized, fixed,
}
```

### `api` — the full services object (passed to every app)

| Member | Description |
| --- | --- |
| `openApp(id)` | Open (or focus) another app by id. |
| `close()` | Close this window. |
| `setTitle(str)` | Set this window's titlebar text. |
| `toast(msg, {duration}?)` | Stacked, auto-dismissing top-right notification. Returns a dismiss fn. |
| `store(key, val)` | Persist a value to `localStorage`, **namespaced per appId**. |
| `load(key, fallback)` | Read a value previously `store`d (namespaced per appId). |
| `theme()` | Returns `'light'` or `'dark'` (current appearance). |
| `setWallpaper(css)` | Set the desktop wallpaper to a CSS `background` value; persists. |
| `setAppearance('dark'\|'light')` | Switch the whole UI dark/light; persists. |
| `getSetting(key, fallback)` | Read a global (non-namespaced) setting. |
| `setSetting(key, val)` | Write a global setting. |
| `getAppearance()` | Current `'light'`/`'dark'` (same as `theme()`). |
| `getWallpaper()` | Current wallpaper CSS string. |
| `wallpapers` | Array of `{ id, name, css }` wallpaper presets. |
| `setDockSize(px)` | Set the Dock's resting icon size (36–80) and rebuild the dock. |

> `store`/`load` keys are namespaced as `macclone:app:<appId>:<key>`, so two
> apps can use the same key without collision.

---

## 3. CSS scoping: `.app-<id>`

The window body element automatically gets the class **`app-<id>`**
(e.g. `app-notes`). Scope all per-app CSS under it:

```css
.app-notes .my-thing { color: var(--win-fg); }
```

Avoid global selectors that could leak into other apps.

---

## 4. CSS custom properties (theme tokens)

All surfaces are driven by CSS custom properties so apps adapt to **Dark Mode**
automatically. Use these instead of hard-coded colors. Defined in
`css/reset.css` (`:root` = light, `html.dark` = dark):

| Token | Purpose |
| --- | --- |
| `--win-bg` | Window / content background |
| `--win-fg` | Primary text on window surfaces |
| `--win-muted` | Secondary / muted text |
| `--win-border` | Hairline borders inside windows |
| `--win-hover` | Hover background for rows/cells |
| `--accent` | Accent color (selection, highlights) |
| `--accent-light` | Lighter accent (hover states) |
| `--titlebar-bg` / `--titlebar-bg-active` | Titlebar gradient (inactive/active) |
| `--titlebar-fg` / `--titlebar-fg-active` | Titlebar text (inactive/active) |
| `--sidebar-bg` / `--sidebar-fg` / `--sidebar-border` | Two-pane sidebars |
| `--card-bg` / `--card-border` | Grouped cards / rows |
| `--control-bg` | Control / chip backgrounds |
| `--field-bg` | Text-field backgrounds |
| `--menubar-bg` / `--menubar-fg` | Top menu bar |
| `--menu-bg` / `--menu-fg` / `--menu-border` / `--menu-sep` | Dropdown / contextual menus |
| `--dock-bg` / `--dock-border` | Dock surface |
| `--dock-base` | Dock resting icon size (px) |
| `--scrollbar-thumb` / `--scrollbar-thumb-hover` | Scrollbars |
| `--menubar-h` | Menu bar height |
| `--window-radius` | Window corner radius |
| `--shadow-active` / `--shadow-inactive` | Window shadows |
| `--vibrancy-light` | Vibrancy backdrop tint (flips in dark) |
| `--ease-out` / `--ease-spring` | Shared easing curves |

---

## 5. DOM helpers

Import shared helpers from `js/dom.js`:

```js
import { el, setHTML } from './dom.js';

el('my-class');                 // <div class="my-class">
el('my-row', 'li');             // <li class="my-row">
setHTML('card', '<b>Hi</b>');   // <div class="card"><b>Hi</b></div>
```

> `apps.js` re-exports `el`/`setHTML` from `dom.js`, but new app modules should
> import from `js/dom.js` directly.

---

## 6. Hard rules

- **Vanilla JS + emoji only.** No frameworks.
- **No external network / CDN / fonts / images.** Everything self-contained.
- **No proprietary Apple assets.** Use CSS gradients + emoji approximations.
- **Adapt to dark mode** via the CSS custom properties above — never hard-code
  light-only colors for text/backgrounds.
- **Do not import from `apps.js` inside a standalone app module** (avoids import
  cycles). Use `js/dom.js` for helpers; use the `api` object for shell services.

---

## 7. Minimal example module — `js/apps/example.js`

```js
// js/apps/example.js
import { el, setHTML } from '../dom.js';

export function content(win, api) {
  const root = el('example-root');               // body already has class .app-example

  root.append(setHTML('example-title', 'Hello from Example'));

  // Persisted counter (namespaced per app via api.store/api.load)
  let count = api.load('count', 0);
  const btn = el('example-btn', 'button');
  btn.textContent = `Clicked ${count} times`;
  btn.addEventListener('click', () => {
    count += 1;
    api.store('count', count);
    btn.textContent = `Clicked ${count} times`;
    api.toast('Saved!');                          // top-right notification
  });
  root.append(btn);

  if (api.theme() === 'dark') root.classList.add('is-dark');

  return root; // ONE element
}
```

```css
/* css/apps.css — scoped under the auto-added .app-example class */
.app-example { padding: 20px; color: var(--win-fg); background: var(--win-bg); }
.app-example .example-title { font-size: 18px; font-weight: 700; }
.app-example .example-btn {
  margin-top: 12px; padding: 8px 14px; border-radius: 8px;
  background: var(--accent); color: #fff;
}
```

Register it by adding an entry to `APPS` in `js/apps.js`:

```js
import { content as exampleContent } from './apps/example.js';
// ...
{ id: 'example', name: 'Example', icon: 'ic-generic', glyph: '🧩',
  cat: 'productivity', size: [480, 360], content: exampleContent },
```
