## Why

The Pop On Night Guard product needs a dedicated hero section matching an approved design (see `context/hero-section.png`): a two-column banner with a colored content panel on one side and product photography on the other. No existing theme section or block supports this layout, and the product's template (`templates/product.product-night-guard.json`) currently has no hero at all.

## What Changes

- Add a new native (Horizon-style, block-driven) section that renders a two-column layout: a color-background content column built from merchant-configurable blocks, and an image column with separate desktop/mobile image pickers.
- Add four new theme blocks to support the content column, reusing existing native `text` and `button` blocks where they already cover the need:
  - `text-badge`: small badge label + single-line eyebrow text + richtext heading
  - `icon-list`: up to 4 fixed icon+label pairs (image_picker + single-line text each)
  - `review-static`: static 5-star row + single-line trust text (not tied to the live reviews-app metafield)
  - `icon-text`: single icon + single-line text, for inline trust/assurance rows
- Section is responsive: at the theme's ≥750px breakpoint, content is left / image is right; below 750px, the layout stacks with the image on top and content below.
- Enable the section on `templates/product.product-night-guard.json` as the first (top-most) section on the page. No other sections in that template are modified; the existing (disabled) `main` product-information section is left as-is.

## Capabilities

### New Capabilities
- `night-guard-hero-section`: A responsive, block-driven hero section (color content panel + desktop/mobile product image) and its four supporting content blocks (text-badge, icon-list, review-static, icon-text), used as the top section of the Pop On Night Guard product template.

### Modified Capabilities
(none — no existing spec's requirements change)

## Impact

- New file: `sections/night-guard-hero.liquid` (or similar name, finalized in design.md)
- New files: `blocks/text-badge.liquid`, `blocks/icon-list.liquid`, `blocks/review-static.liquid`, `blocks/icon-text.liquid`
- Modified file: `templates/product.product-night-guard.json` (insert new section at top of `order`/`sections`)
- No changes to existing sections, blocks, or templates beyond the insertion above
- No new app or metafield dependencies
