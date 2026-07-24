## Why

The menu drawer (`sections/customcode-menu-drawer.liquid`) gives customers no visual feedback when interacting with its links. On desktop, hovering a link does nothing. On both desktop and mobile, clicking/tapping a link relies entirely on the browser's native tap-highlight (blue, inconsistent across elements — the prior change `2026-07-23-fix-menu-drawer-tap-highlight-bleed` already suppressed it on the parent row to fix a bleed bug, but left sub-links untouched). Customers get no confirmation their hover/click registered on the intended row.

Implementing keyboard-focus feedback surfaced a deeper, pre-existing problem: the hamburger trigger, the parent "SHOP ▸"-style toggle rows, and the submenu back/close row are all plain `<div>`s with click-only JS handlers — none are reachable via keyboard (no `tabindex`/`role`/keydown support). Worse, the drawer and every submenu are hidden purely via `transform`, never `display`/`visibility`/`inert`/`aria-hidden` — so even while visually closed, all of their links remain in the page's tab order and are announced by screen readers. A keyboard or screen-reader user today either can't open the menu at all, or tabs through an entire off-screen nav before reaching visible page content. This is fixed alongside the visual feedback work rather than left for a separate change, since the focus-feedback requirement is meaningless without it.

## What Changes

**Visual feedback:**
- On desktop (mouse/trackpad input, gated via `@media (hover: hover) and (pointer: fine)` to avoid sticky-hover on touch devices at desktop widths), hovering a top-level link or a sub-link shows an inset faint-gray background box hugging that row's content.
- On both desktop and mobile, clicking/tapping a top-level link or sub-link shows the same faint-gray background as momentary press feedback (via `:active`).
- Keyboard focus (`:focus-visible`) on a top-level link or sub-link gets the same faint-gray background, paired with hover per the theme's existing convention (`blocks/_header-menu.liquid`).
- `-webkit-tap-highlight-color: transparent` is extended to `.sublink-title` (currently only set on `div[data-has-children]`) so mobile taps show a single clean gray flash instead of native-blue-then-gray.
- The visual treatment targets the actual interactive element in each case (`div[data-has-children]`, the top-level leaf `<a>`, `.sublink-title`) rather than the decorative `.link-title` wrapper div, so hover/active/focus all fire correctly.
- Out of scope: the submenu back/close row (`[data-submenu-close]`) gets no new background treatment — it stays visually as-is (but does become keyboard-operable, see below).

**Keyboard and screen-reader operability (expanded scope):**
- **BREAKING** (behavioral, not code-interface): the hamburger trigger, parent toggle rows, and back/close row become keyboard-focusable and operable via Enter/Space — previously mouse/touch-only.
- `[data-menu-trigger]` (hamburger), `div[data-has-children]` (parent rows), and `[data-submenu-close]` (back button) each get `tabindex="0"`, `role="button"`, and a keydown handler (Enter/Space triggers the existing click behavior).
- `div[data-has-children]` gets `aria-expanded`, toggled to reflect whether its submenu is open; the hamburger trigger gets `aria-expanded` reflecting whether the drawer is open, plus `aria-label` since it's icon-only.
- The close (`✕`) button gets `aria-label` since it's icon-only (already a real `<button>`, already focusable — label-only fix).
- The drawer (`<c-menu-drawer>`) is `inert` by default and has `inert` removed only while open. Each `.c-submenu-drawer` is `inert` by default and has `inert` removed only while that specific submenu is open. This removes all of their descendant links from the tab order and from screen-reader exposure whenever they're not visibly open.

## Capabilities

### New Capabilities
- `menu-drawer-link-feedback`: Hover, active/click, and focus visual feedback (faint-gray background) for interactive links inside the custom menu drawer.
- `menu-drawer-keyboard-accessibility`: Keyboard operability (focus, Enter/Space activation) and correct screen-reader exposure (via `inert`, `role`, `aria-expanded`, `aria-label`) for the menu drawer's trigger, toggle rows, links, and back/close control.

### Modified Capabilities
None — no existing capability specs cover the menu drawer's interaction states.

## Impact

- `sections/customcode-menu-drawer.liquid`: CSS (corrected hover/active/focus selectors, tap-highlight extension) and markup (`tabindex`, `role`, `aria-expanded`, default `inert`) inside the existing section.
- `snippets/header-drawer.liquid`: hamburger trigger gets `tabindex`, `role`, `aria-expanded`, `aria-label`.
- `snippets/customcode-scripts.liquid`: `CMenuDrawer` class gains `open()`/`close()` methods, inert toggling, `aria-expanded` toggling, and keydown handlers on the three previously-mouse-only controls.
