# Proposal

## Why

When "Pop On Fangs (With Impression Kit)" is in the cart, the Rebuy cross-sell widget suggests "Complete Your Fangs with Matching Lower Veneers". An automatic Shopify discount further reduces that product once it is added, but the widget renders the pre-discount price (currently $149.00 sale / $499.00 compare-at). The price shown on the suggestion doesn't match what the customer actually pays, so the upsell undersells the offer.

## What Changes

- Add a small script to the plain `<script>` block of `snippets/rebuy-cart-template.liquid` that rewrites the sale price and compare-at price shown on the "Complete Your Fangs with Matching Lower Veneers" card in the Smart Cart cross-sell widget.
- The two displayed prices are exposed as named constants at the top of the script (`SALE_PRICE = "$X.00"`, `COMPARE_AT_PRICE = "$Y.00"`) so they can be edited in one place. They ship as `$X.00` / `$Y.00` placeholders to be filled in by the store owner.
- The override is display-only and re-applies whenever Rebuy re-renders the widget.
- No other product card in the widget is affected. No cart gating is added: the widget's own rules decide when the card appears.

## Capabilities

### New Capabilities

### Modified Capabilities
- `rebuy-smart-cart`: adds a requirement that the "Complete Your Fangs with Matching Lower Veneers" cross-sell card displays configured override prices instead of Rebuy's default prices.

## Impact

- **Code**: `snippets/rebuy-cart-template.liquid` (script block only; the Vue template is untouched).
- **Spec**: `openspec/specs/rebuy-smart-cart/spec.md` (delta).
- **Systems**: Rebuy widget 273083 output is patched in the DOM. Nothing changes in Rebuy admin, the Shopify automatic discount, or checkout pricing.
- **Risk**: the displayed prices are hardcoded and are not linked to the automatic discount. If the discount changes, the constants must be updated manually.
