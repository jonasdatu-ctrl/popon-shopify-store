# menu-drawer-link-feedback Specification

## Purpose

Defines the hover, click/tap (active), and keyboard-focus visual feedback (faint-gray background) for interactive links inside the custom menu drawer (`sections/customcode-menu-drawer.liquid`).

## Requirements

### Requirement: Desktop hover feedback on menu links

On devices with a mouse or trackpad, the system SHALL show a faint-gray background box on a top-level menu link (parent toggle row or leaf link) or sub-link while the pointer hovers over it, inset to hug that row's own content.

#### Scenario: Hovering a top-level link with a mouse

- **WHEN** a customer using a mouse/trackpad moves the pointer over a top-level menu link (e.g. "SHOP")
- **THEN** a faint-gray background box appears behind that link's text, hugging its content

#### Scenario: Hovering a sub-link with a mouse

- **WHEN** a customer using a mouse/trackpad moves the pointer over a sub-link inside an open submenu drawer
- **THEN** a faint-gray background box appears behind that sub-link's text, hugging its content

#### Scenario: No hover feedback on touch devices

- **WHEN** a customer on a touch-only device (no mouse/trackpad) touches a menu link without releasing
- **THEN** no hover-triggered background box appears, and none persists after the touch ends

### Requirement: Click/tap feedback on menu links

On both desktop and mobile, the system SHALL show the same faint-gray background box on a top-level menu link or sub-link at the moment it is pressed (mouse-down or touch-press), regardless of pointer type.

#### Scenario: Clicking a top-level link with a mouse

- **WHEN** a customer presses down on a top-level menu link with a mouse
- **THEN** a faint-gray background box appears behind that link's text for the duration of the press

#### Scenario: Tapping a sub-link on a touch device

- **WHEN** a customer taps a sub-link on a touch device
- **THEN** a single faint-gray background box appears behind that sub-link's text, with no native blue tap-highlight shown before or alongside it

### Requirement: Keyboard focus feedback on menu links

The system SHALL show the same faint-gray background box on a top-level menu link or sub-link when it receives keyboard focus via navigation (e.g. Tab key), independent of pointer type or hover capability.

#### Scenario: Tabbing to a top-level link

- **WHEN** a customer navigates the open menu drawer using the Tab key and focus lands on a top-level menu link
- **THEN** a faint-gray background box appears behind that link's text

#### Scenario: Tabbing to a sub-link

- **WHEN** a customer navigates an open submenu using the Tab key and focus lands on a sub-link
- **THEN** a faint-gray background box appears behind that sub-link's text

### Requirement: Submenu back/close control keeps its existing visual treatment

The submenu's back/close row (`[data-submenu-close]`) SHALL NOT receive the new hover, click, or focus background treatment; its existing visual appearance and native tap-highlight behavior SHALL remain unchanged. (Its keyboard operability is covered by the `menu-drawer-keyboard-accessibility` capability, not this one.)

#### Scenario: Interacting with the back/close row

- **WHEN** a customer hovers, clicks, or taps the "◂ SHOP"-style back/close row inside an open submenu
- **THEN** no faint-gray background box appears, and its visual appearance is unchanged from before this change
