## Why

Cart line items added with a Shopify selling plan (subscriptions) show no indication of that plan in the Rebuy Smart Cart. The only subscription UI in `snippets/rebuy-cart-template.liquid` is the switch-to-subscription block (lines 213-225), gated behind `v-if="hasSwitchToSubscription(item)"` — a Rebuy admin feature that is only active for products configured for switching. Items with a selling plan on non-configured products render nothing, so customers can't tell they're about to buy a subscription. A secondary path — Rebuy's `itemDeliveryFrequency(item)` line (line 145) — is nested inside a wrapper gated by `v-if="hasItemProperties(item)"`, and native Shopify selling-plan items typically carry no line item properties, so it never renders either.

The theme's native cart snippet (`snippets/cart-products.liquid:205-207`) already prints `item.selling_plan_allocation.selling_plan.name` unconditionally, so the Rebuy override is the only cart surface missing this.

## What Changes

- Add a delivery-frequency indicator (e.g. "Delivery every 1 month", per the merchant-configured selling plan name) to each Rebuy Smart Cart line item that has a `selling_plan_allocation`, placed under the variant title.
- Hide the indicator when the switch-to-subscription block is shown for that item (`hasSwitchToSubscription(item)`), since that block's `<select>` already displays the current plan — avoids stating the plan twice.
- Add a small CSS rule in `snippets/customcode-styles.liquid` so the indicator reads as secondary line-item metadata.

## Capabilities

### New Capabilities
- `rebuy-smart-cart`: selling plan indicator on cart line items (first spec'd requirement for this surface).

### Modified Capabilities
None.

## Impact

- `snippets/rebuy-cart-template.liquid`: one new `<div>` in the item-info block.
- `snippets/customcode-styles.liquid`: one new style rule.
- No JS, Liquid section, or Rebuy admin configuration changes. Items without a selling plan render exactly as before.
