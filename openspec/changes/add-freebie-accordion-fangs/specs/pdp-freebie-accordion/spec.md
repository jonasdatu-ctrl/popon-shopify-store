## Purpose

Defines how the free-gifts ("freebie") content is presented on the Popon Fang and Popon VIP Fang PDP templates: as the first row of the product accordion instead of a separate standalone section below it.

## ADDED Requirements

### Requirement: Freebie content renders as the first accordion row

On the Popon Fang (`product.pop-on-fangs.json`) and Popon VIP Fang (`product.pop-on-vip-fang.json`) PDP templates, the freebie ("4 free gifts") content SHALL render as the first row of the product accordion, positioned before all other accordion rows and after the buy button.

#### Scenario: Shopper opens the Fang or VIP Fang PDP

- **WHEN** a shopper loads the Popon Fang or Popon VIP Fang product page
- **THEN** the first row in the accordion list is the freebie content, collapsed by default like the other accordion rows
- **AND** no separate standalone freebie section renders below the accordion

#### Scenario: Shopper expands the freebie accordion row

- **WHEN** a shopper clicks/taps the freebie accordion row's title
- **THEN** the row expands to show the freebie grid (title, 4x image/text pairs, and "Included Free" labeling), matching the content previously shown in the standalone freebie section
- **AND** the accordion's existing single-open behavior applies (opening this row closes any other open accordion row within the same product block)

### Requirement: Freebie accordion row content is self-contained

The freebie accordion row's content SHALL be rendered by a dedicated snippet with its own hardcoded content and styling, independent of the section's shared accordion or freebie settings/snippets.

#### Scenario: Other product templates are unaffected

- **WHEN** any product template other than Popon Fang or Popon VIP Fang is rendered
- **THEN** its accordion and freebie blocks behave exactly as before this change, with no shared section or snippet file modified
