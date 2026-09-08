## Context

`customcode-featured-product.liquid` is a legacy single-file `customcode-*` section (as opposed to the theme's newer native `{% content_for 'blocks' %}` pattern used by e.g. `icon-text-grid`). Its blocks are inline schema entries in the same file's `schema.blocks` array (`title`, `tags`, `freebies`, etc.), each rendered by a `{% case block.type %}` branch in a loop over `section.blocks`. All shared JS for this section's custom elements (`c-general-variant-selector`, `c-buy-button`, `c-selling-plan`, etc.) lives in one file, `snippets/customcode-scripts.liquid`; all shared CSS lives in `snippets/customcode-styles.liquid`. New blocks for this section must follow this existing inline pattern, not the native `/blocks` pattern (see `openspec/changes/archive/2026-09-03-add-icon-text-grid-section/design.md` for why that section chose the native pattern instead — it's a different section family).

The variant selector (`GVariantSelector` in `customcode-scripts.liquid`) already dispatches a bubbling `variant-changed` CustomEvent on the closest `<c-featured-product>` ancestor whenever the selected variant changes, with `detail.variant` set to the matched variant's data (id, price, price_raw, etc., from the same JSON payload embedded in `customcode-general-variant-selector.liquid`). The existing `selling_plan` block's `CSellingPlan` element already listens for this event on that shared ancestor and calls its own `updatePrice()` — it never reaches into the variant selector's internals. This is the established pattern for any block that needs to react to variant changes.

See `proposal.md` for motivation; see `specs/featured-product-price-block`, `specs/featured-product-icon-badges`, and `specs/variant-selector-checkmark-indicator` for the behavioral contracts.

## Goals / Non-Goals

**Goals:**
- Add the `price` and `icon_badges` blocks as inline schema entries in `customcode-featured-product.liquid`, consistent with its existing sibling blocks.
- Make the price block reactive using the existing `variant-changed` event, without modifying `GVariantSelector`'s dispatch logic.
- Make the icon badges block's grid genuinely automatic (no per-count CSS branching) via `grid-template-columns: repeat(auto-fit, minmax(...))`.
- Keep the checkmark indicator strictly opt-in so every other product currently using `variant_selector` renders identically to today.
- Wire real content into `templates/product.product-sports-guard.json` so the live PDP matches `context/pop-on-guard-buy-box.png`.

**Non-Goals:**
- No changes to `customcode-buy-box-v2.liquid` (the alternate buy-flow snippet) — this design only touches the `buy_button` + `variant_selector` flow already used by the sports guard product.
- No new `/blocks` files — both new blocks are inline to `customcode-featured-product.liquid`, matching its existing convention.
- No change to how `customcode_price_display` or `customcode_option_value_image_overrides` metafields are authored or resolved — both are reused as-is.

## Decisions

### `price` block: new `c-price` custom element, event-driven
Rendered markup is a small custom element, e.g.:
```html
<c-price data-price="{{ ...initial price (cents)... }}" data-compare-price="{{ ...initial compare price (cents)... }}" data-show-compare="{{ block.settings.show_compare_price }}">
  <span class="price-current">{{ ...initial formatted price... }}</span>
  <s class="price-compare"></s>
</c-price>
```
`c-price`'s `connectedCallback` finds `this.closest('c-featured-product')` and adds a `variant-changed` listener that reformats `event.detail.variant.price` / `.compare_at_price` (or their `customcode_price_display` override fields, already present on the variant JSON payload consumed elsewhere) into the two spans. This mirrors `CSellingPlan`'s existing pattern exactly — no polling, no new global event bus. If no variant selector exists on the page (default-only product), the listener is simply never invoked and the initial server-rendered price stands, satisfying the "no live-update wiring required" scenario.

**Alternative considered:** Have `GVariantSelector` reach into a `c-price` element directly (like it does for `updateBuyButton`). Rejected — it would couple the selector to a block that may not be present on every product, whereas the event-listener pattern keeps `price` fully optional and decoupled, matching how `selling_plan` already does it.

