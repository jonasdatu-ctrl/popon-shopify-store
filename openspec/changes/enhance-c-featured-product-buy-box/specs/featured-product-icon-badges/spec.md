## Purpose

Defines the behavior of the `icon_badges` block in `customcode-featured-product`, which lets a non-developer configure a row of icon+text trust badges (e.g. "Impression Kit Included", "Custom-Made Fit", "Free Shipping") from two plain-text settings, with no per-badge blocks to add or reorder.

## ADDED Requirements

### Requirement: Badge pairs are parsed from two pipe-separated lists by index
The icon_badges block SHALL split its `icon_urls` setting and its `texts` setting each on `|`, and pair the resulting values by matching index to form one badge per pair.

#### Scenario: Equal-length lists
- **WHEN** `icon_urls` contains 3 pipe-separated URLs and `texts` contains 3 pipe-separated labels
- **THEN** the block renders exactly 3 badges, each pairing the URL and label at the same list index

#### Scenario: More icons than texts
- **WHEN** `icon_urls` has more pipe-separated entries than `texts`
- **THEN** every icon entry beyond the length of `texts` still renders, as an icon-only badge with no text

#### Scenario: More texts than icons
- **WHEN** `texts` has more pipe-separated entries than `icon_urls`
- **THEN** every text entry beyond the length of `icon_urls` still renders, as a text-only badge with no icon

#### Scenario: Both settings blank
- **WHEN** both `icon_urls` and `texts` are empty
- **THEN** the block renders no badges and no empty grid container is left visible

### Requirement: Badges auto-arrange in a responsive, capped-width grid
The icon_badges block SHALL lay out badges in a grid that automatically fits as many columns as available width allows, capping each badge's width so that rows with fewer badges than fit the available width render those badges centered at their natural (capped) size instead of stretching to fill the row.

#### Scenario: Three badges on desktop
- **WHEN** three badges are configured and the block renders at desktop width
- **THEN** the three badges display side-by-side in one row, each at the capped width, centered as a group rather than stretched to fill excess row width

#### Scenario: Single badge
- **WHEN** only one badge is configured
- **THEN** it renders centered at its capped width, not stretched to the full width of the block

#### Scenario: Narrow viewport
- **WHEN** the badge row renders at a narrow (mobile) viewport that cannot fit all configured badges in one row at their capped width
- **THEN** badges wrap onto additional rows while remaining capped at the same maximum width
