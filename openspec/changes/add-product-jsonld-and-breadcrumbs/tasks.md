## 1. Audit remaining product/collection templates

- [x] 1.1 List every `templates/product.*.json` file, confirm which section (`product-information` vs `customcode-featured-product` vs other) is live on each, and record any template that doesn't match the already-confirmed disabled-section pattern, so the fix is verified against the full set, not just the 13 checked during exploration — audited all 32 files; all match the pattern (`product-information` disabled, `customcode-featured-product` live) EXCEPT `product.pop-on-main-pdp.json`, where `customcode-featured-product` is *also* disabled, leaving zero live content sections. Flagged as likely a stale/orphaned template — does not block this change since the fix is applied at the section level.
- [x] 1.2 Do the same audit for every `templates/collection.*.json` file against `main-collection` / `customcode-main-collection` — audited all 3 files; all consistently have `main-collection` disabled and `customcode-main-collection` live (no exceptions). `collection.pop-on-bling.json` has two live `customcode-main-collection` instances (one capped at 6 products, one uncapped).
- [x] 1.3 Confirm how `section.settings.product` is populated on `customcode-featured-product` for each product template (picker preset to the page's product vs. relying on page context), noting any template where it is NOT reliably the current product — the section doesn't use a `product` setting at all; it resolves `c_product` as `product` (the global object, reliably bound to the current product on every real product-page route) with `section.settings.product_override` only as a fallback for non-PDP embeds. Reliable on every product page by construction.

## 2. Product JSON-LD fix

- [x] 2.1 Add a `structured_data`-based `Product` JSON-LD script to `sections/customcode-featured-product.liquid`, sourced from whatever reliably resolves to the current product per 1.3 (falling back to `closest.product` if `section.settings.product` is unset), and verify via Shopify theme preview that the veneer PDP now outputs a `Product` script containing name, brand, price, currency, availability, image, URL, and condition — added `{{ c_product | structured_data }}` script guarded to skip the `propod` handle (see 2.4). Static Liquid validation via `shopify theme check` passes with no new offenses. **Live theme-preview verification not performed — this environment has no authenticated Shopify CLI session or store connection; needs to be checked by the user in a theme preview.**
- [ ] 2.2 Spot-check 3-5 other product templates from the audit in 1.1 (including at least one variant-heavy product and one with a set barcode) in theme preview and verify each renders exactly one `Product` JSON-LD block with correct field values matching the visible page
- [ ] 2.3 Verify a product with no barcode/GTIN set still renders valid `Product` JSON-LD with SKU present and GTIN omitted (not empty/null)
- [x] 2.4 Resolve the `propod` duplicate-schema conflict per design.md Decision 2 (guard in the new code, or remove the legacy block in `snippets/customcode-schema-tags.liquid`) and verify the `propod` product page renders exactly one `Product` JSON-LD block — took the guard option: the new script only renders `{% if c_product and c_product.handle != 'propod' %}`, leaving the legacy `customcode-schema-tags.liquid` block as the sole source for that one product. Legacy snippet left untouched.
- [ ] 2.5 Verify with Google's Rich Results Test (or equivalent structured-data validator) against a live/preview PDP URL that the `Product` block passes with no errors

## 3. Breadcrumb JSON-LD on product pages

- [x] 3.1 Implement a breadcrumb-building snippet that resolves the collection tier per design.md Decision 3 (page `collection` → `product.collections | first` → no collection tier) and emits a well-formed `BreadcrumbList` (sequential `position`, `name`, absolute `item` URL per entry) — created `snippets/customcode-breadcrumb-jsonld.liquid`, resolving the collection tier via `closest.collection` (the modern equivalent of the page's `collection` context) falling back to `crumb_product.collections.first`, then Home+Product only.
- [x] 3.2 Render the breadcrumb snippet on the product page template(s) so it fires alongside the Product JSON-LD fix from section 2 — rendered from `customcode-featured-product.liquid`, gated to `{% if product %}` so it only fires on genuine product-page routes (not merchandising embeds elsewhere).
- [ ] 3.3 Verify in theme preview: a product whose page has collection-scoped context renders `Home ▸ {collection} ▸ {product}`
- [ ] 3.4 Verify in theme preview: a product with no page-level collection context but with at least one associated collection renders `Home ▸ {product's first collection} ▸ {product}`
- [ ] 3.5 Verify in theme preview: a product with zero associated collections renders `Home ▸ {product}` (two items), not an omitted or malformed BreadcrumbList
- [ ] 3.6 Validate the BreadcrumbList output against a structured-data validator for at least one product in each of the three scenarios above

## 4. ItemList JSON-LD on collection pages

- [x] 4.1 Extract or mirror the effective product-set computation from `sections/customcode-main-collection.liquid` (`collection_override` default `collection`, `max_products` default full size) into a form reusable for JSON-LD generation — reused the section's own existing `new_collection`/`max_products` variables directly (no duplication needed since the ItemList is rendered from within the same section, right after those are computed).
- [x] 4.2 Render an `ItemList` JSON-LD block on collection pages using that effective set, with sequential `position`, product `name`, and absolute product URL per entry — added inline in `customcode-main-collection.liquid`, looping `new_collection.products limit: max_products`. Note: `collection.pop-on-bling.json` has two live instances of this section, so that page will correctly render two ItemList blocks, one per rendered grid, matching what's actually on the page.
- [ ] 4.3 Verify in theme preview: a collection page with no override/limit produces an ItemList with one entry per visibly rendered product, in display order
- [ ] 4.4 Verify in theme preview: a collection page configured with a `collection_override` produces an ItemList matching the overridden collection's products, not the page's own collection
- [ ] 4.5 Verify in theme preview: a collection page configured with `max_products` produces an ItemList capped at that same count
- [ ] 4.6 Validate the ItemList output against a structured-data validator for at least one collection page

## 5. Regression check

- [ ] 5.1 Confirm no visible page content, layout, or styling changed on the audited product and collection pages (JSON-LD is additive-only) by comparing before/after screenshots or DOM diffs excluding `<script type="application/ld+json">` tags
- [ ] 5.2 Confirm existing schema already on the site (Organization schema in `sections/header.liquid`, blog post schema in `sections/main-blog-post.liquid`) is unaffected
