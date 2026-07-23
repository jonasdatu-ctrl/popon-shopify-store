## Context

`sections/customcode-menu-drawer.liquid` renders the site's **only** navigation, at every breakpoint. Shopify's native desktop mega-menu (`<header-menu>`) is force-hidden via a literal `hidden` class in `blocks/_header-menu.liquid` (the `mobile:hidden` comment that would normally scope that class is itself commented out). The custom drawer's CSS has no media queries at all — the same fixed, 320px-wide, off-canvas drawer opens identically whether triggered by a mouse click or a touch tap. "Desktop" in this change therefore does not mean a different layout; it means the same markup, opened with a mouse instead of a finger.

Interactive elements inside the drawer:

```
c-menu-drawer
 └─ [data-menu="main"]
     └─ .link-item                                 top-level row
         └─ div[data-has-children]  (or a[href] if no children)
             ├─ .link-title            "SHOP ▸"     ← in scope
             └─ .c-submenu-drawer
                 ├─ [data-submenu-close]  "◂ SHOP"  ← out of scope (UI control, not a link)
                 └─ .submenu-content
                     └─ .link-item
                         └─ a.sublink-title          ← in scope
```

The prior change (`2026-07-23-fix-menu-drawer-tap-highlight-bleed`) added `-webkit-tap-highlight-color: transparent` to `div[data-has-children]` only, to stop the parent row from flashing blue when a tap on a sub-link bubbled through it. `.sublink-title` and `[data-submenu-close]` still use the browser's native (blue) tap highlight — unaddressed by that change.

## Goals / Non-Goals

**Goals:**
- Give desktop (mouse) users a faint-gray hover cue on top-level links and sub-links.
- Give both desktop and mobile users the same faint-gray cue as press/click feedback.
- Give keyboard users the same cue on focus, consistent with the theme's own convention of pairing `:hover` and `:focus` (see `blocks/_header-menu.liquid`'s `.menu-list__link`).
- Avoid a doubled visual (native blue flash + new gray flash) on mobile taps.
- Avoid a "stuck" gray hover box on touch devices that report a desktop-sized viewport (e.g. iPad, touch laptops).
- Make every visible, interactive control in the drawer (hamburger trigger, parent toggle rows, links, back/close row) keyboard-focusable and operable, so the focus-feedback requirement above is actually reachable.
- Ensure closed/off-screen drawer and submenu content is excluded from the tab order and from screen-reader exposure, so it doesn't appear before or alongside visible page content.

