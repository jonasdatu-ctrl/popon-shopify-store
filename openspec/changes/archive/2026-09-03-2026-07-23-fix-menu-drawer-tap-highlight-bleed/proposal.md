## Why

On mobile, tapping a sub-link inside an open `.c-submenu-drawer` (e.g. a "SHOP" category link) visibly flashes the parent nav row that opened the drawer (e.g. "SHOP ▸") in blue, not the sub-link the customer actually tapped. Customers read this as "I tapped the wrong thing."

Root cause: in `sections/customcode-menu-drawer.liquid`, `.c-submenu-drawer` is rendered as a DOM *descendant* of `div[data-has-children]` — the same element that carries `cursor: pointer` and the click listener (`bindMenuLinks` in `snippets/customcode-scripts.liquid`) that opens the drawer. Tapping a sub-link bubbles the click up through that ancestor. The JS handler already guards against this correctly (`if (e.target.closest('.c-submenu-drawer')) return;`), but the browser's own native `-webkit-tap-highlight-color` feedback isn't gated by that guard — it paints on the ancestor `div[data-has-children]`'s box regardless. No file in the theme currently sets `-webkit-tap-highlight-color` anywhere, so every tappable element (including this one) uses the browser default, which is why this has gone unnoticed elsewhere: it's only visually confusing here because of the specific parent/descendant nesting.

Confirmed via DevTools: setting `-webkit-tap-highlight-color: transparent` on `div[data-has-children]` eliminates the erroneous flash.

## What Changes

- Add `-webkit-tap-highlight-color: transparent;` to the existing CSS rule that already targets the clickable wrapper: `c-menu-drawer .c-menu-drawer div[data-has-children]` (`sections/customcode-menu-drawer.liquid`, currently just `{cursor: pointer;}`).
- No JS changes — `bindMenuLinks`'s click-bubbling guard is already correct; this is purely a native-browser-feedback issue.
- No global tap-highlight reset. Every other tappable element (sub-links, `[data-submenu-close]`, `[data-menu-close]`, the hamburger trigger, and everything else site-wide) keeps its native tap-highlight feedback untouched.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — this is a bug fix to existing (unspecified) UI feedback behavior; no product-facing requirement changes.

## Impact

- `sections/customcode-menu-drawer.liquid`: one CSS property added to one existing selector.
- No other files change.
- Fixes: the parent nav row no longer flashes blue when a customer taps a sub-link in its open submenu drawer.
- Accepted trade-off: the parent row's own legitimate tap (the one that opens the drawer) also loses its native tap-highlight flash, since it's the same element/box — there's no way to suppress one without the other using this CSS property alone. Not addressed in this change; left as a possible follow-up if the header row is felt to need its own tap feedback.
