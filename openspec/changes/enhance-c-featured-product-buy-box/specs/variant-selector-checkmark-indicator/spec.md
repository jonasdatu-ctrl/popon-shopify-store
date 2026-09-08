## Purpose

Defines an opt-in checkmark-badge style for indicating the selected swatch in the general variant selector, configurable per block instance so it can be adopted by one buy box without changing the existing look of every other product already using this selector.

## ADDED Requirements

### Requirement: Selection indicator style is configurable per block
The `variant_selector` block SHALL provide a setting to choose the selected-swatch indicator style: the existing border highlight (default) or a checkmark badge.

#### Scenario: Default behavior unchanged
- **WHEN** a `variant_selector` block does not set the indicator style setting
- **THEN** the selected option value's swatch renders with the existing border highlight, matching current behavior exactly

#### Scenario: Checkmark indicator enabled
- **WHEN** a `variant_selector` block sets the indicator style setting to the checkmark option
- **THEN** the currently selected option value's swatch displays a checkmark badge instead of the border highlight

### Requirement: Checkmark indicator tracks the active selection
When the checkmark indicator style is enabled, the system SHALL move the checkmark badge to reflect the currently selected option value as the customer changes their selection.

#### Scenario: Customer changes selection with checkmark indicator enabled
- **WHEN** the checkmark indicator is enabled and the customer selects a different option value
- **THEN** the checkmark badge appears on the newly selected swatch and no longer appears on the previously selected one
