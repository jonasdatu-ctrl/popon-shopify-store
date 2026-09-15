## Context

See proposal.md - Why/What Changes for motivation and scope.

Relevant current state, confirmed by reading the theme:

- The stock Horizon section `sections/product-information.liquid` renders `{{ closest.product | structured_data }}`, which auto-generates a complete `Product` JSON-LD block (name, image, SKU, GTIN, brand from vendor, offers with price/currency/availability/URL, itemCondition). This section is set `"disabled": true` in every product template checked (13+ templates, including `product.pop-on-main-pdp.json`).
- The section that is actually live/visible on those same templates, `sections/customcode-featured-product.liquid`, is a fork of Shopify's stock `sections/featured-product.liquid`. The stock version has `{{ section.settings.product | structured_data }}`; the fork dropped that line. It references the product via `section.settings.product` (a product picker setting), not `closest.product`.
- `snippets/customcode-schema-tags.liquid` is rendered globally from `layout/theme.liquid` and hand-writes a `Product` block only for `product.handle == 'propod'`. It predates this change and is left in place (see Decisions).
- No breadcrumb UI exists anywhere in the theme. Product links site-wide (product cards, collection grids) are built as plain `/products/<handle>`, with no `within:` filter — so Shopify's automatic `collection` object on product-page routes is essentially never populated through normal on-site navigation. The `product.collections | first` fallback is therefore the dominant path, not an edge case (confirmed with the user).
- Collection pages have the same disabled/live split: `main-collection` (stock) is disabled, `customcode-main-collection` is live. The live section computes its rendered set as `section.settings.collection_override | default: collection`, capped by `section.settings.max_products | default: <full size>`, with no `paginate` tag (single page, no cross-page ItemList concerns).

## Goals / Non-Goals

**Goals:**
- Every product page template emits one correct `Product` JSON-LD block, sourced from the section that is actually rendered.
- Every product page emits a `BreadcrumbList` per the priority order in specs/page-structure-structured-data.
- Every collection page emits an `ItemList` matching the live section's actual rendered product set.
- A single fix point per concern (one snippet each, reused everywhere) rather than per-template edits, so future templates inherit correct behavior automatically.

**Non-Goals:**
- Reviews/`aggregateRating`, `FAQPage` — explicitly deferred (see proposal.md).
- Adding a visible breadcrumb UI — JSON-LD only.
- Retiring or refactoring `customcode-schema-tags.liquid` beyond what's needed to avoid a duplicate `Product` block for `propod` (see Decisions).
- Changing how products are linked to collections elsewhere in the theme (e.g. adding `within:` to product card links) — out of scope; the breadcrumb logic works with the current link structure as-is.

## Decisions

**1. Fix Product JSON-LD by rendering it from `customcode-featured-product.liquid`, not by re-enabling `product-information`.**
Re-enabling the disabled stock section on 13+ templates would require editing every template JSON and risks visual regressions (the stock section still renders its own product markup, just currently hidden). Instead, port the missing `{{ section.settings.product | structured_data }}` line (adapted to whatever product reference the live section already resolves) directly into `customcode-featured-product.liquid`. One file, fixes every current and future template that uses this section.
*Alternative considered*: re-enable `product-information` but hide it visually (e.g. `display: none` via section settings). Rejected — fragile (depends on no future CSS/settings change re-exposing it), and duplicates a section's render cost for a single script tag.

**2. Guard against double `Product` JSON-LD for `propod`.**
`customcode-schema-tags.liquid` already emits a `Product` block for that one handle. Once the general fix lands, `propod`'s page would get two. Resolve by having the general snippet skip emission when `product.handle == 'propod'` (mirroring the existing guard), or by deleting the `propod`-specific block once the general version is verified to cover it correctly (richer data: GTIN, condition, availability that the hand-written version lacks). Recommend the latter once verified in a preview, but implementation may choose the safer skip-guard first and remove the legacy snippet in a follow-up.

**3. Breadcrumb collection-tier resolution order: page `collection` → `product.collections | first` → omit collection tier.**
Matches the user's confirmed priority and acknowledges that the first branch will rarely fire given current link structure — the design still checks it first so behavior is correct if link structure changes later (e.g. someone adds `within:` to a product card).

**4. ItemList walks the same `collection_override`/`max_products` logic as `customcode-main-collection.liquid`.**
Emitting ItemList from a copy of that same effective-collection computation (rather than a fresh `collection.products` loop) keeps the schema truthful to what's rendered. Implementation should compute this once per page render and reuse it for both the visible grid and the ItemList, rather than duplicating the override/limit logic in two places.

## Risks / Trade-offs

- **[Risk]** Porting `structured_data` into `customcode-featured-product.liquid` assumes `section.settings.product` (or equivalent) reliably resolves to the correct product on every template that uses this section, including any non-PDP uses (e.g. a "featured product" merchandising block on a non-product page, if any exist) → **Mitigation**: verify during implementation that every template rendering this section in a product-page context has `section.settings.product` bound to the current product (either via the picker being pre-set to the page's product, or by falling back to `closest.product` when on a product-page route); confirm no unintended `Product` JSON-LD appears on non-product pages that happen to embed this section for merchandising.
- **[Risk]** GTIN/item condition data availability in Shopify admin is unconfirmed (barcode field usage, condition assumption of "NewCondition") → **Mitigation**: `structured_data` filter already handles the "field absent → omit" case per its own behavior; implementation should not need custom logic here, but this should be spot-checked against a few real products during implementation.
- **[Risk]** Breadcrumb's dominant fallback path (`product.collections | first`) is sensitive to how a product's collections are ordered in Shopify admin, which may not reflect an intended "primary" category → **Mitigation**: accepted as a known limitation per the user's confirmed decision; not blocking.
- **[Trade-off]** Not retiring `customcode-schema-tags.liquid` immediately keeps a redundant, narrower code path alive rather than consolidating everything into the new general mechanism → accepted for this change to limit blast radius; flagged for a follow-up cleanup.

## Open Questions

- Whether to delete `customcode-schema-tags.liquid`'s `propod` block outright in this change, or land a guard now and remove it in a follow-up once the general fix is verified live (see Decision 2). Either resolves the duplicate-schema requirement; does not change the spec or task breakdown, so left to implementation judgment.
