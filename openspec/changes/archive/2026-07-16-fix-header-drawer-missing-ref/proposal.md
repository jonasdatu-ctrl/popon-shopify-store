## Why

Every storefront page throws `Uncaught MissingRefError: Required ref "details" not found in component header-drawer` in the console (`assets/component.js:121`, via `assets/header-drawer.js` `connectedCallback`). The cause: `snippets/header-drawer.liquid` has its entire drawer body — including the `<details ref="details">` element — wrapped in `{% comment %}...{% endcomment %}` (lines 36-620), left over from when the site's custom mobile menu (`<c-menu-drawer>`, in `sections/customcode-menu-drawer.liquid` + `snippets/customcode-scripts.liquid`) was built to replace it. Only the hamburger trigger div (`[data-menu-trigger]`) was left rendering, wired up to the custom drawer's own click handler.

`HeaderDrawer` (`assets/header-drawer.js`) still declares `requiredRefs = ['details']`, so `Component#updateRefs` throws on every connect, since the built-in drawer markup that would provide that ref is intentionally disabled. This is a real console error on every page load in production, not just a dev artifact.

## What Changes

- Stop `HeaderDrawer` from requiring a `details` ref, since the built-in drawer markup is deliberately disabled site-wide in favor of `<c-menu-drawer>`.
- Guard the code paths inside `HeaderDrawer` that dereference `this.refs.details` so they no-op safely instead of throwing when the ref is absent (closes a related crash that a naive "just drop the required ref" fix would reopen on `Escape` keyup).
- No Liquid, CSS, or custom-drawer changes. The hamburger trigger, its CSS (`.header-drawer` class/tag selectors, `.header--desktop header-menu + .header__drawer header-drawer`), the Shopify theme-editor's block-selection overlay (`assets/theme-editor.js`, which selects by the `header-drawer` tag), and the entire `<c-menu-drawer>` custom drawer stay untouched.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — this is a bug fix to existing (unspecified) component behavior; no product-facing requirement changes.

## Impact

- `assets/header-drawer.js`: drop `details` from `requiredRefs`; add early-return guards where `this.refs.details` is dereferenced.
- No other files change. `snippets/header-drawer.liquid`, the custom drawer files, CSS, and `theme-editor.js` are unaffected.
- Resolves the `MissingRefError` console error on every page; no visible/behavioral change to the mobile menu, which continues to be driven entirely by `<c-menu-drawer>`.
