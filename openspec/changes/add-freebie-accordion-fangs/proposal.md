## Why

On the Popon Fang and Popon VIP Fang PDPs, the "4 free gifts" block currently renders as its own standalone section below all six accordion rows, so it's easy for shoppers to miss. Other templates (e.g. `product.spareveneers.json`) already trialed — but left disabled — a pattern of embedding this kind of content as the first row of the accordion via a self-contained, hardcoded snippet rendered through the accordion block's Custom Liquid setting. We want to ship that pattern live on the two Fang templates: move the freebie content into an accordion row, positioned first in the accordion list.

## What Changes

- Add `snippets/customcode-test-freebies.liquid`: a new, self-contained snippet (own inline `{% style %}` block, hardcoded image URLs and text — no block settings passed in), following the same convention as the existing `snippets/customcode-test-product-scroller.liquid`. It reproduces the current freebie grid content (title + 4x image/text/check-icon/button-text) as static markup.
- In `templates/product.pop-on-fangs.json` and `templates/product.pop-on-vip-fang.json`:
  - Add a new `accordion`-type block (title "What's Included FREE With Every Purchase?") whose `custom_liquid` setting renders `{% render 'customcode-test-freebies' %}`.
  - Position this new block first among the `accordion_*` entries in `block_order` (immediately after `buy_button`, before the six existing accordion rows).
  - Remove the existing standalone `freebies` block from `block_order` (and its block definition) on both templates, since its content now renders inside the new accordion row instead.
- No changes to any shared section or snippet file (`sections/customcode-featured-product.liquid`, `snippets/customcode-accordion.liquid`, `snippets/customcode-freebies.liquid` are untouched), so no other product template is affected.

## Capabilities

### New Capabilities
- `pdp-freebie-accordion`: Defines that on the Popon Fang and Popon VIP Fang PDP templates, the free-gifts content is presented as the first row of the product accordion (via a dedicated, self-contained snippet) rather than as a separate standalone section.

### Modified Capabilities
(none — `featured-product-accordion-html` and other existing specs describe the shared accordion/section behavior, which is unchanged here; this change only edits template JSON content and adds one new template-scoped snippet)

## Impact

- Affected files: `templates/product.pop-on-fangs.json`, `templates/product.pop-on-vip-fang.json`, new file `snippets/customcode-test-freebies.liquid`.
- Not affected: `sections/customcode-featured-product.liquid`, `snippets/customcode-accordion.liquid`, `snippets/customcode-freebies.liquid`, and all other ~30 product templates sharing the `customcode-featured-product` section.
- Visual/behavioral impact scoped entirely to the Fang and VIP Fang PDPs: the freebie content moves from a standalone block below the accordion to the first row inside the accordion (collapsed by default, consistent with the other accordion rows).
