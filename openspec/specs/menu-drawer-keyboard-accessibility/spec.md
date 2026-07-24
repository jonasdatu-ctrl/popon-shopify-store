# menu-drawer-keyboard-accessibility Specification

## Purpose

Defines keyboard operability (focus, Enter/Space activation) and correct screen-reader exposure (via `inert`, `role`, `aria-expanded`, `aria-label`) for the custom menu drawer's trigger, toggle rows, links, and back/close control.

## Requirements

### Requirement: Hamburger trigger is keyboard-operable

The menu drawer's hamburger trigger SHALL be reachable via keyboard navigation and SHALL open the drawer when activated via Enter or Space, matching its existing click behavior. It SHALL expose an accessible name (it is icon-only) and SHALL reflect the drawer's open/closed state via `aria-expanded`.

#### Scenario: Opening the drawer via keyboard

- **WHEN** a customer tabs to the hamburger trigger and presses Enter or Space
- **THEN** the menu drawer opens exactly as it would from a mouse click, and the trigger's `aria-expanded` attribute becomes `true`

#### Scenario: Trigger has an accessible name

- **WHEN** a screen reader announces the hamburger trigger
- **THEN** it announces a meaningful name (e.g. "Open menu"), not just "button"

### Requirement: Parent toggle rows are keyboard-operable

Each top-level menu row that opens a submenu (`div[data-has-children]`) SHALL be reachable via keyboard navigation and SHALL open its submenu when activated via Enter or Space, matching its existing click behavior. It SHALL reflect its submenu's open/closed state via `aria-expanded`.

#### Scenario: Opening a submenu via keyboard

- **WHEN** a customer tabs to a parent row (e.g. "SHOP ▸") inside the open drawer and presses Enter or Space
- **THEN** that row's submenu opens exactly as it would from a mouse click, and the row's `aria-expanded` attribute becomes `true`

#### Scenario: Closing a submenu resets its parent's expanded state

- **WHEN** an open submenu is closed (via its back row, the drawer's close button, or the overlay)
- **THEN** the corresponding parent row's `aria-expanded` attribute becomes `false`

### Requirement: Submenu back/close row is keyboard-operable

The submenu's back/close row (`[data-submenu-close]`) SHALL be reachable via keyboard navigation and SHALL perform its existing click behavior (closing the submenu, or navigating to the shop page for the "SHOP" submenu) when activated via Enter or Space.

#### Scenario: Closing a submenu via keyboard

- **WHEN** a customer tabs to the back/close row inside an open submenu and presses Enter or Space
- **THEN** the submenu closes exactly as it would from a mouse click

### Requirement: Closed drawer content is excluded from the tab order and screen readers

While the menu drawer is closed, none of its links or controls SHALL be reachable via Tab navigation or exposed to screen readers, regardless of their `transform`-based visual hiding.

#### Scenario: Tabbing through the page with the drawer closed

- **WHEN** a customer uses Tab to navigate the page while the menu drawer is closed
- **THEN** focus never lands on any link or control inside the closed drawer

#### Scenario: Opening the drawer restores its content to the tab order

- **WHEN** the menu drawer is opened
- **THEN** its top-level links and controls become reachable via Tab navigation again

### Requirement: Collapsed submenu content is excluded from the tab order and screen readers

While the drawer is open but a given submenu is collapsed, none of that submenu's links or its back/close row SHALL be reachable via Tab navigation or exposed to screen readers.

#### Scenario: Tabbing through an open drawer with all submenus collapsed

- **WHEN** a customer uses Tab to navigate an open drawer whose submenus are all collapsed
- **THEN** focus only lands on top-level rows, never on any sub-link or back/close row belonging to a collapsed submenu

#### Scenario: Opening a submenu restores its content to the tab order

- **WHEN** a submenu is opened
- **THEN** its sub-links and back/close row become reachable via Tab navigation

### Requirement: Icon-only close button has an accessible name

The drawer's close (✕) button SHALL expose an accessible name, since it contains only an icon with no visible text.

#### Scenario: Screen reader announces the close button

- **WHEN** a screen reader announces the drawer's close button
- **THEN** it announces a meaningful name (e.g. "Close menu"), not just "button"
