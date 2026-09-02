## Context

`sections/customcode-menu-drawer.liquid` renders each top-level nav entry as:

```
.link-item
 └─ div[data-has-children]        ← cursor:pointer + click listener (bindMenuLinks)
     ├─ .link-title                 (e.g. "SHOP ▸")
     └─ .c-submenu-drawer           (absolutely positioned, slides over the main list)
         ├─ [data-submenu-close]
         └─ .submenu-content
             └─ .link-item
                 └─ a.sublink-title  ← what the customer actually taps
```

`.c-submenu-drawer` is positioned `absolute` relative to `[data-menu="main"]` (the nearest `position: relative` ancestor), so visually it slides over the *entire* nav list, covering the header row it belongs to. But in the DOM it is still a *child* of `div[data-has-children]`.

`CMenuDrawer.bindMenuLinks()` (`snippets/customcode-scripts.liquid`) attaches a `click` listener directly to every `[data-has-children]`:

```js
link.addEventListener('click', (e) => {
  if (e.target.closest('.c-submenu-drawer')) return;   // correctly no-ops for bubbled sub-link clicks
  this.closeSubMenu();
  const submenu = link.querySelector('.c-submenu-drawer');
  if (submenu && submenu.dataset.menuLevel === '2') submenu.classList.add('is-active');
});
```

This guard means the *logic* is already correct — tapping a sub-link never re-triggers the open/close behavior. The problem is purely visual: no file in this theme sets `-webkit-tap-highlight-color` anywhere, so the browser's default mobile tap-highlight applies. Because `div[data-has-children]` is the ancestor that owns the click listener (and `cursor: pointer`), the browser paints its native highlight over *that element's* box whenever a click bubbles through it — including clicks that originated on a descendant sub-link. The result is the parent header row (e.g. "SHOP ▸") flashing blue instead of the tapped sub-link.

## Goals / Non-Goals

**Goals:**
- Eliminate the erroneous blue flash on the parent `.link-item` row when a sub-link inside its open `.c-submenu-drawer` is tapped.
- Keep native tap-highlight feedback everywhere else in the theme untouched — sub-links, `[data-submenu-close]`, `[data-menu-close]`, the hamburger trigger, and every other tappable element site-wide.
- Scope the fix to the minimal selector actually responsible; no global reset.

**Non-Goals:**
- Restoring tap feedback on the parent header row's own legitimate tap (the accepted trade-off — see Risks below). Can be revisited separately if wanted.
- Restructuring the DOM so `.c-submenu-drawer` is no longer a descendant of the clickable wrapper. That would remove the shared-ancestor problem at its root, but touches positioning/JS that currently works correctly and isn't warranted to fix this specific visual bug.
- Changing `bindMenuLinks`'s click-handling logic — it already correctly ignores bubbled sub-link clicks for its own open/close behavior.

## Decisions

**1. Fix lives entirely in CSS, in the existing `{% style %}` block of `sections/customcode-menu-drawer.liquid`.** No JS or DOM structure changes needed — the bubbling itself is harmless to the app logic; only the browser's native paint feedback is wrong.

**2. Add the property to the existing selector, don't introduce a new one:**
```css
c-menu-drawer .c-menu-drawer div[data-has-children] {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
```
This is the exact element identified via DevTools as the one painting the erroneous highlight, and it's already scoped narrowly (inside `c-menu-drawer .c-menu-drawer`, only `div[data-has-children]`) — it doesn't touch `.link-item`, `.sublink-title`, `[data-submenu-close]`, or anything outside this drawer.

**3. Do not add any broader or global reset.** No `*`, no `a`, no `.link-item`. Every other clickable element in the drawer and the rest of the site keeps the browser's default tap-highlight, per explicit requirement from exploration.

## Risks / Trade-offs

- **The parent header row's own legitimate tap (opening the drawer) also loses its tap-highlight flash**, since suppressing the property on `div[data-has-children]` removes it for the whole element, including the case where the tap is legitimately on that row itself, not bubbled from a sub-link. There is no way to distinguish "legitimate direct tap" from "bubbled descendant tap" using `-webkit-tap-highlight-color` alone, since the property applies per-element. Accepted as-is; the header row's own feedback was the same unreliable native effect, and fixing it further (e.g. an explicit `:active` style) is a separate, non-urgent enhancement.
- **`-webkit-tap-highlight-color` is a non-standard, WebKit-derived property.** Non-WebKit/Blink browsers that don't implement it (e.g. Firefox desktop) silently ignore the declaration — no risk of breakage there, since there's nothing to suppress in the first place.
