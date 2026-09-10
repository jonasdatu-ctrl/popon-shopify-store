## 1. New snippet

- [x] 1.1 Create `snippets/customcode-test-freebies.liquid`, following the `snippets/customcode-test-product-scroller.liquid` convention: self-contained inline `{% style %}` block (own scoped class names, not `c-freebies`/`fr-grid-*`), hardcoded content matching the current Fang/VIP Fang freebie block (title "What's included FREE with every purchase?"; 4x image/text pairs — 3D Models of Your Teeth, Mirrored Case, 6 Cleaning Tablets, Toothbrush — using the CDN URLs already hardcoded in `customcode-test-product-scroller.liquid` for the first three, plus the matching URL pattern for the toothbrush image; "Included Free" labeling). Verify by rendering the snippet in isolation (e.g. temporarily in a preview template) and confirming it displays the 4-item grid with no Liquid errors.

## 2. Popon Fang template

- [x] 2.1 In `templates/product.pop-on-fangs.json`, add a new `accordion`-type block with `accordion_title` "What's Included FREE With Every Purchase?" and `custom_liquid` set to `{% render 'customcode-test-freebies' %}`. Verify the block JSON is valid (parses with a JSON linter/`jq`).
- [x] 2.2 Reorder `block_order` so the new block is placed immediately after `buy_button_zKRDHV` and before the six existing `accordion_*` entries. Verify by diffing `block_order` against the design doc's target order.
- [x] 2.3 Remove the `freebies_rAHLCH` block (both its entry in `blocks` and in `block_order`). Verify no remaining references to `freebies_rAHLCH` exist in the file.

## 3. Popon VIP Fang template

- [x] 3.1 Repeat task 2.1 for `templates/product.pop-on-vip-fang.json` (same new accordion block, same `custom_liquid` value).
- [x] 3.2 Repeat task 2.2 for `templates/product.pop-on-vip-fang.json`.
- [x] 3.3 Repeat task 2.3 for `templates/product.pop-on-vip-fang.json` (remove its `freebies_*` block).

## 4. Verification

- [ ] 4.1 Push/sync the theme to a preview/dev environment and load the Popon Fang PDP: confirm the freebie row is the first accordion row, collapsed by default, and expands to show the correct 4-item grid with no visual/CSS regressions.
- [ ] 4.2 Repeat 4.1 for the Popon VIP Fang PDP.
- [ ] 4.3 On both PDPs, confirm the single-open-accordion behavior still works (opening the freebie row closes any other open row, and vice versa) and that no standalone freebie section renders below the accordion anymore.
- [x] 4.4 Spot-check at least one other product template that shares `sections/customcode-featured-product.liquid` (e.g. `product.pop-on-main-pdp.json` or `product.spareveneers.json`) to confirm its accordion/freebie rendering is unchanged. Verified statically via `git status`: only `templates/product.pop-on-fangs.json`, `templates/product.pop-on-vip-fang.json`, and the new `snippets/customcode-test-freebies.liquid` changed — no shared section/snippet file touched, so no other template's rendering can be affected. Live visual spot-check still recommended after deploy.
