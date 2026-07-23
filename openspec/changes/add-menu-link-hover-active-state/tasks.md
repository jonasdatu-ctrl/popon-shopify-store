## 1. Visual feedback CSS (menu-drawer-link-feedback)

- [x] 1.1 In `sections/customcode-menu-drawer.liquid`'s `{% style %}` block, add a shared inset-box style (padding-inline + matching negative margin-inline, border-radius) targeting the real interactive elements: `div[data-has-children]`, `[data-menu="main"] > .link-item > a` (top-level leaf links), and `.sublink-title` — not the decorative `.link-title` wrapper.
- [x] 1.2 Add `:active` and `:focus-visible` rules for those same selectors applying the same faint-gray background, unconditional (not media-gated), so click/tap and keyboard focus work identically on desktop and mobile.
- [x] 1.3 Add `:hover` rules for those same selectors applying the same faint-gray background, wrapped in `@media (hover: hover) and (pointer: fine)` so touch devices never get a stuck hover box.
- [x] 1.4 Add `-webkit-tap-highlight-color: transparent;` to `.sublink-title` (alongside the existing declaration on `div[data-has-children]`) so mobile taps show only the new gray flash, not native blue followed by gray.
- [x] 1.5 Confirm `[data-submenu-close]` receives no new background/hover/active/focus styling (visually unchanged).

## 2. Keyboard operability (menu-drawer-keyboard-accessibility)

- [x] 2.1 In `snippets/header-drawer.liquid`, add `tabindex="0"`, `role="button"`, `aria-expanded="false"`, and `aria-label="Open menu"` to the `[data-menu-trigger]` div.
- [x] 2.2 In `sections/customcode-menu-drawer.liquid`, add `tabindex="0"`, `role="button"`, and `aria-expanded="false"` to the `div[data-has-children]` branch of the top-level link markup (leave the `a href` leaf branch untouched — it's natively focusable already).
- [x] 2.3 In `sections/customcode-menu-drawer.liquid`, add `tabindex="0"` and `role="button"` to the `[data-submenu-close]` div.
- [x] 2.4 In `sections/customcode-menu-drawer.liquid`, add `aria-label="Close menu"` to the existing `button[data-menu-close]` (already focusable, just needs a name).
- [x] 2.5 In `snippets/customcode-scripts.liquid` (`CMenuDrawer`), add a keydown handler (Enter/Space → `element.click()`) to the hamburger trigger, each `div[data-has-children]`, and each `[data-submenu-close]`.

## 3. Inert-based hiding and aria-expanded state (menu-drawer-keyboard-accessibility)

- [x] 3.1 In `sections/customcode-menu-drawer.liquid`, add `inert` by default to the `<c-menu-drawer>` root element and to each `.c-submenu-drawer` (both start closed).
- [x] 3.2 In `snippets/customcode-scripts.liquid`, consolidate `bindHamburger`/`bindCloseButtons`/`bindOverlayClick`'s shared open/close sequence into `open()`/`close()` methods on `CMenuDrawer`; `open()` removes `inert` from the drawer and sets the hamburger's `aria-expanded="true"`, `close()` re-adds `inert`, sets `aria-expanded="false"`, and still calls `closeSubMenu()` + `hideOverlay()`.
- [x] 3.3 In `snippets/customcode-scripts.liquid`, update `closeSubMenu()` to also set `inert` on each `.c-submenu-drawer` it collapses and `aria-expanded="false"` on each `div[data-has-children]`.
- [x] 3.4 In `snippets/customcode-scripts.liquid`, update `bindMenuLinks()`'s open path to remove `inert` from the opened submenu and set `aria-expanded="true"` on its parent link.
- [x] 3.5 In `snippets/customcode-scripts.liquid`, update `bindBackButton()`'s close path to set `inert` on the submenu it collapses and `aria-expanded="false"` on that submenu's parent link.

## 4. Verification

- [ ] 4.1 In a desktop browser, hover over a top-level link and a sub-link inside an open submenu — confirm the inset gray box appears/clears correctly and doesn't affect layout or the submenu's slide-in animation.
- [ ] 4.2 On desktop, click a top-level link and a sub-link and confirm the gray box shows as press feedback.
- [ ] 4.3 Using Tab key navigation on desktop starting from the hamburger, confirm: the trigger is reachable and Enter/Space opens the drawer; parent rows are reachable and Enter/Space opens their submenu with the gray focus box shown; sub-links are reachable with the gray focus box shown; the back/close row is reachable and Enter/Space closes the submenu. Confirm the gray box does not appear from a mouse click alone (`:focus-visible`, not `:focus`).
- [ ] 4.4 On a real touch device (or emulated touch + desktop-width viewport, e.g. iPad-sized), confirm no hover box appears or sticks after a tap, and tapping a sub-link shows a single clean gray flash with no native blue highlight.
- [ ] 4.5 With the drawer closed, Tab through the page from the top and confirm focus never enters the drawer.
- [ ] 4.6 With the drawer open and all submenus collapsed, Tab through it and confirm focus skips every sub-link and back/close row until their submenu is opened.
- [ ] 4.7 Using a screen reader (or the browser's accessibility tree inspector), confirm the hamburger trigger and close button announce meaningful names, and that closed drawer/submenu content is not announced while tabbing.
