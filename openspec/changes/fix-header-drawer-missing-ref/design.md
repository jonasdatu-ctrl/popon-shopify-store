## Context

`<header-drawer>` (`snippets/header-drawer.liquid`) renders inside `blocks/_header-menu.liquid`'s `mobile` variant, on every page that uses the standard header. It extends `Component` (`assets/component.js`), whose `connectedCallback` calls a private `#updateRefs()` that throws `MissingRefError` if any name in `requiredRefs` isn't found among descendant `[ref]` elements.

`HeaderDrawer` (`assets/header-drawer.js`) sets `requiredRefs = ['details']`. The `<details ref="details">` that used to satisfy this is now wrapped in `{% comment %}...{% endcomment %}` (the entire built-in drawer body, `snippets/header-drawer.liquid:36-620`), because the site replaced it with a custom drawer: `<c-menu-drawer>` (`sections/customcode-menu-drawer.liquid`), driven by `CMenuDrawer`/`bindHamburger()` in `snippets/customcode-scripts.liquid`, which binds directly to `document.querySelector('[data-menu-trigger]')` — the one element `header-drawer.liquid` still renders outside the comment.

Because `super.connectedCallback()` throws before `HeaderDrawer.connectedCallback` reaches its own body, today **no** `HeaderDrawer` listeners ever attach — not the ref check's throw, not the `keyup` listener, not the animated-element listeners. The component is fully inert; the custom drawer does 100% of the real work.

## Goals / Non-Goals

**Goals:**
- Eliminate the `MissingRefError` console error on every page.
- Preserve `<c-menu-drawer>` and the hamburger trigger exactly as they behave today.
- Preserve every non-JS dependency on the `<header-drawer>` tag/class: the component's own stylesheet (`.header--desktop header-menu + .header__drawer header-drawer`, `.header__drawer`, etc.), `base.css`'s `.header-drawer` product-card hover selectors, and `assets/theme-editor.js`'s block-selection overlay (registers `header-drawer` as a selector for the Shopify theme editor).
- Fix the root cause (the class's now-false assumption that `details` always exists) rather than only suppressing the visible symptom.

**Non-Goals:**
- Restoring or re-enabling the built-in drawer markup — that would create a second, competing mobile menu alongside `<c-menu-drawer>`.
- Removing the `<header-drawer>` custom element or restructuring `blocks/_header-menu.liquid` / `snippets/header-drawer.liquid` — unnecessary risk to CSS and theme-editor integration for no benefit.
- Touching `assets/component.js` (shared by every themed component, much larger blast radius than needed here).

## Decisions

**1. Fix lives entirely in `assets/header-drawer.js`.** This is the only file whose assumptions are wrong (that `details` always exists). `component.js` and the Liquid/CSS files reflect a still-valid contract elsewhere in the theme (other components genuinely require their refs); only `HeaderDrawer` for this specific rendering has none to give.

**2. Drop `'details'` from `requiredRefs`.**
```js
requiredRefs = []; // was ['details'] — the built-in drawer body is commented out
                    // in header-drawer.liquid; <c-menu-drawer> owns the mobile menu now.
```
This removes the throw at its source (`Component#updateRefs`).

**3. Guard `connectedCallback` so behavior stays inert when there's no drawer to manage**, matching today's de-facto behavior (nothing currently runs) rather than accidentally turning on dormant listeners:
```js
connectedCallback() {
  super.connectedCallback();
  if (!this.refs.details) return;
  this.addEventListener('keyup', this.#onKeyUp);
  this.#setupAnimatedElementListeners();
}
```
Without this guard, removing `requiredRefs` alone would let `connectedCallback` reach `this.addEventListener('keyup', this.#onKeyUp)`, which — if a user ever hit `Escape` while interacting with the trigger — would call `#onKeyUp` → `#close(this.#getDetailsElement(event))` → `details.querySelector(...)` on `undefined`, trading one crash for another, rarer one. The guard keeps the component a no-op, identical in effect to its current (accidentally inert) state, just without throwing.

**4. Leave `open()`, `close()`, `back()`, `toggle()`, `isOpen` unguarded.** These remain unreachable: nothing in the live DOM calls them (their only callers were the `on:click="header-drawer/..."` attributes inside the commented-out markup). Adding defensive guards to dead code is scope creep for a bug fix whose mandate is "don't change current functionality." If the built-in drawer markup is ever restored, `ref="details"` comes back too, and these methods work exactly as designed again.

## Risks / Trade-offs

- **A previously-impossible-to-reach `keyup` listener becomes reachable but no-ops immediately** (guarded by `if (!this.refs.details) return`). No observable behavior change.
- **`open()`/`close()`/`toggle()`/`back()` would throw if ever invoked externally** (e.g. from a future partial re-enable of the markup without restoring `ref="details"`). This mirrors the pre-existing implicit contract (`details` must exist to call these) — previously enforced by a hard crash at connect time, now simply unenforced. Acceptable: nothing in the current codebase calls these methods, and reintroducing any `on:click="header-drawer/..."` markup without its matching `ref="details"` would be a new bug, not a regression of this fix.
- **This is a workaround for dead markup, not a decision about the dead markup's fate.** The commented-out built-in drawer body (~580 lines) still sits in `header-drawer.liquid` unused. Whether to delete it outright or keep it as reference is a separate, non-urgent cleanup this change intentionally leaves alone.
