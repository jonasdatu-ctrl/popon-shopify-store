## Context

The Rebuy Smart Cart is a Vue template override (`snippets/rebuy-cart-template.liquid`). Each `item` in `v-for="item in items()"` is the Shopify AJAX cart (`/cart.js`) line item, enriched by Rebuy — so `item.selling_plan_allocation` is available directly in template expressions, with `selling_plan_allocation.selling_plan.name` holding the merchant-configured plan name (e.g. "Delivery every 1 month"). Both custom buy boxes (`c-featured-product` buy box and Buy Box V2 in `snippets/customcode-scripts.liquid`) add items with native `selling_plan` IDs, so subscription line items in this store always carry a `selling_plan_allocation`.

Existing subscription UI in the template:
- Lines 213-225: switch-to-subscription block, `v-if="hasSwitchToSubscription(item)"`. When active and the item is a subscription, its `<select>` displays the current frequency.
- Line 145: `itemDeliveryFrequency(item)` div, dead in practice — its parent wrapper requires `hasItemProperties(item)`, and native selling-plan items carry no properties.

## Goals / Non-Goals

**Goals:**
- Every line item with a selling plan visibly states its plan (e.g. "Delivery every 1 month") in the cart, with zero dependence on Rebuy admin configuration.
- No duplicate plan display when the switch-to-subscription select is already showing it.
- No change to items without a selling plan.

**Non-Goals:**
- Rewording/normalizing plan names in the cart (the merchant-configured selling plan name is displayed as-is; renaming plans is a subscription-app admin task).
- Fixing or relocating the dead `itemDeliveryFrequency` line inside the properties wrapper (left untouched; it still works for property-carrying app subscriptions if any appear).
- Any change to the theme's native cart (`snippets/cart-products.liquid`), which already shows the plan name.

## Decisions

**1. Display `item.selling_plan_allocation.selling_plan.name` directly** rather than Rebuy's `itemDeliveryFrequency()` helper. The allocation is guaranteed present on selling-plan items from `/cart.js`, independent of Rebuy configuration or line item properties; the helper's output depends on Rebuy's subscription integration state, which is exactly what's unreliable here. The plan name is the same string the PDP plan picker shows (`snippets/customcode-selling-plan.liquid` renders `selling_plan.name` as radio labels), so cart wording matches PDP wording.

**2. Gate with `v-if="item.selling_plan_allocation && !hasSwitchToSubscription(item)"`.** When `hasSwitchToSubscription(item)` is true and the item is a subscription, the existing `<select>` (line 217) shows the current plan, so the indicator would be redundant. When it is false — the common case for this store — the indicator is the only plan display.

**3. Placement: immediately after the variant-title div (line 142), before the discount message.** Plan identity is variant-level metadata; this mirrors where the native theme cart shows it (with the variant options) and keeps it above transactional noise (discounts, properties, quantity).

**4. Render with `v-html` bound to the name**, matching how every other item field in this template is rendered (`item.product_title`, `item.variant_title`), rather than mustache interpolation — this template mixes Liquid and Vue, and the existing convention avoids ambiguity.

**5. One CSS rule in `snippets/customcode-styles.liquid`** styling `.rebuy-cart__flyout-item-selling-plan` as small, muted text — consistent with the one-liner rule style already used for Rebuy cart overrides in that file (lines ~991-999).

## Risks / Trade-offs

- **Plan name wording is merchant-controlled.** If a plan is named something opaque (e.g. "Plan A"), the cart shows that. Accepted: the PDP already shows the same string, so the cart is never worse than the PDP; fixing wording is a subscription-app config task.
- **`hasSwitchToSubscription(item)` true but item not yet a subscription**: the block at 213 shows a "Switch to Subscription" button rather than the select. If such an item somehow also had a selling plan allocation, the indicator would be hidden. In practice `item.product.subscription` is true when the item has a plan, so the select shows and the plan is still visible. Accepted as a negligible edge.
- **Rebuy template versioning**: this is a copy of Rebuy's default template already heavily customized (announcement bars, BMSM, hidden items); one more small block does not change the upgrade story.
