## ADDED Requirements

### Requirement: Handle-gated rendering

The sticky button section SHALL render its interactive markup only when the current page handle begins with `your-`. On any other page it SHALL render nothing (a no-op), so the section can be safely reused.

#### Scenario: Page handle starts with your-

- **WHEN** the section renders on a page whose handle is `your-new-smile`
- **THEN** the sticky button markup is output

#### Scenario: Page handle does not start with your-

- **WHEN** the section renders on a page whose handle is `love-your-smile-1` (contains but does not start with `your-`)
- **THEN** no sticky button markup is output

#### Scenario: Non-page context

- **WHEN** the section renders where `page.handle` is empty (e.g. a product or collection template)
- **THEN** no sticky button markup is output

### Requirement: Mobile-only display

The sticky button SHALL be visible only on mobile viewports and SHALL be hidden on desktop viewports, consistent with the existing sticky ATC.

#### Scenario: Mobile viewport

- **WHEN** the page is viewed on a viewport narrower than the desktop breakpoint
- **THEN** the sticky button is eligible to display (subject to the visibility rules)

#### Scenario: Desktop viewport

- **WHEN** the page is viewed on a desktop viewport
- **THEN** the sticky button is not displayed regardless of scroll position

### Requirement: Visibility while ATC is below the viewport

While the main PDP's add-to-cart control (`<c-buy-button>`) is positioned entirely below the viewport, the sticky button SHALL be shown, pinned to the bottom of the viewport.

#### Scenario: ATC below viewport

- **WHEN** the shopper is reading marketing content above the main PDP and the ATC has not yet entered the viewport (it is below the fold)
- **THEN** the sticky button is displayed pinned to the bottom of the viewport

#### Scenario: ATC target missing

- **WHEN** no `<c-buy-button>` ATC element exists on the page
- **THEN** the sticky button remains hidden and no errors are thrown

### Requirement: Hide on handoff to existing sticky ATC

The sticky button SHALL hide once the ATC enters the viewport and SHALL remain hidden once the ATC scrolls above the viewport, so that it never overlaps the existing sticky ATC and leaves no coverage gap.

#### Scenario: ATC enters viewport

- **WHEN** the ATC scrolls into the viewport
- **THEN** the sticky button is hidden

#### Scenario: ATC above viewport

- **WHEN** the ATC has scrolled above the top of the viewport
- **THEN** the sticky button is hidden and the existing sticky ATC is responsible for the persistent call-to-action

### Requirement: Click scrolls to the ATC

When the sticky button is clicked, the page SHALL smooth-scroll to the main PDP's ATC control.

#### Scenario: Shopper taps the sticky button

- **WHEN** the shopper taps the sticky button while it is displayed
- **THEN** the page smooth-scrolls so the ATC (`<c-buy-button>`) is brought into view
