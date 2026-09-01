## Context

This theme has two coexisting section patterns:
- **Native Horizon blocks** (e.g. `sections/hero.liquid`): the section uses `{% content_for 'blocks' %}`, and merchants add/reorder/remove theme blocks from `/blocks`, each block being its own reusable `.liquid` file with its own schema.
- **Legacy "customcode-\*" sections** (e.g. `sections/customcode-image-text-badge.liquid`): a single liquid file with a fixed schema and no block flexibility.

Per the proposal, this change follows the native block pattern to match the requested "left side as blocks" structure and to keep new blocks reusable elsewhere in the theme later if desired.

The theme's single responsive breakpoint, used consistently in `sections/hero.liquid` and throughout `assets/base.css`, is 750px (`(min-width: 750px)`). This design treats that as the mobile/tablet vs. desktop cutoff, matching the rest of the theme rather than introducing a new breakpoint.

See `proposal.md` for motivation and `specs/night-guard-hero-section/spec.md` for full behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Deliver the section and its four new blocks as idiomatic theme blocks, consistent with existing files like `blocks/text.liquid`, `blocks/button.liquid`, `blocks/icon.liquid`, `blocks/review.liquid`.
- Keep the two reused block types (`text`, `button`) completely untouched — no modifications to existing blocks.
- Make the responsive reorder (image-top on mobile, content-left/image-right on desktop) work via CSS only, no JS.

**Non-Goals:**
- No scroll- or load-triggered fade animation. Per user clarification, the "fade in" in the reference design is baked into the uploaded image asset itself, not a behavior to implement.
- No live reviews-app/metafield integration for the review-static block — it is intentionally static.
- No changes to the existing `main` (product-information) section on the Night Guard template, including its current `disabled: true` state.
- No new product template file — the existing `templates/product.product-night-guard.json` is reused as-is (per user decision), only gaining one new top-level section entry.

## Decisions

### Section file: `sections/night-guard-hero.liquid`
A new, single-purpose section rather than extending `hero.liquid`. `hero.liquid`'s media model is a full-bleed absolutely-positioned background image behind centered content — structurally different from this design's explicit two-column split with a solid content-panel background. Reusing/branching `hero.liquid` would require conditional layout logic inside an already-large section; a dedicated section is simpler and lower-risk.

### Layout mechanism: CSS Grid with `order`, DOM order = image, then content
Markup is authored image-wrapper first, then content-wrapper. Below 750px, a single-column grid needs no extra rules — DOM order alone produces image-top/content-below. At 750px+, the grid switches to two columns and uses explicit `order` (or `grid-column`) to place content first (left) and image second (right), without reordering the DOM. This avoids `column-reverse` trickery and keeps source order matching reading order on mobile (better for accessibility/SEO), which is also the pattern implied by `hero.liquid`'s media-wrapper-before-content-wrapper structure.

Alternative considered: keep DOM order content-then-image and use `flex-direction: column-reverse` on mobile to put image first. Rejected because it inverts DOM/reading order on the most-used (mobile) viewport, which is worse for accessibility than inverting it on desktop via `order`.

### Section-level settings
- `background_color` (`color`): content column background. A plain `color` setting (not `color_scheme`) per the proposal's explicit "left bg color" ask — keeps this section decoupled from the theme's color-scheme presets, matching the reference design's specific navy panel.
- `image_desktop` (`image_picker`)
- `image_mobile` (`image_picker`, optional — falls back to `image_desktop` per spec)

### New blocks and their settings
| Block file | Settings |
|---|---|
| `blocks/text-badge.liquid` | `badge_text` (text, optional), `eyebrow_text` (text, optional), `heading` (richtext) |
| `blocks/icon-list.liquid` | `icon_1`..`icon_4` (image_picker), `label_1`..`label_4` (text) — fixed slots, not child blocks, per proposal |
| `blocks/review-static.liquid` | `text` (text) — 5-star markup is hardcoded in the block, not a setting |
| `blocks/icon-text.liquid` | `icon` (image_picker), `text` (text) |

Reused without modification: `blocks/text.liquid` (richtext body), `blocks/button.liquid` (CTA).

### Icon-list as fixed settings, not child blocks
The proposal explicitly calls for "max 4 image picker settings and single line text settings" rather than a repeatable block-in-block structure (the pattern `sections/customcode-product-features.liquid` uses). Fixed settings are simpler for this bounded, non-growing case (exactly 4 trust icons in the reference design) and avoid the extra nesting complexity of blocks-within-a-block.

### Review-static star markup
Reuses the same star `<symbol>`/`<use>` SVG technique already defined in `blocks/review.liquid`, duplicated locally in `blocks/review-static.liquid` rather than shared via a snippet, since `blocks/review.liquid`'s markup is entangled with its metafield-driven rating logic (fill percentage, half-star gradient) that this static block doesn't need — it always renders 5 filled stars.

### Template change
`templates/product.product-night-guard.json` gains one new entry in its section `order`, inserted at index 0 (before `"main"`), with a corresponding new entry in `sections` for `night_guard_hero` (or similar key) of `"type": "night-guard-hero"`. No other keys in the file change.

## Risks / Trade-offs

- **Fixed 4-slot icon list can't grow past 4** → Acceptable: proposal caps it at 4 by design; if a 5th trust point is needed later, that's a follow-up change, not a defect.
- **Plain `color` setting (not `color_scheme`) means this panel won't automatically pick up future theme-wide color scheme changes** → Acceptable trade-off for matching the reference design's specific color exactly; documented here so it's a known, intentional choice if raised later.
- **Duplicating star SVG markup between `review.liquid` and `review-static.liquid`** → Minor duplication, contained to a small, stable bit of markup; avoids coupling a "no metafield" block to metafield-shaped logic.

## Migration Plan

No migration needed — this is purely additive (new section, new blocks) plus one template edit that only inserts a new section entry. No existing sections, blocks, or templates are modified in place. Rollback is a straightforward revert of the new files and the one template edit.
