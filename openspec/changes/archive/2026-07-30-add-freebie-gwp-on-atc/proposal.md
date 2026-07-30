## Why

`snippets/customcode-scripts.liquid` currently auto-detects a `?variantgift=` URL param and silently adds that variant to the cart on page load, on every page, with no cart-line properties and no link back to what the customer is actually buying. This makes the gift-with-purchase (GWP) unrelated to a specific add-to-cart action, invisible in order data (no way to tell which line was the free gift or which purchase it belongs to), and not scoped to product pages.

## What Changes

- **BREAKING**: Remove the page-load auto-add behavior (`giftVariantId` extraction and `processGiftVariant`) from `snippets/customcode-scripts.liquid`. The gift variant is no longer added on `window load`.
- Add GWP handling to `CBuyButton.handleClick` (the `<c-buy-button>` custom element's add-to-cart handler), gated to product pages (`template.name == 'product'`) with a `?variantgift=` param present:
  - The main product add gets two extra cart-line properties: `_freebiegwp` (an ISO timestamp shared by the pair) and `_freebiegwp_role: "main"`.
  - After the main item is added, a new listener on the existing `main-variant:added` event fires a second `/cart/add.js` call for the freebie variant, tagged with the same `_freebiegwp` timestamp and `_freebiegwp_role: "freebie"`.
  - The freebie add is independent of the main add: if the freebie variant is sold out or invalid, it is silently skipped and the main product purchase is unaffected.
  - No dedupe: each add-to-cart click produces its own main+freebie set, correlated by the shared timestamp. Multiple sets can coexist in the cart.
  - Coexists with the existing upsell listener (`CProductUpsells`) on the same `main-variant:added` event without suppression.
- The unrelated `caseId`/`orderEmail` localStorage logic in the same script block is left untouched.

## Capabilities

### New Capabilities
- `freebie-gwp`: Add-to-cart-triggered gift-with-purchase behavior on `CBuyButton` — tags the main product and adds a correlated freebie line item when `?variantgift=` is present on a product page.

### Modified Capabilities
(none — no existing spec currently covers the old page-load gift-variant behavior)

## Impact

- `snippets/customcode-scripts.liquid`: remove the `giftVariantId`/`processGiftVariant`/window-load block; extend `CBuyButton.buildProductData`/`handleClick` and add a new `main-variant:added` listener for the freebie add.
- No changes to `assets/product-form.js`, theme blocks, or other ATC paths.
- Any external links/QR codes/emails using `?variantgift=` on a product page keep working, but the customer-facing effect changes: instead of an unconditional add on load, the freebie is now added at the same moment as the main product, only from a click on `<c-buy-button>`.
