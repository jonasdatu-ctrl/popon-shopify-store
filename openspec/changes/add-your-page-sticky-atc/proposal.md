## Why

On `your-*` handle pages, the main PDP (with its add-to-cart button) is rendered near the bottom, below a long stretch of marketing content. The existing sticky ATC only appears once the ATC has scrolled *above* the viewport, so while a shopper reads the marketing content — when the ATC is still *below* the viewport — no sticky call-to-action is shown at all. This leaves the entire top of the page without a persistent path to purchase.

## What Changes

- Add a new mobile-only sticky button section, placed in the template order immediately **before** the main PDP (`customcode-featured-product`) section.
- The button self-gates on `page.handle` starting with `your-`, rendering nothing on other pages so it is safe to reuse.
- The button is sticky-pinned to the bottom of the viewport (mobile only) and is shown **only while the main PDP's ATC is below the viewport**, closing the current coverage gap.
- The button hides once the ATC enters the viewport, handing off cleanly to the existing sticky ATC (which takes over once the ATC scrolls above the viewport). The two buttons never overlap and leave no dead zone.
- On click, the button smooth-scrolls to the main PDP's ATC (`<c-buy-button>`), matching the existing sticky ATC's scroll target.

## Capabilities

### New Capabilities
- `your-page-sticky-atc`: A mobile sticky button, gated to `your-*` handle pages, that provides a persistent scroll-to-ATC call-to-action while the main PDP is still below the viewport.

### Modified Capabilities
<!-- No existing spec-level requirements change; existing sticky ATC behavior is unchanged. -->

## Impact

- New section file: `sections/customcode-sticky-atc-scroll.liquid` (name TBD in design).
- New custom element + registration in `snippets/customcode-scripts.liquid` (mirrors `CStickyATC`).
- Possibly a small CSS addition in `snippets/customcode-styles.liquid` (reuses `.c-mobile` / `.c-sticky-action`).
- Placement into the `your-*` page template order (the section JSON), before `customcode-featured-product`.
- No change to the existing `customcode-sticky-atc` section or `<c-buy-button>` ATC.
