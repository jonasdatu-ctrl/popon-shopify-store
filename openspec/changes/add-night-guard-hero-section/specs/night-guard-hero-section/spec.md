## Purpose

Defines the responsive two-column hero section and its supporting content blocks used to present the Pop On Night Guard product, with a merchant-configurable color content panel on one side and product imagery on the other.

## ADDED Requirements

### Requirement: Two-column responsive layout
The section SHALL render a color-background content column and an image column, laid out side by side at viewport widths of 750px and above, and stacked with the image on top and the content below at viewport widths under 750px.

#### Scenario: Desktop viewport
- **WHEN** the section is viewed at a viewport width of 750px or greater
- **THEN** the content column renders on one side and the image column renders on the other, side by side

#### Scenario: Mobile or tablet viewport
- **WHEN** the section is viewed at a viewport width under 750px
- **THEN** the image renders first (top), followed by the content column (below), stacked in a single column

### Requirement: Configurable content background color
The section SHALL expose a color setting that controls the background color of the content column, independent of the image column.

#### Scenario: Merchant sets a content background color
- **WHEN** a merchant selects a color in the section's background color setting
- **THEN** the content column renders with that background color and the image column is unaffected

### Requirement: Separate desktop and mobile images
The section SHALL expose independent image settings for the desktop image and the mobile image. When a mobile image is not set, the section SHALL fall back to the desktop image for mobile viewports.

#### Scenario: Both images configured
- **WHEN** a merchant sets both a desktop image and a mobile image
- **THEN** viewports at 750px and above render the desktop image and viewports under 750px render the mobile image

#### Scenario: Mobile image not configured
- **WHEN** a merchant sets a desktop image but leaves the mobile image empty
- **THEN** viewports under 750px render the desktop image

### Requirement: Block-driven content column
The content column SHALL be composed of merchant-addable, reorderable, and removable blocks, consistent with the theme's existing block-based section pattern. The section SHALL support the following block types: text-badge, text (native), icon-list, review-static, button (native), and icon-text.

#### Scenario: Merchant adds and reorders blocks
- **WHEN** a merchant adds one or more supported block types to the section and changes their order in the theme editor
- **THEN** the content column renders those blocks in the chosen order

#### Scenario: No blocks added
- **WHEN** the section has no blocks added to the content column
- **THEN** the section still renders with the configured background color and image, and an empty content column

### Requirement: Text-badge block
The text-badge block SHALL provide a single-line badge label, a single-line eyebrow text field, and a richtext heading field, rendered together as one unit.

#### Scenario: All fields populated
- **WHEN** a merchant sets the badge label, eyebrow text, and heading on a text-badge block
- **THEN** the block renders the badge label, the eyebrow text, and the formatted heading

#### Scenario: Badge label omitted
- **WHEN** a merchant leaves the badge label empty but sets the heading
- **THEN** the block renders without a badge indicator, showing only the eyebrow text (if set) and heading

### Requirement: Icon-list block with up to 4 items
The icon-list block SHALL provide exactly four fixed icon-and-label slots (an image picker and a single-line text field per slot). A slot SHALL NOT render if its image is not set.

#### Scenario: All four slots configured
- **WHEN** a merchant sets an icon image and label text for all four slots
- **THEN** the block renders four icon-and-label pairs in slot order

#### Scenario: Fewer than four slots configured
- **WHEN** a merchant sets an icon image for only some of the four slots
- **THEN** the block renders only the configured slots and omits the empty ones

### Requirement: Review-static block
The review-static block SHALL render a fixed 5-star rating indicator and a single-line text field, independent of any reviews-app metafield or live rating data.

#### Scenario: Trust text configured
- **WHEN** a merchant sets the text field on a review-static block
- **THEN** the block renders 5 stars followed by the configured text

### Requirement: Icon-text block
The icon-text block SHALL provide a single icon (image picker) and a single line of text, rendered inline as one row.

#### Scenario: Icon and text configured
- **WHEN** a merchant sets the icon image and text on an icon-text block
- **THEN** the block renders the icon followed by the text on a single row

### Requirement: Section placed on the Night Guard product template
The `product.product-night-guard.json` template SHALL include this section as the first section rendered on the page, without modifying any other section already present in that template.

#### Scenario: Night Guard product page loads
- **WHEN** a customer views a product using the `product.product-night-guard.json` template
- **THEN** this hero section is the first section rendered on the page, followed by the template's existing sections in their prior order
