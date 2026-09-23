# Tasks

## 1. Price override script

- [x] 1.1 In the plain `<script>` block of `snippets/rebuy-cart-template.liquid`, add labelled constants `SALE_PRICE = "$X.00"` and `COMPARE_AT_PRICE = "$Y.00"` (plus the product ID `9313765326986`) with a comment that the prices mirror the automatic discount; verify they appear together at one clearly marked spot
- [ ] 1.2 Add a function that finds `.rebuy-product-block.product-id-9313765326986` inside `.rebuy-cart__flyout-recommendations` and writes the constants into the visible `span:not(.sr-only)` of `.rebuy-money.sale` and `.rebuy-money.compare-at`, only when the text differs; verify in the browser console that the card shows `$X.00` / `$Y.00` and that the `sr-only` labels are unchanged
- [ ] 1.3 Attach a single `MutationObserver` to `.rebuy-cart__flyout-recommendations` (lazily, once the container exists, from the existing `rebuy:smartcart.show` and `rebuy:cart.change` listeners) that re-runs the override on widget re-render; verify the override survives a cart change (e.g. adding and removing an item) and that the observer is not attached twice

## 2. Verification

- [ ] 2.1 With "Pop On Fangs (With Impression Kit)" in the cart, open the Smart Cart and verify the lower veneers card shows the override prices and the other card (e.g. Halloween Bling Bundle) still shows Rebuy's prices
- [ ] 2.2 Verify no console errors, no CPU spin or infinite mutation loop, and no visible price flash worth fixing, with the cart open for 30 seconds
- [ ] 2.3 Verify a cart that does not surface the lower veneers card behaves exactly as before

## 3. Before publishing

- [ ] 3.1 Replace the `$X.00` / `$Y.00` placeholders with the real prices before the theme goes live, and verify with a search that no `$X.00` / `$Y.00` remains in `snippets/rebuy-cart-template.liquid`
- [x] 3.2 Run `openspec validate override-lower-veneers-upsell-price` and verify it passes
