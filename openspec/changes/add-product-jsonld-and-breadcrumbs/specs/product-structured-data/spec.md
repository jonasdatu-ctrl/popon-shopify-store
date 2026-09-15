## Purpose

Ensures every product page emits machine-readable Product JSON-LD that mirrors the facts a shopper sees on the page, so search engines and AI shopping/answer systems can read product name, brand, price, availability, image, identifiers, condition, and canonical URL directly from the markup instead of inferring them from rendered HTML.

## ADDED Requirements

### Requirement: Product JSON-LD present on every product page
Every storefront product page SHALL render exactly one `application/ld+json` script tag of `@type: "Product"` describing the product shown on that page, regardless of which template or section layout the product uses.

#### Scenario: Product page using the custom featured-product layout
- **WHEN** a shopper or crawler requests a product page rendered with the `customcode-featured-product` section (the layout used by all current product templates)
- **THEN** the page response SHALL contain a `Product` JSON-LD script describing that page's product

#### Scenario: Product page added with a new template in the future
- **WHEN** a new product template is created using the same live product section pattern
- **THEN** it SHALL automatically receive Product JSON-LD without requiring per-template edits

### Requirement: Product JSON-LD contains required fields
The `Product` JSON-LD on a product page SHALL include: product name, brand name ("Pop On"), current price, price currency, availability status, at least one product image URL, the canonical product URL, and item condition. It SHALL include SKU and/or GTIN whenever that identifier is present on the product or its selected/default variant.

#### Scenario: Product with a barcode set on its default variant
- **WHEN** the product's default variant has a barcode (GTIN) value
- **THEN** the Product JSON-LD SHALL include that value as a GTIN identifier

#### Scenario: Product with no barcode set
- **WHEN** the product's variants have no barcode value
- **THEN** the Product JSON-LD SHALL omit the GTIN field rather than emitting an empty or placeholder value, while still including SKU if available

#### Scenario: Price and availability match what the shopper sees
- **WHEN** the page displays a specific price and stock status for the product's current/default variant
- **THEN** the Product JSON-LD's price and availability SHALL match that displayed price and stock status

### Requirement: No duplicate Product schema per page
A product page SHALL NOT emit more than one `Product` JSON-LD block.

#### Scenario: Product already covered by a legacy hand-written schema snippet
- **WHEN** a product page is for a product that already has a hand-written, product-specific JSON-LD snippet (e.g. the existing handle-gated schema for "propod")
- **THEN** the page SHALL emit only one `Product` JSON-LD block for that product, not one from each source
