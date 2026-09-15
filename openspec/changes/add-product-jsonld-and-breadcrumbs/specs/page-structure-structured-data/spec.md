## Purpose

Gives search engines and AI systems a machine-readable view of how each page fits into the site's catalog structure — where a product sits in the navigation hierarchy, and what products a collection page actually contains — via BreadcrumbList and ItemList JSON-LD.

## ADDED Requirements

### Requirement: BreadcrumbList reflects available collection context on product pages
Every product page SHALL render a `BreadcrumbList` JSON-LD block. The breadcrumb trail SHALL start with a "Home" item pointing to the shop root, and SHALL include a collection-tier item using, in priority order: (1) the page's own collection context when the page was reached via a collection-scoped route, then (2) the product's first associated collection when no page-level collection context exists. The final item SHALL always be the product itself.

#### Scenario: Product page reached with page-level collection context
- **WHEN** a product page is requested via a collection-scoped route so the page's `collection` context is set
- **THEN** the BreadcrumbList SHALL be `Home ▸ {that collection's title} ▸ {product title}` with `item` URLs pointing to the shop root, that collection, and the product respectively

#### Scenario: Product page reached without collection context, product belongs to a collection
- **WHEN** a product page has no page-level collection context but the product belongs to at least one collection
- **THEN** the BreadcrumbList SHALL be `Home ▸ {product's first collection title} ▸ {product title}`

#### Scenario: Product belongs to no collection at all
- **WHEN** a product has no page-level collection context and belongs to zero collections
- **THEN** the BreadcrumbList SHALL still be rendered as `Home ▸ {product title}` (two items) rather than being omitted

### Requirement: BreadcrumbList items are well-formed
Each item in a page's `BreadcrumbList` SHALL declare a `position` (1-indexed, sequential), a `name`, and an `item` absolute URL.

#### Scenario: Three-tier breadcrumb
- **WHEN** a BreadcrumbList has a Home, collection, and product tier
- **THEN** positions SHALL be 1, 2, and 3 respectively, each with a non-empty `name` and a valid absolute `item` URL

### Requirement: ItemList on collection pages matches the rendered product set
Every collection page SHALL render an `ItemList` JSON-LD block enumerating the same products actually displayed by the page's live collection section, in the same order, including any collection override or product-count limit configured on that section — not the collection's raw, unfiltered product list.

#### Scenario: Collection page with no overrides
- **WHEN** a collection page's live section renders the collection's own products with no override and no count limit
- **THEN** the ItemList SHALL contain one entry per rendered product, positioned in display order

#### Scenario: Collection page with a section-level collection override
- **WHEN** a collection page's live section is configured to display a different collection than the page's own collection (via a collection override setting)
- **THEN** the ItemList SHALL enumerate the overridden collection's products, not the page's own collection's products

#### Scenario: Collection page with a product-count limit
- **WHEN** a collection page's live section caps the number of products rendered
- **THEN** the ItemList SHALL contain only that same capped number of entries, matching what the shopper actually sees

#### Scenario: ItemList items are well-formed
- **WHEN** the ItemList is rendered
- **THEN** each entry SHALL declare a `position` (1-indexed, sequential), and reference the corresponding product's name and absolute URL
