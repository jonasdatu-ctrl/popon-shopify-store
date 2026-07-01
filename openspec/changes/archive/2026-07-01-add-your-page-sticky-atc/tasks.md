## 1. Section markup

- [x] 1.1 Create `sections/customcode-sticky-atc-scroll.liquid` with a `{% schema %}` (title, button text, optional price toggle — mirror `customcode-sticky-atc.liquid`) and a preset under the Custom category.
- [x] 1.2 Gate the markup on handle: `{% assign p = page.handle | slice: 0, 5 %}{% if p == 'your-' %}` so nothing renders otherwise.
- [x] 1.3 Render root element `<c-sticky-scroll class="c-mobile" data-section-id="{{ section.id }}">` with an inner `div.c-button` (label + optional price), reusing the existing sticky markup structure.

## 2. Behavior (JS)

- [x] 2.1 In `snippets/customcode-scripts.liquid`, add a `CStickyScroll` custom element class mirroring `CStickyATC`: resolve `targetEl = document.querySelector('c-buy-button') || document.querySelector('button.cbb-add-to-cart')`, guard when missing.
- [x] 2.2 Attach an IntersectionObserver on `targetEl` (threshold 0.01) with inverted logic: hide when intersecting; show when `boundingClientRect.top > 0` (ATC below viewport); hide when above.
- [x] 2.3 Wire the button click to `targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- [x] 2.4 Register the element in the `DOMContentLoaded` block: `customElements.define('c-sticky-scroll', CStickyScroll);`.

## 3. Styling

- [x] 3.1 In `snippets/customcode-styles.liquid`, add `c-sticky-scroll` styles (reuse `.c-sticky-action` and `.c-mobile`; copy the `c-sticky-atc` visual rules or scope shared rules to both tags).

## 4. Placement & verification

- [x] 4.1 Add the section to the `customcode-top-bottom-group` (the group appended for `custom_page_display == 'Pop On Veneers with Impression Kit Template'`) as the first entry, before `customcode-featured-product`.
- [ ] 4.2 (Manual QA — requires live store on mobile) Verify: button shows while scrolling marketing content, hides when the ATC enters view, and the existing sticky ATC takes over once the ATC scrolls above the viewport (no overlap, no gap).
- [ ] 4.3 (Manual QA — requires live store) Verify the button is hidden on desktop and on non-`your-` pages, and that clicking scrolls to the ATC.
