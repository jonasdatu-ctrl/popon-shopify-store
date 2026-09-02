## 1. New block

- [x] 1.1 Create `blocks/icon-text-card.liquid` with `"tag": null` and `icon` (image_picker), `heading` (text), `text` (text) settings; verify each renders only when set (icon, heading, description all independently optional) and heading renders visually bold/distinct from the description
- [x] 1.2 Add `heading_color` and `text_color` color settings to `icon-text-card`; verify rendered heading/description pick up the configured colors
- [x] 1.3 Add a `presets` entry to the block schema so it's selectable from the theme editor's "Add block" list

## 2. Section

- [x] 2.1 Create `sections/icon-text-grid.liquid` scaffolding: a heading element followed by `{% content_for 'blocks' %}` wrapped in a grid container, following the structural pattern of `sections/night-guard-hero.liquid`
- [x] 2.2 Add a section-level `heading` (richtext) setting; verify it renders above the grid when set and is omitted when blank
- [x] 2.3 Register `icon-text-card` in the section's schema `blocks` list and set the section-level `"max_blocks": 4` (per-block-type `limit` does not apply to referenced theme blocks — see design.md); verify the theme editor blocks adding a fifth `icon-text-card`
- [x] 2.4 Add responsive grid CSS: `grid-template-columns: repeat(2, 1fr)` by default, switching to `repeat(4, 1fr)` at `min-width: 750px`, per the theme's existing breakpoint convention; verify visually at both a sub-750px and a 750px+ viewport with 1, 2, 3, and 4 blocks present
- [x] 2.5 Add a section `presets` entry with a representative starter set of up to 4 `icon-text-card` blocks (using the reference screenshot's copy) so the section is selectable from "Add section" in the theme editor

## 3. Follow-up refinements

- [x] 3.1 Add `padding-block-start`/`padding-block-end` range settings to `sections/icon-text-grid.liquid` (default 40px) using the theme's `spacing-style` snippet, matching `sections/night-guard-hero.liquid`'s convention; verify padding is configurable and applied via the `spacing-style` class
- [x] 3.2 Add section-level `background_color` and `heading_color` color settings to `icon-text-grid.liquid`; verify the section background and heading both pick up the configured colors
- [x] 3.3 Add an `icon_position` select setting (`top`/`left`, default `top`) to `blocks/icon-text-card.liquid`; restructure the block markup so heading+description share a `__content` wrapper, and add `--icon-top` (column, centered) / `--icon-left` (row, icon beside content) CSS variants; verify both positions render correctly

## 4. Verification

- [ ] 4.1 Add the section to a page via the theme editor (or Shopify CLI theme dev preview) and confirm it renders matching `context/Screenshot 2026-09-01 180213.png` at desktop width
- [ ] 4.2 Resize/emulate a sub-750px viewport and confirm the grid switches to 2 columns
- [ ] 4.3 Confirm adding, removing, and reordering `icon-text-card` blocks in the theme editor all work without errors, and that a 5th block cannot be added
- [x] 4.4 Confirm no existing sections, blocks, or templates (including `blocks/icon-text.liquid` and `blocks/icon-list.liquid`) were modified by this change — confirmed via `git status`: only the two new files (`blocks/icon-text-card.liquid`, `sections/icon-text-grid.liquid`) were added
