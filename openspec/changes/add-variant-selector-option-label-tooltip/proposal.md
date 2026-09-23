# Proposal

## Why

Option labels in the featured product variant selector (e.g. "Color", "Size") sometimes need a short explanation — sizing guidance, shade descriptions — but today the only tooltips available are per option *value*, driven by a product metafield. Merchandisers can't attach help text to the option *label* from the theme editor.

## What Changes

- Add two settings to the `variant_selector` block in `customcode-featured-product`:
  - `tooltip_option_labels` (`text`): option titles that should get a tooltip, separated by `|`.
  - `tooltip_option_html` (`html`): the tooltip content for each listed label, separated by `|` and paired **by position** with `tooltip_option_labels`.
- In `customcode-general-variant-selector`, render the existing info icon beside the option title for each option whose name exactly matches a listed label and has a non-blank paired HTML entry. The icon uses the existing Tippy.js `data-tippy-content` mechanism, so no changes to `initTooltips()`.
- Add minimal CSS so the option title and icon sit inline.
- No change for blocks that leave the new settings blank.

## Capabilities

### New Capabilities
- `variant-selector-option-label-tooltip`: Optional tooltip icon beside variant selector option titles, configured via block settings.

### Modified Capabilities

## Impact

- `sections/customcode-featured-product.liquid`: schema for the `variant_selector` block (two new settings).
- `snippets/customcode-general-variant-selector.liquid`: option title markup and label/HTML parsing.
- `snippets/customcode-styles.liquid`: `c-general-variant-selector p.option-title` layout.
- No new dependencies; reuses the Tippy.js/Popper setup already loaded in `customcode-scripts.liquid`.
