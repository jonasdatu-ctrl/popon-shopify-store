## Why

Every real product page on the storefront currently ships **zero** Product JSON-LD. The theme's stock `product-information` section (which auto-generates full Product schema via Shopify's `structured_data` filter) is disabled on every product template in favor of a custom `customcode-featured-product` section that never emits structured data at all. This means Google and AI shopping/answer engines cannot read basic product facts (name, brand, price, availability, image, SKU/GTIN, condition, URL) from the page's markup — they only see what a shopper sees visually, if that. Separately, no page ever tells a crawler how a product relates to the site's navigation (no BreadcrumbList) or what a collection actually contains as a structured list (no ItemList), leaving AI/Google to infer site structure rather than read it.

## What Changes

- Fix Product JSON-LD emission **site-wide** across all product templates (not just the veneer PDP), by rendering `closest.product | structured_data` (or equivalent) from the section that is actually live (`customcode-featured-product`), rather than re-enabling the disabled `product-information` section on 13+ templates individually.
- Add `BreadcrumbList` JSON-LD to product pages: `Home ▸ {collection} ▸ {product}` when a collection context is available (from the page's `collection` object, falling back to the product's first associated collection), degrading to `Home ▸ {product}` when the product has no collection at all. No visible breadcrumb UI exists today or is being added — this is structured-data only.
- Add `ItemList` JSON-LD to collection pages, enumerating the same effective product set the live `customcode-main-collection` section actually renders (respecting its `collection_override` and `max_products` settings), not raw `collection.products`.
- Leave the existing single-product hack (`snippets/customcode-schema-tags.liquid`, gated to `product.handle == 'propod'`) in place for now; design.md will note it as a candidate for retirement once the general fix covers that product too, but removing it is not required by this change.

**Explicitly out of scope** (deferred, not part of this change):
- Reviews / `ratingValue` / `reviewCount` / `aggregateRating` — already handled by the store's review app.
- `FAQPage` structured data — real FAQ content location not yet identified; will be a separate change.

## Capabilities

### New Capabilities
- `product-structured-data`: Product JSON-LD (name, brand, price, currency, availability, image, SKU/GTIN, condition, URL) emitted correctly on every product page template, sourced from the theme's live product section rather than the disabled stock section.
- `page-structure-structured-data`: BreadcrumbList JSON-LD on product pages and ItemList JSON-LD on collection pages, reflecting actual page/collection context.

### Modified Capabilities
- None — no existing spec capabilities cover structured data today.

## Impact

- **Affected sections**: `sections/customcode-featured-product.liquid` (needs to emit Product JSON-LD, currently silent), `sections/customcode-main-collection.liquid` (needs to emit ItemList), and wherever the new breadcrumb logic is rendered on product pages.
- **New/modified snippets**: likely a new reusable snippet for product structured data (parallel to the existing `customcode-schema-tags.liquid` pattern) plus a new breadcrumb snippet.
- **Affected templates**: all `templates/product.*.json` files (13+ confirmed with the disabled-section bug; full audit of the remaining ones is part of this change) and all `templates/collection.*.json` files.
- **No visible UI changes** — this change is additive structured data only; no existing visual section, price, image, or copy changes.
- **Dependencies**: relies on Shopify's native `structured_data` Liquid filter (no new external libraries or apps).
