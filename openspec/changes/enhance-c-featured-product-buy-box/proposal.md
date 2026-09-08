## Why

The "Pop On Sports Guard" buy box design (`context/pop-on-guard-buy-box.png`) needs a standalone, variant-reactive price line and a compact row of icon+text trust badges beneath the Add to Cart button. Neither exists in `customcode-featured-product.liquid` (the `<c-featured-product>` section) today — price only ever appears inside the Add to Cart button or per-swatch, and the only icon+text blocks in the theme (`icon-text`, `icon-list`, `icon-text-card`) are native `/blocks` files built for full-width marketing grids, not this section's legacy inline-block pattern. The reference design's selected-swatch treatment (a checkmark badge) also differs from the section's current border-highlight style. Building these as reusable, non-dev-configurable blocks lets this buy box (and future ones) be assembled from settings instead of one-off markup.

## What Changes

- Add a new `price` block type to `customcode-featured-product.liquid`'s schema: renders the current variant's price (respecting the existing `customcode_price_display` metafield override), and updates live by listening for the `variant-changed` event already dispatched by `c-general-variant-selector` onto the shared `<c-featured-product>` ancestor — the same pattern the existing `selling_plan` block already uses. No changes to the variant selector's own price logic.
- Add a new `icon_badges` block type to the same section: two single-line text settings (`icon_urls`, `texts`), each `|`-separated; values are zipped by index into icon+text pairs. Renders as an auto-fit CSS grid with a max-width cap per pair, so 1-2 badges stay compact and centered instead of stretching. A pair with only an icon or only text still renders (icon-only or text-only badge) rather than being dropped.
- Add a configurable selection-indicator style to the variant selector (`customcode-general-variant-selector.liquid` and its `variant_selector` block settings): a checkmark badge option alongside the existing border-highlight, so this buy box can opt into the reference design without changing the default look on other products already using this block.
- Wire the new blocks (and a `blurb_text` eyebrow/description) into `templates/product.product-sports-guard.json`'s existing `customcode_featured_product_HRwfDi` section so the live Pop On Sports Guard PDP matches the reference design.

## Capabilities

### New Capabilities
- `featured-product-price-block`: a `customcode-featured-product` block that displays and live-updates the current variant's price.
- `featured-product-icon-badges`: a `customcode-featured-product` block that parses two pipe-separated text lists into an auto-arranging grid of icon+text trust badges.
- `variant-selector-checkmark-indicator`: a configurable selected-swatch indicator style for `customcode-general-variant-selector`.

### Modified Capabilities
None — the price and icon-badges blocks are new inline block types (additive schema entries), and the checkmark indicator is an opt-in setting that preserves the existing border-highlight as the default, so no previously-specified behavior changes.

## Impact

- `sections/customcode-featured-product.liquid` — new `price` and `icon_badges` cases in the block-render loop, plus their schema entries.
- `snippets/customcode-scripts.liquid` — new `c-price` custom element (listens for `variant-changed`); no changes to `GVariantSelector`'s dispatch logic.
- `snippets/customcode-styles.liquid` — styles for the new price and icon-badge blocks, plus the checkmark indicator variant for `c-general-variant-selector`.
- `snippets/customcode-general-variant-selector.liquid` — indicator markup driven by a new block setting.
- `templates/product.product-sports-guard.json` — new block instances and copy so the live PDP reflects the reference design.
