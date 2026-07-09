## 1. Add the indicator to the Rebuy cart template

- [x] 1.1 In `snippets/rebuy-cart-template.liquid`, directly after the `rebuy-cart__flyout-item-variant-title` div (line 142), add:
  `<div class="rebuy-cart__flyout-item-selling-plan" v-if="item.selling_plan_allocation && !hasSwitchToSubscription(item)" v-html="item.selling_plan_allocation.selling_plan.name"></div>`

## 2. Style it

- [x] 2.1 In `snippets/customcode-styles.liquid`, alongside the existing Rebuy cart one-liner rules (~line 991), add a muted small-text rule for `.rebuy-cart__flyout-item-selling-plan`.

## 3. Verify on the storefront

- [ ] 3.1 Add a product to the cart with a subscription plan selected (via Buy Box V2 or the featured-product buy box) and confirm the plan name (e.g. "Delivery every 1 month") appears under the variant title in the Rebuy cart flyout.
- [ ] 3.2 Add the same product as a one-time purchase and confirm no indicator renders.
- [ ] 3.3 If any product has Rebuy switch-to-subscription enabled, add it with a plan and confirm the frequency select shows (no duplicate plain-text plan line).
- [ ] 3.4 Confirm mixed carts (subscription + one-time items) render each item correctly.
