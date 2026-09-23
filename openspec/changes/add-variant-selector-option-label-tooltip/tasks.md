# Tasks

## 1. Block schema

- [x] 1.1 In `sections/customcode-featured-product.liquid`, add a `text` setting `tooltip_option_labels` labelled "Display tooltip in Option Label" to the `variant_selector` block, next to `hide_option_title`, with `info` saying to enter option titles separated by `|`; verify the block schema stays valid JSON and the setting appears in the theme editor
- [x] 1.2 In the same block, add an `html` setting `tooltip_option_html` labelled "Option Label Tooltip HTML" with `info` saying entries are separated by `|` and must be in the same order as the labels above; verify it appears in the theme editor

## 2. Snippet rendering

- [x] 2.1 In `snippets/customcode-general-variant-selector.liquid`, split `tooltip_option_labels` and `tooltip_option_html` on `|` once before the `for option` loop; verify the page renders unchanged when both settings are blank
- [x] 2.2 Inside the option loop, find the option's exact (stripped) match in the labels array, read the HTML entry at the same index, and render the existing info icon after `{{ option.name }}` with `data-tippy-content="{{ … | escape }}"`, `data-tooltip-bg="#191D48FF"` and `data-tooltip-color="white"`; verify a matching label shows a working tooltip on hover/click
- [x] 2.3 Skip the icon when there is no match, no paired entry, or a blank paired entry, and keep it inside the existing `hide_option_title` guard; verify "Colorway" doesn't match "Color", a missing second entry doesn't error, and a hidden title hides its tooltip

## 3. Styling

- [ ] 3.1 In `snippets/customcode-styles.liquid`, update `c-general-variant-selector p.option-title` so the title and icon sit inline with a small gap, and size the icon to 13px; verify on desktop and mobile widths that the icon sits beside the label without wrapping oddly or shifting titles that have no tooltip

## 4. Verification

- [ ] 4.1 On a product with "Color" and "Size" options, set labels `Color|Size` and two `|`-separated HTML entries (one containing a link or bold text); verify both tooltips show the right content, formatted as HTML, and match the styling of the per-value tooltips
- [x] 4.2 Run `npx --yes @fission-ai/openspec validate add-variant-selector-option-label-tooltip` and verify it passes
