## Context

Fang (`templates/product.pop-on-fangs.json`) and VIP Fang (`templates/product.pop-on-vip-fang.json`) both use the `customcode-featured-product` section (`sections/customcode-featured-product.liquid`), shared by ~30 other product templates. Today each template's `block_order` is:

```
title → blurb → variant_selector → buy_button
→ accordion(1..6)
→ freebies_rAHLCH   (standalone block, renders snippets/customcode-freebies.liquid)
→ html (video)
```

The `accordion` block type already supports a `custom_liquid` setting (raw Liquid rendered inside the accordion body — see `sections/customcode-featured-product.liquid:1019-1023`). A prior, still-disabled trial of using this for embedded freebie-style content exists at `templates/product.spareveneers.json` block `accordion_aRPgb3`, which renders `{% render 'customcode-test-product-scroller' %}` — a self-contained snippet (own inline `{% style %}`, hardcoded image URLs/text, no block params). See `snippets/customcode-test-product-scroller.liquid`.

The freebie content on Fang/VIP Fang is identical on both templates today:

| Field | Value |
|---|---|
| title | "What's included FREE with every purchase?" |
| image_one / text_one | `shopify://shop_images/Screenshot_2025-07-17_at_12.49.26_AM.png` / "3D Models of Your Teeth" |
| image_two / text_two | `shopify://shop_images/Screenshot_2025-07-17_at_12.49.35_AM.png` / "Mirrored Case" |
| image_three / text_three | `shopify://shop_images/Screenshot_2025-07-17_at_12.49.41_AM.png` / "6 Cleaning Tablets" |
| image_four / text_four | `shopify://shop_images/Screenshot_2025-07-17_at_12.49.49_AM.png` / "Toothbrush" |
| button_text | "Included Free" |

These are the same four images already hardcoded (as public CDN URLs) in `snippets/customcode-test-product-scroller.liquid`, confirming the asset URLs are stable and reusable.

## Goals / Non-Goals

**Goals:**
- Freebie content becomes the first accordion row on Fang and VIP Fang only.
- Zero changes to any file shared with other product templates.
- New snippet is fully self-contained (styles + content), matching the established `customcode-test-*` convention.

**Non-Goals:**
- Not adding general "embed any block inside an accordion" capability to the section schema (that's the larger, riskier Option 2 considered and rejected during exploration — see proposal's Impact section).
- Not making the freebie content theme-editor-editable via dedicated fields on this new row (it's intentionally hardcoded, matching the `customcode-test-product-scroller` precedent).
- Not changing freebie content, images, or copy — this is a presentation/placement change only.
- Not touching `product.pop-on-main-pdp.json` or any other template.

## Decisions

**Decision: New `customcode-test-freebies.liquid` snippet, rendered via an accordion block's `custom_liquid`, instead of a section-schema change.**
Rationale: matches the exact pattern already used elsewhere in this theme for embedding rich content in an accordion row (`customcode-test-product-scroller.liquid`), requires editing only the two target template JSON files plus one new snippet, and touches zero shared `.liquid` files — eliminating regression risk to the ~30 other templates using `customcode-featured-product`. Alternative considered: add a checkbox to the shared `accordion` block schema to reference the section's own `freebies`-type block dynamically (keeps content editable via normal fields, but requires modifying `sections/customcode-featured-product.liquid`, which every product template shares). Rejected per the user's explicit "don't break other templates" constraint and to mirror the existing established convention rather than invent a new one.

**Decision: Self-contained inline styles in the new snippet, not reuse of `.c-freebies`/`.fr-grid-container` classes from `snippets/customcode-styles.liquid`.**
Rationale: matches `customcode-test-product-scroller.liquid` exactly (own `{% style %}` block, own class names), keeping the new snippet fully independent of the shared stylesheet — confirmed as the preferred approach.

**Decision: Remove the standalone `freebies_rAHLCH` block entirely from both templates rather than disabling it.**
Rationale: the section's block-rendering loop (`sections/customcode-featured-product.liquid`) has no per-block "hide but keep settings" concept for arbitrary types like it does for `"disabled"` at the section level; leaving the block in `blocks` but out of `block_order` is the correct way to stop it rendering while keeping it recoverable in git history if ever needed. No `"disabled"` flag exists on individual blocks in this schema (unlike the section-level `disabled` field), so removal from `block_order` is the mechanism, not a disable flag.

**Decision: New accordion block placed immediately after `buy_button`, before the six existing accordion rows (first in the accordion list, not first overall).**
Rationale: directly matches the user's ask ("moved at the top of the accordion list") — the title/blurb/variant/buy-button block remain above the accordion group, unchanged.

## Risks / Trade-offs

- **[Risk] Hardcoded snippet content drifts from the "real" freebie block's content over time** (e.g. if a future promotion changes the 4 gifts) → **Mitigation**: content is small and simple (4 image/text pairs); updating the new snippet is a direct file edit, same maintenance cost as the existing `customcode-test-product-scroller.liquid` precedent already accepted in this codebase.
- **[Risk] Removing `freebies_rAHLCH` block loses its settings from the theme editor's block list** → **Mitigation**: values are captured verbatim in this design doc and in the new snippet; git history retains the original block JSON if ever needed for restoration.
- **[Risk] Visual/CSS conflicts between the new snippet's inline styles and existing accordion/page styles** → **Mitigation**: styles are scoped under a snippet-specific class name (avoiding any `c-freebies`/`fr-grid-*` class reuse), mirroring the scroller snippet's scoping approach; verify visually on both templates after deploy.

## Migration Plan

1. Add `snippets/customcode-test-freebies.liquid`.
2. Edit `templates/product.pop-on-fangs.json`: add new accordion block, reorder `block_order`, remove `freebies_rAHLCH` from `block_order` and `blocks`.
3. Repeat step 2 for `templates/product.pop-on-vip-fang.json`.
4. Push/sync the theme to Shopify and visually verify both PDPs (accordion opens/closes correctly, freebie row is first, single-open-accordion behavior still works, no other template regressed).
5. Rollback: revert the commit and re-push/sync the theme; no data migrations involved since this is template/snippet content only.

## Open Questions

None — all decisions needed to proceed were resolved during exploration.
