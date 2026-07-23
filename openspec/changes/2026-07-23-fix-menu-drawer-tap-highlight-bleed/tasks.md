## 1. Apply the fix

- [x] 1.1 In `sections/customcode-menu-drawer.liquid`, add `-webkit-tap-highlight-color: transparent;` to the `c-menu-drawer .c-menu-drawer div[data-has-children]` rule (currently `{cursor: pointer;}`).

## 2. Verify no regressions

- [ ] 2.1 On a real mobile device, or Chrome DevTools with the Device Toolbar (touch emulation) enabled, open the nav drawer, open a submenu, tap a sub-link, and confirm the parent nav row (e.g. "SHOP ▸") no longer flashes blue.
- [ ] 2.2 Confirm sub-links, `[data-submenu-close]`, `[data-menu-close]`, and the hamburger trigger all still show their native tap-highlight flash (i.e., the fix wasn't accidentally applied more broadly).
- [ ] 2.3 Confirm opening/closing the main drawer and submenu, and the overlay click-to-close, all still work exactly as before (no functional regression — this is a CSS-only change).
