# icon-text-grid-section Specification

## Purpose

Defines a standalone, block-driven theme section that presents a heading above a responsive grid of up to four icon + title + description feature cards, for use anywhere in the theme editor.

## Requirements

### Requirement: Section heading
The section SHALL provide a merchant-configurable heading rendered above the grid.

#### Scenario: Heading is set
- **WHEN** a merchant sets the section's heading setting to a non-blank value
- **THEN** the heading renders above the grid of blocks

#### Scenario: Heading is blank
- **WHEN** the section's heading setting is blank
- **THEN** no heading element is rendered

### Requirement: Icon-text-card block content
Each `icon-text-card` block SHALL support an icon, a title, and a description, each rendered only when set.

#### Scenario: All fields set
- **WHEN** a block has an icon, a title, and a description configured
- **THEN** the block renders the icon, the title, and the description, with the title visually distinct (bold) from the description

#### Scenario: Icon not set
- **WHEN** a block's icon is unset
- **THEN** the block renders without an icon element, and the title/description (if set) still render

#### Scenario: Title or description blank
- **WHEN** a block's title or description is blank
- **THEN** that element is omitted from output while the rest of the block still renders

### Requirement: Maximum of four blocks
The section SHALL allow merchants to add at most four `icon-text-card` blocks.

#### Scenario: Merchant attempts to add a fifth block
- **WHEN** a merchant has already added four `icon-text-card` blocks to the section
- **THEN** the theme editor prevents adding a fifth `icon-text-card` block

### Requirement: Responsive grid layout
The grid of blocks SHALL display 2 columns below the theme's 750px breakpoint and 4 columns at 750px and above, regardless of how many blocks (1-4) are present.

#### Scenario: Mobile viewport
- **WHEN** the section is viewed at a viewport narrower than 750px
- **THEN** the blocks lay out in a 2-column grid

#### Scenario: Desktop viewport
- **WHEN** the section is viewed at a viewport 750px or wider
- **THEN** the blocks lay out in a 4-column grid

### Requirement: Configurable section padding
The section SHALL provide merchant-configurable top and bottom padding, consistent with the theme's existing spacing convention.

#### Scenario: Padding is changed
- **WHEN** a merchant changes the section's top or bottom padding setting
- **THEN** the rendered spacing above/below the section content reflects the configured value

### Requirement: Configurable section colors
The section SHALL provide merchant-configurable background and heading text colors.

#### Scenario: Colors are changed
- **WHEN** a merchant changes the section's background color or heading text color setting
- **THEN** the section background and heading render using the configured colors

### Requirement: Configurable icon position per block
Each `icon-text-card` block SHALL let the merchant choose whether its icon displays above the title/description (stacked, centered) or to the left of the title/description (row layout).

#### Scenario: Icon positioned on top
- **WHEN** a block's icon position setting is "Top"
- **THEN** the icon renders above the title and description, centered

#### Scenario: Icon positioned on the left
- **WHEN** a block's icon position setting is "Left"
- **THEN** the icon renders to the left of the title and description

### Requirement: Selectable from theme editor
The section and its block SHALL each expose a preset so merchants can add them from the theme editor's "Add section" / "Add block" lists.

#### Scenario: Adding the section
- **WHEN** a merchant browses "Add section" in the theme editor
- **THEN** the icon-text-grid section preset is available and inserts with a representative starter set of blocks

#### Scenario: Adding a block
- **WHEN** a merchant browses "Add block" within the section
- **THEN** the icon-text-card block preset is available
