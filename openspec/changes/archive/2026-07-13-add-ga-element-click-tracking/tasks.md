## 1. Global GA click tracker

- [x] 1.1 Add a delegated document-level click listener to the "GTAG Scripts" block in `snippets/customcode-scripts.liquid` (after the existing `c_search` handler): resolve the tracked element with `event.target.closest('[data-ga-label]')`, bail if none, and fire `gtag('event', 'c_element_clicked', { event_category: 'interaction', event_label: <data-ga-label value>, page_url: window.location.href })`
- [x] 1.2 Guard the gtag call with `typeof gtag === 'function'` so a missing gtag never throws or blocks link navigation

## 2. Featured Product accordion Custom HTML setting

- [x] 2.1 Add a `{ "type": "html", "id": "custom_html", "label": "Custom HTML" }` setting to the `accordion` block schema in `sections/customcode-featured-product.liquid` (after the existing accordion settings)
- [x] 2.2 Render the setting in `snippets/customcode-accordion.liquid` inside `.accordion-content`, after the existing content outputs: `{% if block.settings.custom_html != blank %}<div class="custom-html-container">{{ block.settings.custom_html }}</div>{% endif %}`

## 3. Verification

- [ ] 3.1 On a dev theme, add a Contact us link with `data-ga-label="pdp-accordion-contact-us"` via the new Custom HTML setting and confirm it renders inside the accordion with the attribute intact
- [ ] 3.2 Click the link (and a nested child element of a tracked element) and confirm exactly one `c_element_clicked` push appears in `dataLayer` / GA4 DebugView with the correct `event_label` and `page_url`
- [ ] 3.3 Confirm a dynamically injected element with `data-ga-label` (e.g. added via console after page load) also fires the event, and that pages without any tracked elements log no events and no console errors