### `icon_badges` block: two flat `text` settings, parsed with `split: '|'`
Schema:
```json
{
  "type": "icon_badges",
  "name": "Icon Badges",
  "settings": [
    { "type": "text", "id": "icon_urls", "label": "Icon Image URLs", "info": "Separated by |, one per badge, in order" },
    { "type": "text", "id": "texts", "label": "Badge Text", "info": "Separated by |, one per badge, in order" }
  ]
}
```
Render logic (Liquid):
```liquid
{% assign icons = block.settings.icon_urls | split: '|' %}
{% assign labels = block.settings.texts | split: '|' %}
{% assign pair_count = icons.size %}
{% if labels.size > pair_count %}{% assign pair_count = labels.size %}{% endif %}
<div class="cfp-icon-badges">
  {% for i in (0..pair_count) %}
    {% unless forloop.index0 == pair_count %}
      {% assign icon = icons[forloop.index0] %}
      {% assign label = labels[forloop.index0] %}
      {% if icon != blank or label != blank %}
        <div class="cfp-icon-badge">
          {% if icon != blank %}<img src="{{ icon | strip }}" alt="" loading="lazy">{% endif %}
          {% if label != blank %}<span>{{ label | strip }}</span>{% endif %}
        </div>
      {% endif %}
    {% endunless %}
  {% endfor %}
</div>
```
(exact Liquid range/index handling to be finalized in implementation, but the shape — split both, iterate to the longer length, skip only if both are blank — is fixed by the spec's mismatch-handling scenarios.)

Grid CSS:
```css
.cfp-icon-badges { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 180px)); justify-content: center; gap: 16px; }
.cfp-icon-badge { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 180px; }
```
`repeat(auto-fit, minmax(0, 180px))` combined with `justify-content: center` is what gives 1-2 badges their capped, centered size instead of stretching — `auto-fit` collapses empty tracks, and the `minmax(0, 180px)` cap (rather than `1fr`) stops each track from growing past 180px even when it's the only one.

**Alternative considered:** One block per badge (repeatable, like `icon-text-card`), matching the rest of the theme's icon-block conventions. Rejected per explicit product decision during exploration — the two-list single-block approach was chosen deliberately over per-badge blocks and over `image_picker` (see conversation record in `proposal.md`'s motivation); this design implements that choice rather than re-opening it.

### Checkmark indicator: new `indicator_style` setting on `variant_selector`, CSS-only
Add `"type": "select", "id": "indicator_style", "options": [{"value": "border", "label": "Border highlight"}, {"value": "checkmark", "label": "Checkmark badge"}], "default": "border"` to the `variant_selector` block schema. `customcode-general-variant-selector.liquid` renders a (always-present, CSS-hidden-by-default) checkmark badge element inside `.option-value`, and the section passes `block.settings.indicator_style` down as a data attribute or class on the selector root (e.g. `<c-general-variant-selector data-indicator-style="{{ block.settings.indicator_style }}">`). In `customcode-styles.liquid`:
```css
c-general-variant-selector[data-indicator-style="checkmark"] .option-value .indicator-checkmark { display: none; }
c-general-variant-selector[data-indicator-style="checkmark"] .option-value[active] .indicator-checkmark { display: flex; }
c-general-variant-selector[data-indicator-style="checkmark"] .option-value[first][active],
c-general-variant-selector[data-indicator-style="checkmark"] .option-value:not([first])[active] .info-container { border: none; }
```
No JS changes — `[active]` is already toggled by existing selector logic; only which CSS rule keys off it changes. This keeps every product not opting into `indicator_style: checkmark` pixel-identical to today.

### Sports Guard PDP wiring
`templates/product.product-sports-guard.json`'s `customcode_featured_product_HRwfDi` section gains, in `block_order`: a `blurb_text` (eyebrow, "CUSTOM-MADE SPORTS PROTECTION") before `title_iFe33P`; a new `price` block after the title; a `blurb_text`/`description`-style pair for "Includes At-Home Impression Kit" + the supporting sentence before the existing `variant_selector_pVYxPC`; `indicator_style: "checkmark"` added to that same variant selector's settings; and a new `icon_badges` block after `buy_button_dT4wwt` with `icon_urls`/`texts` populated for "Impression Kit Included", "Custom-Made Fit", "Free Shipping" (icon URLs sourced from existing uploaded shop image assets, matching the reference icons). This is content configuration, not new capability, so it's captured in tasks.md rather than in specs.

## Risks / Trade-offs

- **Mismatched icon/text list lengths silently produce partial badges** → Acceptable per spec (icon-only/text-only render rather than being dropped or erroring); documented in the block's setting `info` text so merchants keep both lists aligned.
- **Plain-text icon URLs instead of `image_picker`** → Departs from every other icon block in this theme; merchants must copy a CDN URL from Shopify Files rather than using the native picker. Accepted as an explicit, deliberate product decision (see proposal) trading picker convenience for single-line, copy-paste-friendly bulk editing of a whole badge row at once.
- **`indicator_style` adds a second visual code path to an already-dense selector stylesheet** → Mitigated by keeping the new CSS purely additive and scoped under `[data-indicator-style="checkmark"]`, so the default path is untouched.

## Migration Plan

No migration needed — all changes are additive schema/CSS/JS plus one template's content. Rollback is reverting the section/snippet/style edits and the template JSON; no data migration, no metafield changes.
