## 1. New blocks

- [x] 1.1 Create `blocks/text-badge.liquid` with `badge_text`, `eyebrow_text` (single line), and `heading` (richtext) settings; verify badge/eyebrow render only when set and heading always renders as formatted HTML
- [x] 1.2 Create `blocks/icon-list.liquid` with fixed `icon_1`..`icon_4` (image_picker) and `label_1`..`label_4` (text) settings; verify a slot is skipped entirely when its icon is unset, and all 4 render in order when set
- [x] 1.3 Create `blocks/review-static.liquid` with a hardcoded 5-star SVG row (reusing the star path markup from `blocks/review.liquid`, simplified to always-filled since there's no half-star case) and a `text` setting; verify it renders 5 filled stars plus the configured text with no metafield/app dependency
- [x] 1.4 Create `blocks/icon-text.liquid` with `icon` (image_picker) and `text` (text) settings, rendered as a single inline row; verify icon and text render side by side
- [x] 1.5 Add a `presets` entry to each of the four new block schemas so they're selectable from the theme editor's "Add block" list

## 2. Section

- [x] 2.1 Create `sections/night-guard-hero.liquid` scaffolding: two-column markup (image wrapper first, then content wrapper in DOM order) with `{% content_for 'blocks' %}` in the content wrapper, following the structural pattern of `sections/hero.liquid`
- [x] 2.2 Add section settings: `background_color` (`color`), `image_desktop` (`image_picker`), `image_mobile` (`image_picker`); verify the content column background reflects `background_color` and image output falls back to `image_desktop` when `image_mobile` is unset
- [x] 2.3 Add responsive CSS: single-column stacked layout (image on top, content below) by default, switching to a two-column grid at `min-width: 750px` with `order`/`grid-column` placing content first (left) and image second (right) without changing DOM order; verify visually at both a sub-750px and a 750px+ viewport
- [x] 2.4 Register the section's allowed `blocks` list in its schema: `text-badge`, `c-text`, `icon-list`, `review-static`, `c-button`, `icon-text` (superseded from an earlier native-`text`/`button-color` iteration — see group 6); verify all six are addable from the theme editor
- [x] 2.5 Add a section `presets` entry (with a representative starter set of blocks) so the section is selectable from "Add section" in the theme editor

## 3. Template integration

- [x] 3.1 Edit `templates/product.product-night-guard.json` to add a new section entry of `"type": "night-guard-hero"` and insert its key at index 0 of the section order, before `"main"`; verify no other existing keys/settings in the file change
- [x] 3.2 Populate the new section's initial settings/blocks in the template (background color, desktop/mobile images, and the content blocks matching `context/hero-section.png`: text-badge, text, icon-list, review-static, button, icon-text) — text content and block settings are populated; `image_desktop`/`image_mobile` are left unset since no real Shopify-hosted image asset exists yet for this section to reference (merchant uploads via the theme editor)

## 4. Verification

- [ ] 4.1 Preview `templates/product.product-night-guard.json` in the theme editor (or Shopify CLI theme dev) and confirm the section renders at the top of the page, matching `context/hero-section.png` at desktop width
- [ ] 4.2 Resize/emulate a sub-750px viewport and confirm the image renders on top and the content column renders below, in that order
- [ ] 4.3 Confirm removing a block, adding a block, and reordering blocks in the theme editor all work without errors
- [ ] 4.4 Confirm existing sections in `templates/product.product-night-guard.json` (buy box, bundler, reviews, etc.) are unaffected and still render in their prior relative order after the new section

## 5. Color and alignment refinements

- [x] 5.1 Switch all four custom blocks from Shopify's auto-generated wrapper to a self-managed root element (`"tag": null`, matching `blocks/review.liquid`/`blocks/text.liquid`) so per-instance inline color/alignment styles can be applied; verify each block's schema JSON is still valid
- [x] 5.2 Add explicit `color` settings for every font/background/badge color rendered by `text-badge` (badge background, badge text, label text, heading text), `icon-list` (label text), `review-static` (star color, text color), and `icon-text` (text color); verify each renders using the configured color instead of a hardcoded or inherited one
- [x] 5.3 Center the icon within each `icon-list` item (icon above label) and within `icon-text`'s icon span, as fixed CSS (not a setting)
- [x] 5.4 Add a `text_alignment` (left/center/right) setting to `text-badge`, `review-static`, and `icon-text`; verify each shifts as a unit when changed
- [x] 5.5 Create `blocks/button-color.liquid` (label, link, open_in_new_tab, background_color, text_color, and the same width/custom-width settings as the native `button` block) since the native `button` block has no color settings and is shared theme-wide; swap the section's `blocks` schema and preset from `button` to `button-color`
- [x] 5.6 Update `templates/product.product-night-guard.json`'s existing button block entry to `"type": "button-color"` with `background_color`/`text_color` settings, and add `text_alignment` to the existing `icon_text` block entry, preserving all other already-saved settings (uploaded icon URLs, star color, etc.)

## 6. Dedicated C Text / C Button blocks (native-block avoidance)

- [x] 6.1 Create `blocks/c-text.liquid` ("C Text": richtext `text`, `text_alignment`, `color`) and remove the section's dependency on the native `text` block entirely, per explicit user direction to avoid depending on native/shared blocks — follows the theme's existing "C "-prefixed custom-block naming convention
- [x] 6.2 Rename `blocks/button-color.liquid` to `blocks/c-button.liquid` ("C Button"), delete the old file; same settings (label, link, open_in_new_tab, background_color, text_color, width/custom-width settings)
- [x] 6.3 Update `sections/night-guard-hero.liquid`'s `blocks` schema list and `presets` block entries: `text` → `c-text`, `button-color`/`button` → `c-button`
- [x] 6.4 Update `templates/product.product-night-guard.json`'s `richtext` block to `"type": "c-text"` and `button` block to `"type": "c-button"`, preserving already-saved content (button label/link/colors, richtext copy)
- [x] 6.5 Validate all schema JSON and the full template JSON after the rename; confirm no stray references to `"type": "text"` or `"type": "button"` remain in `sections/night-guard-hero.liquid`
