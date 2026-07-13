## Why

Marketing wants to track clicks on arbitrary theme elements (starting with a planned "Contact us" link inside the Featured Product accordion) in Google Analytics. Today there is no generic way to do this: each tracked element requires bespoke JS (like the existing `c_variant_clicked` handler), and the accordion block's richtext settings strip HTML attributes, so a merchant cannot author a trackable link through the theme editor at all.

## What Changes

- Add a global, delegated click tracker: any element carrying a `data-ga-label` attribute fires a `c_element_clicked` GA event with the attribute value as `event_label`. Works for elements added to the DOM at any time (dynamic content, section re-renders).
- Add a new `html`-type setting ("Custom HTML") to the Accordion block of the C Featured Product section, rendered inside the accordion content. Unlike the existing richtext settings, this preserves raw markup including data attributes.
- No changes to existing GA events (`c_gorgias_rivo_traffic`, `c_variant_clicked`, `c_search`).

## Capabilities

### New Capabilities
- `ga-element-click-tracking`: Site-wide GA click tracking for any element opted in via `data-ga-label`.
- `featured-product-accordion-html`: Custom HTML content setting on the C Featured Product accordion block.

### Modified Capabilities

<!-- none — existing specs (your-page-sticky-atc, rebuy-smart-cart, buy-box-v2) are unaffected -->

## Impact

- `snippets/customcode-scripts.liquid` — new delegated listener added to the existing "GTAG Scripts" block.
- `sections/customcode-featured-product.liquid` — new `html` setting in the `accordion` block schema.
- `snippets/customcode-accordion.liquid` — render the new setting inside `.accordion-content`.
- GA/GTM: events flow through the existing `gtag()` → `dataLayer` → GTM (GTM-P48PB3L) pipeline, same as current custom events. Registering `event_label` as a GA4 custom dimension (admin task, outside this repo) is needed to query the label.
