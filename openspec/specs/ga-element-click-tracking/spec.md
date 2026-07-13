# ga-element-click-tracking Specification

## Purpose

Defines a site-wide, opt-in Google Analytics click tracker: any element carrying a `data-ga-label` attribute fires a `c_element_clicked` GA event on click, with the attribute value as the event label. Lives in the theme's GTAG Scripts block alongside the other custom `c_` events.

## Requirements

### Requirement: Clicks on opted-in elements fire a GA event

The theme SHALL fire a Google Analytics event named `c_element_clicked` whenever the user clicks an element carrying a `data-ga-label` attribute. The event SHALL include `event_label` set to the attribute's value and `page_url` set to the current page URL.

#### Scenario: Element with data-ga-label is clicked

- **WHEN** a user clicks an element with `data-ga-label="pdp-accordion-contact-us"`
- **THEN** `gtag('event', 'c_element_clicked', ...)` is called with `event_label: "pdp-accordion-contact-us"` and `page_url` set to `window.location.href`

#### Scenario: Click lands on a descendant of the tracked element

- **WHEN** a user clicks a child node (e.g. a `<span>` or `<img>`) nested inside an element with `data-ga-label`
- **THEN** the event fires once with the ancestor's `data-ga-label` value as `event_label`

#### Scenario: Element without the attribute is clicked

- **WHEN** a user clicks an element that has no `data-ga-label` attribute and no ancestor with one
- **THEN** no `c_element_clicked` event is fired

### Requirement: Tracking covers dynamically added elements

The tracker SHALL use event delegation at the document level so that elements with `data-ga-label` added to the DOM after initial page load (dynamic widgets, section re-renders, HTML injected via theme settings) are tracked without re-initialization.

#### Scenario: Element injected after page load is clicked

- **WHEN** an element with `data-ga-label` is inserted into the DOM after `DOMContentLoaded` and subsequently clicked
- **THEN** the `c_element_clicked` event fires exactly as it does for elements present at page load

### Requirement: Tracker degrades safely when gtag is unavailable

The tracker SHALL NOT throw an error or interfere with the click's default behavior (e.g. link navigation) if the `gtag` function is not defined.

#### Scenario: gtag blocked by ad blocker or consent tool

- **WHEN** a user clicks a tracked link while `window.gtag` is undefined
- **THEN** no script error is thrown and the link navigates normally
