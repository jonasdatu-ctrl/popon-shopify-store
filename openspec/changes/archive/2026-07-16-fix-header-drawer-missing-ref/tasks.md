## 1. Fix the crash

- [x] 1.1 In `assets/header-drawer.js`, change `requiredRefs = ['details'];` to `requiredRefs = [];` with a comment noting the built-in drawer body is intentionally disabled in favor of `<c-menu-drawer>`.
- [x] 1.2 In `connectedCallback()`, add `if (!this.refs.details) return;` immediately after `super.connectedCallback();`, before attaching the `keyup` listener and calling `#setupAnimatedElementListeners()`.

## 2. Verify no regressions

- [ ] 2.1 Load a storefront page and confirm the `MissingRefError` no longer appears in the console.
- [ ] 2.2 Click the hamburger trigger and confirm `<c-menu-drawer>` still opens/closes exactly as before (main menu, submenus, back button, overlay click-to-close).
- [ ] 2.3 Confirm desktop layout is unaffected (`.header--desktop header-menu + .header__drawer header-drawer` hiding still works).
- [ ] 2.4 Open the Shopify theme editor and confirm the header menu block's selection/overlay highlighting still works (exercises `assets/theme-editor.js`'s `header-drawer` selector).
- [ ] 2.5 Press `Escape` with the hamburger/menu area focused and confirm nothing throws in the console.
