# buy-box-v2 Specification

## Purpose

Defines the behavior of the Buy Box V2 snippet (`snippets/customcode-buy-box-v2.liquid` with its `CBuyBoxV2` script) for variant option rendering and delivery option (one-time purchase vs. subscription) selection.

## Requirements

### Requirement: Variant selector hidden for default-only products

The Buy Box V2 snippet SHALL NOT render the variant option selector when the product has only Shopify's placeholder default variant (`product.has_only_default_variant` is true). For products with real options, the selector SHALL render as it does today.

#### Scenario: Product with no real variants

- **WHEN** the buy box renders for a product whose only variant is "Default Title"
- **THEN** no option label (e.g., "Title:") or value buttons are rendered, and the delivery options and add-to-cart button still function against that single variant

#### Scenario: Product with real variants

- **WHEN** the buy box renders for a product with one or more real options (e.g., Flavor)
- **THEN** each option renders with its label and value buttons, unchanged from current behavior

### Requirement: Default delivery option honors merchant setting

The widget SHALL preselect the delivery option according to the block's `default_selector` setting: `otp` preselects "Buy Once"; `subs` preselects the first subscription plan. When the current variant has no selling plan allocations, the widget SHALL preselect "Buy Once" regardless of the setting.

#### Scenario: Default set to One Time Purchase on a subscribable variant

- **WHEN** the buy box loads with `default_selector` = `otp` and the variant has subscription plans
- **THEN** the "Buy Once" radio is checked and its option is highlighted as active

#### Scenario: Default set to Subscription on a subscribable variant

- **WHEN** the buy box loads with `default_selector` = `subs` and the variant has subscription plans
- **THEN** the first subscription plan's radio is checked and the subscription group is highlighted as active

#### Scenario: Default set to Subscription on a variant without plans

- **WHEN** the buy box loads with `default_selector` = `subs` and the variant has no selling plan allocations
- **THEN** the "Buy Once" radio is checked

### Requirement: Customer delivery choice persists across variant changes

The widget SHALL preserve the customer's explicitly selected delivery option when the customer switches variants, as long as that choice remains valid for the new variant ("Buy Once" is always valid; a subscription choice is valid if the new variant offers a selling plan allocation with the same selling plan id). When the previous choice is invalid for the new variant, the widget SHALL fall back to the default-selection rule above.

#### Scenario: Buy Once persists across variant change

- **WHEN** the customer selects "Buy Once" and then switches to another variant
- **THEN** "Buy Once" remains selected

#### Scenario: Subscription plan persists when new variant offers the same plan

- **WHEN** the customer selects a subscription plan and switches to a variant that offers the same selling plan
- **THEN** that subscription plan remains selected

#### Scenario: Invalid subscription choice falls back to default

- **WHEN** the customer selects a subscription plan and switches to a variant that does not offer that plan
- **THEN** the selection falls back to the configured default (or "Buy Once" if the new variant has no plans)
