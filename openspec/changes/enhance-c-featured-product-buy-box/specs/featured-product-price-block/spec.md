## Purpose

Defines the behavior of the `price` block in `customcode-featured-product`, which displays the current variant's price in the buy box and keeps it in sync as the customer changes variants, without a page reload.

## ADDED Requirements

### Requirement: Price block displays the current variant's price
The price block SHALL render the price of `product.selected_or_first_available_variant`, using the variant's `customcode_price_display` metafield override when present, and falling back to the variant's native price otherwise.

#### Scenario: Product with no price override
- **WHEN** a price block renders for a product whose variant has no `customcode_price_display` metafield
- **THEN** it displays the variant's native price, formatted without trailing zeros

#### Scenario: Product with a price override
- **WHEN** a price block renders for a variant that has a `customcode_price_display` metafield
- **THEN** it displays the overridden price value instead of the variant's native price

### Requirement: Price block updates live on variant change
The price block SHALL update its displayed price whenever a `variant-changed` event is dispatched on the enclosing `<c-featured-product>` element, without requiring a page reload.

#### Scenario: Customer switches variant
- **WHEN** the customer selects a different option value in the variant selector
- **THEN** the price block's displayed price updates to match the newly selected variant within the same interaction, with no page reload

#### Scenario: Product with only a default variant
- **WHEN** a price block renders on a product with only Shopify's default variant (no variant selector present)
- **THEN** it displays that variant's price correctly and does not error or wait indefinitely for a `variant-changed` event that will never fire

### Requirement: Compare-at price is optionally shown
The price block SHALL provide a setting to optionally show the variant's compare-at price (or its `customcode_price_display` override) struck through alongside the current price.

#### Scenario: Compare price enabled with a compare-at price set
- **WHEN** the compare-at display setting is enabled and the current variant has a compare-at price higher than its price
- **THEN** the compare-at price renders struck through next to the current price

#### Scenario: Compare price enabled with no compare-at price set
- **WHEN** the compare-at display setting is enabled but the current variant has no compare-at price
- **THEN** only the current price renders, with no empty strikethrough element left in the markup
