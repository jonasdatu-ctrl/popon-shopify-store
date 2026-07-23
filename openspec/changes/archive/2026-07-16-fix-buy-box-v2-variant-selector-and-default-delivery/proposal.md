# Fix Buy Box V2 variant selector and default delivery selection

## Why

The Buy Box V2 snippet has two customer-facing defects: products without real variants show a meaningless "Title: Default" selector, and the merchant-configurable "Default Selector" block setting (One Time Purchase vs Subscription) is ignored — the widget always preselects the first subscription plan when one exists. Additionally, switching variants silently resets the customer's chosen delivery option.

## What Changes

- Hide the variant option selector entirely when a product has only Shopify's placeholder default variant (currently the `options_with_values.size != 0` guard never fails, since Shopify always exposes a "Title"/"Default Title" option).
- Honor the `default_selector` block setting (`otp` or `subs`) when choosing which delivery option is preselected.
- Preserve the customer's manually chosen delivery option (one-time vs a specific subscription plan) across variant changes, falling back to the configured default only when the previous choice is invalid for the newly selected variant.

## Capabilities

### New Capabilities

- `buy-box-v2`: Behavior of the Buy Box V2 purchase widget — variant option rendering, delivery-option (OTP/subscription) defaulting and persistence, and add-to-cart. No spec exists yet for this custom code; this change introduces one covering the affected behaviors.

### Modified Capabilities

<!-- none — no existing specs in openspec/specs/ -->

## Impact

- `snippets/customcode-buy-box-v2.liquid` — variant selector render guard.
- `snippets/customcode-scripts.liquid` — `CBuyBoxV2` class (`updateState()` delivery-default logic).
- No schema changes: `sections/customcode-featured-product.liquid` already defines the `default_selector` setting; it just isn't consumed.
- Affects live product templates using the `buy_box_v2` block (pouch, oral mist, landing pages).
