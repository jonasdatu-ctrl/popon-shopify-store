## Why

A second "icon with text" design has been approved (see `context/Screenshot 2026-09-01 180213.png`): a centered heading followed by up to four icon + title + description feature cards laid out in a grid (2 columns on mobile, 4 on desktop). This is a different shape than the existing `blocks/icon-text.liquid` block (a single inline icon+text row used for trust badges) and the existing `blocks/icon-list.liquid` block (a fixed 4-slot icon+label row inside `night-guard-hero`) — neither supports a section-level heading, a per-item title/description split, or standalone placement outside the hero. No existing section or block covers this layout.

## What Changes

- Add a new native (Horizon-style, block-driven) section that renders a centered heading followed by a responsive grid of icon+title+description feature blocks.
- Add one new theme block, `icon-text-card`, with `icon` (image_picker), `heading` (text), `text` (text), and color settings for heading/text — distinct from the existing single-line `icon-text` block.
- The section is addable anywhere via the theme editor (not wired into any specific template by this change); merchants add up to 4 `icon-text-card` blocks, enforced via the block's schema `limit: 4`.
- Grid is responsive: 2 columns below the theme's 750px breakpoint, 4 columns at 750px and above, matching the reference screenshot.

## Capabilities

### New Capabilities
- `icon-text-grid-section`: A responsive, block-driven section with a configurable heading and a grid (2-col mobile / 4-col desktop) of up to 4 icon+title+description feature blocks (`icon-text-card`).

### Modified Capabilities
(none — no existing spec's requirements change)

## Impact

- New file: `sections/icon-text-grid.liquid`
- New file: `blocks/icon-text-card.liquid`
- No changes to existing sections, blocks, or templates
- No new app or metafield dependencies
