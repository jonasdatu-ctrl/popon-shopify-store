## Context

This theme has two coexisting section patterns (documented in `openspec/changes/add-night-guard-hero-section/design.md`): native Horizon blocks (`{% content_for 'blocks' %}`, reusable files under `/blocks`) and legacy `customcode-*` single-file sections. This change follows the native pattern, consistent with the most recent related work (`sections/night-guard-hero.liquid`), since it's a generic, reusable section rather than a one-off page layout.

The theme already has two icon-based blocks that this new block must stay distinct from:
- `blocks/icon-text.liquid` ("Icon with text"): a single inline icon+text row (e.g. "Secure & encrypted checkout" badges).
- `blocks/icon-list.liquid` ("Icon list"): a fixed 4-slot icon+label row, used only inside `night-guard-hero`, with no title/description split and no standalone section.

Neither fits the reference design (`context/Screenshot 2026-09-01 180213.png`): a heading, then up to 4 cards each with an icon, a bold title, and a description line, in a 2-col/4-col responsive grid. See `proposal.md` for motivation and `specs/icon-text-grid-section/spec.md` for full behavioral requirements.

The theme's single responsive breakpoint, used consistently in `sections/hero.liquid`, `sections/night-guard-hero.liquid`, and throughout `assets/base.css`, is 750px (`(min-width: 750px)`). This design reuses that breakpoint rather than introducing a new one.

## Goals / Non-Goals

**Goals:**
- Deliver the section and its new block as an idiomatic native theme block, consistent with `blocks/text-badge.liquid` and `blocks/icon-list.liquid` (`"tag": null`, self-managed root element, explicit color settings).
- Cap the grid at 4 items using the block schema's own `limit` property, so merchants get a real repeatable/reorderable block (not a fixed-slot section setting like `icon-list`), matching the proposal's "blocks for each icon and text, max 4" request.
- Make the 2-col/4-col responsive grid work via CSS only, no JS, regardless of how many of the 1-4 blocks are present.
- Keep the section generic and unattached to any template — merchants add it via the theme editor, the same way most non-`customcode-*` sections work.

**Non-Goals:**
- No wiring into `templates/product.product-night-guard.json` or any other template. The screenshot's copy ("Why a custom-fit guard makes all the difference.") is example content for the preset defaults only; placement is left to the merchant.
- No changes to the existing `icon-text` or `icon-list` blocks — this adds a third, distinct block rather than extending either.
- No metafield/app integration; all content is merchant-entered via block settings.

## Decisions

### Section file: `sections/icon-text-grid.liquid`, block file: `blocks/icon-text-card.liquid`
A new section and a new block, rather than extending `icon-list` (fixed slots, no title/description, always centered-icon-above-label styling tuned for the hero) or `icon-text` (single inline row, no card/grid concept). Names are chosen to avoid any collision with the existing `icon-text` block while staying descriptive: "Icon text grid" (section) contains "Icon text card" (block).

### Block settings: `icon` (image_picker), `heading` (text), `text` (text), color settings
Mirrors the flat, single-line-text style of `icon-list`/`icon-text` (not richtext) since the reference design's title and description are both short, unformatted lines. Explicit `heading_color` and `text_color` settings are included, following this theme's established convention (see `text-badge`, `icon-list`, `icon-text`) of never inheriting theme color-scheme defaults silently in custom blocks.

### Cap of 4 via section-level `max_blocks`, not block-level `limit`
Shopify's `"limit"` property on a block-type entry in a section's `"blocks"` array only applies to section-local blocks defined inline (with their own `name`/`settings` in that same schema) — the pattern used theme-wide in the legacy `customcode-*` sections (e.g. `customcode-step-block.liquid`'s `"limit": 4`). It does not apply to theme blocks referenced from `/blocks` by `type` alone (confirmed via `shopify theme check`: adding `limit` to a bare `{ "type": "icon-text-card" }` reference triggers a `Missing property "name"` schema error, and satisfying that by adding `name` inline causes theme-check to stop resolving settings from the referenced file entirely).

Instead, this section uses the section-level `"max_blocks": 4` schema property, which caps the total number of blocks (default 50) addable to a section via `{% content_for 'blocks' %}`, regardless of type. Since `icon-text-card` is the section's only allowed block type, this has the same practical effect as a per-type limit while keeping `icon-text-card` a normal, reorderable, independently addable/removable theme block — unlike `icon-list`'s fixed-slot-settings approach, which the proposal for this change does not call for.

### Grid layout: CSS Grid, `grid-template-columns: repeat(2, 1fr)` below 750px, `repeat(4, 1fr)` at 750px+
Simplest implementation that satisfies the spec's "2 columns mobile / 4 columns desktop, regardless of block count (1-4)" requirement directly, without conditional logic based on how many blocks are actually present (a card grid with, say, 3 items just leaves the last cell empty on desktop — matching how `icon-list`/`customcode-product-features` grids already behave when a slot is unset).

### Heading setting: plain `richtext`, section-level
A single `richtext` setting (allowing bold/emphasis but not a separate eyebrow/badge), following the simpler end of this theme's heading patterns (contrast with `text-badge`'s combined badge+eyebrow+heading, which this section doesn't need per the screenshot's single heading line). Kept at the section level (not a block) since it's one heading for the whole grid, not per-card.

## Risks / Trade-offs

- **`limit` on a native block-type reference is a less common pattern in this theme** (seen mostly on legacy `customcode-*` locally-defined blocks) → Acceptable: it's documented, standard Shopify schema behavior, and directly satisfies the "max 4" requirement without inventing a fixed-slot structure.
- **Unattached section means no visible page changes from this change alone** → Acceptable per proposal scope; merchant adds it via the theme editor where/when needed. A follow-up change can wire it into a specific template if requested.
- **Plain `color` settings (not `color_scheme`) on the block** → Consistent with sibling blocks (`icon-list`, `icon-text`, `text-badge`); same known trade-off already accepted in this theme (won't auto-follow future theme-wide color scheme changes).

## Migration Plan

No migration needed — this is purely additive (one new section file, one new block file), with no modifications to existing sections, blocks, or templates. Rollback is a straightforward revert of the two new files.
