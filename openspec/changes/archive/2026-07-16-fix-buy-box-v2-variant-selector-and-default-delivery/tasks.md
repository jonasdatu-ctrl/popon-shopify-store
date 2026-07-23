# Tasks: Fix Buy Box V2 variant selector and default delivery selection

## 1. Hide variant selector for default-only products

- [x] 1.1 In `snippets/customcode-buy-box-v2.liquid`, replace the `{% if product.options_with_values.size != 0 %}` guard around `.cbb-variant-container` with `{% unless product.has_only_default_variant %}`

## 2. Honor default selector and persist delivery choice

- [x] 2.1 In `snippets/customcode-scripts.liquid` (`CBuyBoxV2.updateState()`), keep `this.selectedDeliveryId` when it is still valid for the newly resolved variant (`'otp'` always valid; `sub-<id>` valid iff the variant's `selling_plan_allocations` includes that `selling_plan_id`)
- [x] 2.2 When no valid prior choice exists, resolve the default from `this.defaultSelector`: no allocations → `'otp'`; `'subs'` → `sub-` + first allocation's `selling_plan_id`; otherwise → `'otp'`

## 3. Verify

- [x] 3.1 Confirm `renderDeliveryOptions()` renders correct checked/active state for both `otp` and `subs` defaults and after variant switches (no `startsWith` call on an undefined `selectedDeliveryId`)
- [x] 3.2 Run `shopify theme check` (or review diff) to confirm no liquid syntax errors
