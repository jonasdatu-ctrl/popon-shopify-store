# Spec Delta

## Purpose

Lets merchandisers attach an explanatory tooltip to a variant selector option title (such as "Color" or "Size") from the theme editor, without touching product metafields or code.

## ADDED Requirements

### Requirement: Option label tooltip settings
The `variant_selector` block in the featured product section SHALL provide a single-line text setting labelled "Display tooltip in Option Label" listing option titles separated by `|`, and an HTML setting holding the tooltip content for those titles, also separated by `|` and paired with the titles by position.

#### Scenario: Settings left blank
- **WHEN** neither setting has a value
- **THEN** the variant selector renders exactly as it did before this change, with no tooltip icon beside any option title

### Requirement: Tooltip icon beside matching option titles
For each product option whose name exactly matches an entry in the label list (ignoring surrounding whitespace), the variant selector SHALL display a tooltip icon immediately beside the option title. The icon SHALL show the HTML entry at the same position in the tooltip list when hovered, focused or clicked.

#### Scenario: Label matches and has tooltip content
- **WHEN** the label setting is `Color|Size`, the HTML setting is `<b>Pick a shade</b>|Check our size guide`, and the product has options "Color" and "Size"
- **THEN** the "Color" title shows a tooltip icon revealing "Pick a shade" in bold, and the "Size" title shows a tooltip icon revealing "Check our size guide"

#### Scenario: Option name does not match
- **WHEN** the label setting is `Color` and the product has an option named "Colorway"
- **THEN** the "Colorway" title shows no tooltip icon

#### Scenario: Whitespace around entries
- **WHEN** the label setting is `Color | Size` and the product has an option named "Size"
- **THEN** the "Size" title shows a tooltip icon

#### Scenario: Label has no paired HTML entry
- **WHEN** the label setting lists two titles but the HTML setting contains only one entry
- **THEN** the second title shows no tooltip icon and the page renders without error

#### Scenario: Paired HTML entry is blank
- **WHEN** the HTML entry paired with a matching label is empty or whitespace only
- **THEN** that title shows no tooltip icon

#### Scenario: Tooltip content is rendered as HTML
- **WHEN** a tooltip entry contains HTML markup such as a link or bold text
- **THEN** the tooltip displays the markup as formatted content, not as escaped text

### Requirement: Tooltip follows option title visibility
The option label tooltip SHALL only be shown when the option title itself is displayed.

#### Scenario: Option title hidden
- **WHEN** an option is listed in both the "Hide Option Title" setting and the label tooltip setting
- **THEN** neither the title nor the tooltip icon is displayed for that option

### Requirement: Consistent tooltip appearance
The option label tooltip icon SHALL use the same icon and tooltip colors as the existing per-value tooltips in the variant selector, and SHALL sit on the same line as the option title.

#### Scenario: Visual consistency
- **WHEN** an option title with a tooltip is displayed
- **THEN** the icon appears inline after the title text, and the tooltip opens with the same dark background and white text as the option value tooltips
