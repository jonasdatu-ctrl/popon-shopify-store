## 1. Remove the old page-load auto-add

- [x] 1.1 In `snippets/customcode-scripts.liquid`, remove the `giftVariantId` extraction, the `processGiftVariant` function, and its `window.addEventListener('load', ...)` invocation.
- [x] 1.2 Keep the `caseId`/`orderEmail` extraction and `populateFields` logic in that same script block untouched.

## 2. Emit the product-page flag and read the gift param

- [x] 2.1 Near the top of the script block (where `caseId`/`orderEmail` are still read), emit a Liquid-derived boolean for `template.name == 'product'` and keep parsing `variantgift` from `URLSearchParams`, so both are available to `CBuyButton`.

## 3. Tag the main product add in `CBuyButton`

- [x] 3.1 In `CBuyButton.handleClick`, when the product-page flag is true and `variantgift` is present, generate a shared timestamp (`new Date().toISOString()`) once before the main `/cart/add.js` call.
- [x] 3.2 Extend `buildProductData` (or the call site) so the main item's `properties` include `_freebiegwp: <timestamp>` and `_freebiegwp_role: "main"` when the condition in 3.1 applies, without altering `properties` when it doesn't.
- [x] 3.3 Update the `main-variant:added` dispatch to carry the trigger condition, the shared timestamp, the `variantgift` id, and whether the main add succeeded, via `detail` (e.g. `{ success, freebieGwpTimestamp, freebieVariantId }`).

## 4. Add the freebie listener

- [x] 4.1 Add a new `main-variant:added` listener (sibling to `CProductUpsells`'s pattern, not merged into it) that reads `event.detail`.
- [x] 4.2 Guard on `event.detail.success` (or equivalent) so a failed main add never triggers a freebie add — `main-variant:added` currently fires from `handleClick`'s `finally` block regardless of outcome, so this check is required to avoid orphaned freebie lines.
- [x] 4.3 Guard on `freebieVariantId` being present (i.e. the trigger conditions from section 3 were met) before doing anything.
- [x] 4.4 Fire a separate `fetch('/cart/add.js', ...)` for `{ id: freebieVariantId, quantity: 1, properties: { _freebiegwp: <same timestamp>, _freebiegwp_role: "freebie" } }`.
- [x] 4.5 On a failed/non-ok response or thrown error from the freebie add, catch it and no-op — no retry, no error surfaced to the customer, no effect on the already-added main product.
- [x] 4.6 Do not add any cart-state check (e.g. fetching `/cart.js` to look for an existing freebie line) before this call — duplicates across clicks are expected and allowed.

## 5. Verify

- [x] 5.1 On a product page with `?variantgift=<valid-id>`, click add-to-cart and confirm two cart lines appear: main product with `_freebiegwp_role: main`, freebie with `_freebiegwp_role: freebie`, matching `_freebiegwp` timestamps (check via `/cart.js` or cart drawer line-item properties).
- [x] 5.2 Click add-to-cart a second time on the same page and confirm a second, independently-timestamped main+freebie pair is added (four lines total, not merged quantities).
- [x] 5.3 With `?variantgift=<sold-out-or-invalid-id>`, click add-to-cart and confirm the main product is added normally with its `_freebiegwp` properties, no freebie line appears, and no error is shown to the customer.
- [x] 5.4 On a non-product page/template that still renders `<c-buy-button>` (e.g. a `landing-pro-pods` page) with `?variantgift=` present, click add-to-cart and confirm only the main product is added with no `_freebiegwp` properties and no freebie line.
- [x] 5.5 On a product page with no `variantgift` param, click add-to-cart and confirm behavior is unchanged from before this change (no `_freebiegwp` properties).
- [x] 5.6 On a product that has both an active upsell selection and `?variantgift=` present, click add-to-cart and confirm all three lines (main, upsell, freebie) are added together.
- [x] 5.7 Confirm the removed page-load behavior no longer fires: loading any page with `?variantgift=<id>` in the URL (without clicking add-to-cart) does not add anything to the cart.
