## Context

See proposal.md - Why for the collision bug and its cause.

The current lookup lives in `snippets/customcode-general-variant-selector.liquid` (~lines 104-113), inside the `{% for value in option.values %}` loop of the PDP main variant selector:

```liquid
{% assign key = value.name | replace: ' ', '_' | replace: '&', '' | replace: '(', '' | replace: ')', '' %}
{% assign media = metaobjects.variant_option_values_image_display[key].variant_option_image.value %}
```

`value` here is a Shopify option value object (`product.options_with_values[].values[]`), not a variant, so this runs once per rendered swatch button, scoped only to `option.name`/`value.name` text - never to the product. This snippet is only used by `sections/customcode-featured-product.liquid`; no other section renders it, so the change is contained to one file plus one new metafield definition.

We explored and rejected keying the override at the variant level: a variant metafield can only hold one image per full option combination, but a swatch button represents a single option value shared across every sibling variant with that value (e.g. every color variant of "2 Tops"). That grain mismatch would require duplicating the same image across every sibling variant and would resolve inconsistently depending on which sibling variant Liquid's `value.variant` happens to pick. Keying the override at the product level, by value name, matches the actual grain of the data with no duplication.

## Goals / Non-Goals

**Goals:**
- Let an individual product supply its own image for one or more of its option values, without touching any other product.
- Leave every product without an override behaviorally identical to today (same metaobject fallback, same rendering).
- Keep the change additive and low-risk: one new metafield, one lookup added ahead of the existing one.

**Non-Goals:**
- Not migrating or restructuring the existing `variant_option_values_image_display` metaobject or its entries.
- Not building an admin UI/app for editing the override JSON - editors edit the metafield's raw JSON value directly in the Shopify admin (Settings > Custom data > Products, or the product's metafield editor).
- Not solving image responsiveness/focal-point/alt-text for the override path - the override value is a plain CDN URL string, not a `file_reference`, so it does not get Shopify's `image_url`/`image_tag` transforms the way the metaobject-backed image does.
- Not touching the `customcode_variant_display_image` variant metafield (used for the gallery-swap image on selection) - that field already solves a different, correctly-scoped problem and is out of scope here.

## Decisions

**Decision: New metafield is product-scoped JSON, not a variant field or a metaobject-reference list.**
Rationale: this is explicitly framed (per proposal) as a narrow, low-frequency exception path for colliding products, not a full replacement of the metaobject-driven workflow most products keep using. A flat JSON map (`{ "<value name>": "<image url>" }`) needs no new metaobject definition, no reference-list management, and lets an editor add one line to fix one collision. Alternatives considered and rejected:
- *Per-variant `file_reference` metafield* - grain mismatch on multi-option products (see Context).
- *Metaobject with an added product-reference field* - viable, but a heavier structural change (new field on the shared definition, reference management) for what should be a rare exception case.
- *List of metaobject references on the product* - correct grain and gets a native image picker, but is more setup (new metaobject type, list-reference field, per-entry admin creation) than this exception path warrants; can be revisited later if overrides become common rather than rare.

**Decision: Override key is the literal, unsanitized `value.name`, not the sanitized metaobject-handle form.**
Rationale: JSON object keys accept arbitrary strings, so there is no handle-safety constraint forcing the space/`&`/parenthesis stripping the metaobject path needs. Using the literal name removes a transformation step and lets an editor copy-paste the value name exactly as shown on the product page. Trade-off: the key must match `value.name` exactly, including case and whitespace - documented in tasks/rollout notes for editors.

**Decision: Override value is a raw CDN URL string, rendered directly (e.g. via `<img src="...">`), not run through `image_url`.**
Rationale: `image_url` and related filters require a Shopify file/image object, which a JSON string is not. Accepting the trade-off (no automatic responsive sizing) keeps the metafield a plain, hand-editable JSON value, consistent with this being a rare manual override rather than a primary content path.

**Decision: Lookup order is override-first, metaobject-fallback-second, evaluated per option value inside the existing loop.**
Rationale: preserves 100% of existing behavior for every product that doesn't set the override, satisfying the "don't break existing features" constraint directly. The added lookup is a cheap JSON key check before the existing `metaobjects[...]` lookup runs.

## Risks / Trade-offs

- **[Risk] Editor typos the override key (case/whitespace mismatch) and the override silently fails, falling back to the shared image with no error surfaced.** → Mitigation: keep the fallback silent by design (it must not break the page), but note in tasks/documentation that the key must exactly match the option value name shown on the product page; consider a follow-up spot-check step after populating an override.
- **[Risk] Override image has no responsive sizing/focal point since it's a raw URL, unlike the metaobject `file_reference` path.** → Mitigation: acceptable for this rare exception-case path; document the trade-off so nobody expects parity with the metaobject-backed rendering.
- **[Risk] JSON metafield edited by hand in the admin is easy to malform (invalid JSON breaks the whole override, not just one entry).** → Mitigation: fallback logic must treat a missing/unparseable metafield the same as "no override" for every value on that product, so a malformed JSON degrades to today's behavior rather than breaking the page.

## Migration Plan

No data migration required. Deploy is additive:
1. Create the `custom.customcode_option_value_image_overrides` (JSON) metafield definition on Product in Shopify Admin.
2. Update the Liquid lookup in `customcode-general-variant-selector.liquid` to check the override before the existing metaobject lookup.
3. Roll out to theme; verify a product with no override renders unchanged, then populate one override on a known-colliding product to verify the new path.

Rollback: revert the Liquid change (metafield definition can remain unused/harmless if left in place).
