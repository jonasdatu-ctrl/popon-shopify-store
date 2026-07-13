# featured-product-accordion-html Specification

## Purpose

Defines the Custom HTML setting on the Accordion block of the C Featured Product section, letting merchants author raw HTML (including elements with `data-` attributes, e.g. GA-trackable links) through the theme editor — something the block's richtext settings cannot do because richtext strips attributes.

## Requirements

### Requirement: Accordion block accepts custom HTML content

The Accordion block of the C Featured Product section SHALL provide an `html`-type setting ("Custom HTML") whose value is rendered inside the accordion content area without stripping HTML attributes.

#### Scenario: Merchant enters HTML with data attributes

- **WHEN** a merchant pastes `<a href="/pages/contact-us" data-ga-label="pdp-accordion-contact-us">Contact us</a>` into the Custom HTML setting
- **THEN** the storefront renders the anchor inside the accordion's content area with the `data-ga-label` attribute intact

#### Scenario: Setting is empty

- **WHEN** the Custom HTML setting is left blank
- **THEN** no additional wrapper markup is rendered in the accordion content, and existing accordion settings (video, content, page, image/text) render unchanged

### Requirement: Custom HTML coexists with existing accordion content

The Custom HTML output SHALL render in addition to (not instead of) the block's existing content settings, so current accordions on live pages are unaffected.

#### Scenario: Block already uses richtext content

- **WHEN** a block has both the existing Content richtext and the new Custom HTML populated
- **THEN** both render inside the accordion content area, with Custom HTML rendered after the existing content outputs