**Non-Goals:**
- Styling `[data-submenu-close]` (the back/close row) with the new *visual* hover/active/focus background — it stays visually as-is. (It does become keyboard-operable — see Decisions — but that's an operability fix, not a visual one.)
- Any layout restructuring of the drawer (full-bleed backgrounds, edge-to-edge highlight). The highlight is an inset box hugging each row's own content, so no change to `.link-item` or the drawer's 20px container padding is needed.
- Focus trapping (forcing Tab to cycle within the open drawer instead of escaping to the rest of the page) and an Escape-to-close keyboard shortcut. `inert` on the closed/collapsed portions already prevents the worst failure mode (tabbing through invisible content); full modal-style focus trapping is a larger behavioral change and not required to close the specific gap identified here.

## Decisions

**1. Hover is gated by `@media (hover: hover) and (pointer: fine)`, not a viewport-width breakpoint.**
The theme elsewhere uses a `min-width: 990px` convention for "desktop" (see `blocks/_header-menu.liquid`'s mega-menu grid). That convention was considered and rejected here: a plain width gate would let a touch-capable device at desktop width (iPad, touch laptop) match the hover rule, and since those devices have no real `mouseleave` event, the gray box can visually "stick" after a tap instead of clearing. `(hover: hover) and (pointer: fine)` scopes the rule to devices with a mouse/trackpad regardless of screen size, which is both more correct and avoids the stuck-hover bug.

**2. Click/press feedback uses the CSS `:active` pseudo-class — no JS.**
`:active` fires on both mouse-down and touch-press across all breakpoints, so a single rule serves the "both desktop and mobile" requirement without branching. For `<a href>` sub-links, `:active` paints before the browser unloads the page for navigation (this is exactly the mechanism the native tap-highlight already relied on), so the flash is visible in practice, not theoretical.

**3. Focus is paired with hover, unconditionally (not gated by the hover media query).**
Keyboard focus is not a hover-capability question — a keyboard user needs the cue regardless of pointer type. `:focus-visible` is used (not bare `:focus`) so the box doesn't appear on mouse-click-then-focus, only on actual keyboard navigation, matching modern accessibility practice.

**4. The gray box targets the actual interactive element in each case, not the decorative `.link-title` wrapper.**
Initial planning targeted `.link-title` (the inner div holding the label + arrow icon) for all top-level rows. Implementation revealed this is wrong: `.link-title` is always a plain, non-interactive `<div>` — for parent rows the real interactive element is `div[data-has-children]`; for leaf rows it's the wrapping `<a href>`. A `:focus-visible` rule on `.link-title` would never fire, since a plain div is never in the tab order. The corrected selectors are:
- `c-menu-drawer .c-menu-drawer div[data-has-children]` (parent toggle rows)
- `c-menu-drawer .c-menu-drawer [data-menu="main"] > .link-item > a` (top-level leaf links only — the `[data-menu="main"] >` prefix excludes sub-links, which share the same `.link-item > a` shape one level deeper)
- `c-menu-drawer .c-submenu-drawer .sublink-title` (sub-links — already the anchor itself, no change needed here)

Each gets `padding-inline` + a matching negative `margin-inline` (so the box extends slightly beyond the text without shifting the text's horizontal position) plus `border-radius`. No full-bleed row change and no `.link-item`/container padding changes, per the Non-Goals above.

**5. `-webkit-tap-highlight-color: transparent` is added to `.sublink-title` alongside the existing declaration on `div[data-has-children]`.**
Without this, mobile taps on a sub-link would show the browser's native blue flash immediately followed by (or underneath) the new gray `:active` box — a visible double-flash. `[data-submenu-close]` is intentionally left out since it's out of scope and keeps its existing native tap highlight, unchanged from today.

**6. Color value is a hardcoded flat gray, not a new CSS custom property.**
`sections/customcode-menu-drawer.liquid` already hardcodes flat colors directly in this same `{% style %}` block (e.g. `.menu-footer {background: #eee;}`), and no theme-wide "hover background" token exists in `base.css` to reuse instead. A hardcoded value (e.g. `#f0f0f0`) matches this file's existing local convention rather than introducing a new abstraction for a single component.

**7. The hamburger trigger, parent toggle rows, and back/close row each get `tabindex="0"`, `role="button"`, and a keydown handler that calls `.click()` on Enter/Space.**
All three are plain `<div>`s driven entirely by `addEventListener('click', ...)` in `CMenuDrawer`. Rather than duplicate each element's open/close logic inside a separate keydown branch, the keydown handler simply invokes the element's own `.click()`, which re-fires the existing click listener — one source of truth for the behavior, keyboard or mouse. `role="button"` gives them the correct exposed role (they act as toggles/triggers, not links). Their accessible name comes from existing visible text content (`{{ link.title }}` on parent rows, the label text on the back row) except the hamburger, which is icon-only and needs an explicit `aria-label`.

**8. `aria-expanded` is added to the hamburger trigger and to each `div[data-has-children]`, toggled in JS alongside their existing `is-active`/open-state class changes.**
This is the standard ARIA disclosure pattern (WCAG 4.1.2 Name/Role/Value) — a `role="button"` that shows/hides content must expose whether that content is currently shown. No new state is introduced; the JS already knows exactly when a submenu or the drawer opens/closes, so this is read off existing logic, not new bookkeeping.

**9. `<c-menu-drawer>` and each `.c-submenu-drawer` are `inert` by default in the markup (both start closed), with `inert` removed/re-added in JS exactly where `is-active` is added/removed.**
This is what actually closes the screen-reader/tab-order gap: `transform`-based hiding alone leaves off-screen content fully focusable and announced. `inert` (native, broadly supported in evergreen browsers) removes an element's entire subtree from both the tab order and the accessibility tree in one attribute, without needing to hand-manage `tabindex="-1"` on every descendant link individually. Toggling it at exactly the two places `is-active` already toggles (root drawer open/close, individual submenu open/close) keeps the two states from ever drifting apart.

**10. `CMenuDrawer.bindHamburger` / `bindCloseButtons` / `bindOverlayClick` are consolidated into `open()` / `close()` methods.**
Three separate click handlers previously duplicated (or, for the overlay, were about to duplicate a third time) the same "toggle `is-active`, show/hide overlay" sequence. Adding `inert` and `aria-expanded` toggling to that sequence made the duplication worth removing at the same time — `open()`/`close()` are now the one place that sequence lives.

## Risks / Trade-offs

- **`-webkit-tap-highlight-color` is non-standard (WebKit/Blink-derived).** Firefox desktop ignores it silently — no risk, since there's nothing to suppress there in the first place (same accepted trade-off as the prior change).
- **`:focus-visible` browser support** is broad in current evergreen browsers; no fallback is planned since the theme doesn't otherwise polyfill it.
- **Excluding `[data-submenu-close]` from the *visual* background creates a minor inconsistency**: every other clickable row in the drawer gets the gray feedback except the back button (it does still become keyboard-operable). Accepted per explicit scope decision — it reads as a UI control (chevron + label acting as "back"), not a destination link, so the asymmetry is intentional rather than an oversight.
- **`inert` browser support**: broadly available in current evergreen Chrome/Edge/Firefox/Safari. No polyfill is added — consistent with the theme's existing reliance on modern browser features elsewhere (custom elements, `-webkit-tap-highlight-color`). Older browsers simply won't get the tab-order fix; they're no worse off than today.
- **No focus trapping and no Escape-to-close**: a keyboard user can still Tab past the last item in an open drawer out into the rest of the page (rather than cycling back to the first item), and there's no keyboard shortcut to close the drawer short of tabbing to the explicit close button. Called out as a Non-Goal — `inert` fixes the specific "phantom hidden content" failure mode this change targets; full modal focus-trap behavior is a larger, separate enhancement.
- **`div[data-has-children]` keydown calls `.click()` rather than reimplementing the open logic.** This relies on synthetic `.click()` correctly re-dispatching to the same listener — standard DOM behavior, but worth noting as the mechanism if this ever needs debugging.
