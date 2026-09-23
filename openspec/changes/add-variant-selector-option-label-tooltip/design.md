# Design

## Context

The variant selector block renders each option title in [customcode-general-variant-selector.liquid](../../../snippets/customcode-general-variant-selector.liquid) as `<p class="option-title">`. Tooltips repo-wide use Tippy.js: any element with `data-tippy-content` (plus optional `data-tooltip-bg` / `data-tooltip-color`) is wired up by `initTooltips()` in `customcode-scripts.liquid` on `DOMContentLoaded`, with `allowHTML: true`. The callout block and per-value variant tooltips already use this pattern with a shared info icon image. See proposal.md for motivation.

Sibling settings on this block (`hide_option_title`, `hide_most_popular`, `hide_thumb_images`) take `|`-separated option titles and match them with Liquid `contains` on the raw string. `product_upsells` pairs `|`-separated `title_overrides` with items by position.

## Goals / Non-Goals

**Goals:**
- Reuse the existing Tippy mechanism with zero JS changes.
- Backward compatible: blank settings produce identical markup.

**Non-Goals:**
- Re-initialising tooltips after theme-editor section re-render (existing limitation for all tooltips).
- Deduplicating the info-icon URL across the three existing usages.
- Supporting a literal `|` inside tooltip HTML.

## Decisions

**Two settings, positional pairing.** `tooltip_option_labels` (`text`) and `tooltip_option_html` (`html`) are split on `|` and paired by index, matching the `title_overrides` precedent in `product_upsells`. Alternatives: a single shared HTML for all labels (can't vary per option); per-option setting pairs (bloats the schema). Positional pairing was chosen with the user.

**Exact matching, not `contains`.** Labels are `split: '|'` and each entry `strip`ped, then compared for equality with `option.name`. The `hide_*` siblings use substring matching, which would make "Color" match "Colorway"; exact matching avoids that at the cost of a small inconsistency with those settings.

**Index lookup via a loop over the labels array.** In Liquid, iterate the labels array with `forloop.index0`, and on a match read the HTML array at that index. This avoids `index_of`, which Liquid lacks. Split both arrays once before the `for option` loop.

**Reuse the `data-tippy-content` attribute with `| escape`.** The tooltip HTML is output as `data-tippy-content="{{ html | escape }}"`, as the callout block does; the browser decodes it and Tippy renders it via `allowHTML`. The icon reuses the existing info image with `data-tooltip-bg="#191D48FF"` and `data-tooltip-color="white"`, matching the per-value tooltips.

**Layout via CSS.** `c-general-variant-selector p.option-title` becomes `display: flex; align-items: center; gap` (inline-flex to keep the current block width behavior), and the icon is sized to 13px like `.value-title img`. Styles live in `customcode-styles.liquid` alongside the existing rule.

**Blank paired HTML suppresses the icon.** A matching label with a missing or blank HTML entry renders no icon rather than an empty tooltip.

## Risks / Trade-offs

- [Positional pairing drifts if entries are added/removed in only one field] → `info` text on both settings states that order must match.
- [A `|` inside the HTML splits the entry] → Documented in the setting `info`; use `&#124;` if a literal pipe is needed.
- [Tooltips not initialised after section re-render in the theme editor] → Existing behaviour; a full reload shows them.
- [Exact vs substring matching inconsistency with `hide_*` settings] → Accepted; exact matching is safer and the settings are otherwise independent.
