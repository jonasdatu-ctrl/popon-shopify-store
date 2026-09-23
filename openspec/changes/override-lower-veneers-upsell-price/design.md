# Design

## Context

The Smart Cart drawer is a Vue template in `snippets/rebuy-cart-template.liquid`. The cross-sell widget (Rebuy ID 273083) is mounted into `.rebuy-cart__flyout-recommendations` and rendered by Rebuy's widget engine from a template held in Rebuy admin, so the cart template cannot change what the widget prints. The plain `<script>` block at the bottom of the snippet already runs custom DOM logic on `rebuy:smartcart.show` and `rebuy:cart.change`, using fixed `setTimeout` delays to wait for widgets.

Widget card markup for the target product:

```
.rebuy-product-block.product-id-9313765326986
  .rebuy-product-price
    .rebuy-money.sale        > span.sr-only + span   (visible price)
    .rebuy-money.compare-at  > span.sr-only + span   (visible price)
```

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Change the visible sale and compare-at prices on one card, with the two values editable in one place.
- Keep the override in place across widget re-renders.

**Non-Goals:**
- No generic multi-product override mechanism; the target product is fixed.
- No cart-contents gating; the widget's own rules determine when the card appears.
- No link to the automatic discount, and no change to actual pricing.
- No change to the Rebuy widget template in Rebuy admin.

## Decisions

**1. Patch the DOM from the existing `<script>` block instead of editing the Rebuy widget template.**
The change stays in version control, needs no Rebuy admin access, and is scoped to the Smart Cart. Editing the widget template in Rebuy admin would be cleaner but is outside the repo and would apply everywhere the widget is used.

**2. Re-apply with a `MutationObserver` on `.rebuy-cart__flyout-recommendations`, not timeouts.**
Rebuy re-renders the widget on each cart change and the timing is not deterministic; the existing 500ms/1500ms timeouts are racy. The observer reacts to the actual render. The container may not exist when the script first runs (the cart template mounts later), so the observer is attached lazily on `rebuy:smartcart.show` and `rebuy:cart.change`, once the container exists, and only once. Observing the narrow container avoids the cost of watching all of `document.body`.

**3. Idempotent writes to prevent observer loops.**
The override only writes a node's text when it differs from the target, so its own edits do not trigger further work.

**4. Select by product ID class (`.product-id-9313765326986`), not by handle class.**
The ID is stable if the product is renamed or its handle changes.

**5. Only touch the visible price span (`span:not(.sr-only)`).**
Preserves the "Sale price" / "Original price" accessibility labels.

**6. Constants at the top of the script: `SALE_PRICE = "$X.00"`, `COMPARE_AT_PRICE = "$Y.00"`.**
Satisfies the "edit in one place" requirement. They ship as placeholders, per the store owner.

## Risks / Trade-offs

- [Displayed price drifts from the real discounted price if the automatic discount changes] → Values are constants next to a short comment noting they mirror the automatic discount; updating them is a one-line change.
- [Brief flash of Rebuy's default price before the observer fires] → Observer callbacks run right after DOM mutation, before the next paint in most cases; verify manually in the browser.
- [Placeholder `$X.00` / `$Y.00` would show literally if deployed unedited] → Called out in tasks; replace before publishing the theme.
- [Rebuy changes the widget's class names] → Selector misses and the default price shows (fails safe); no error is thrown.
