## Purpose

Defines the gift-with-purchase (GWP) behavior triggered from the product page add-to-cart button: when a freebie variant is specified via URL param, it is added alongside the main product and both lines are tagged so the pairing is traceable in order data.

## ADDED Requirements

### Requirement: Freebie added together with the main product on add-to-cart
When the current page is a product page (`template.name == 'product'`) and a `variantgift` URL query parameter is present, clicking the add-to-cart button SHALL add the main product to the cart with cart-line properties `_freebiegwp` (an ISO 8601 timestamp) and `_freebiegwp_role: "main"`, and SHALL then add the variant identified by `variantgift` as a separate cart line with `_freebiegwp` set to the same timestamp and `_freebiegwp_role: "freebie"`.

#### Scenario: Customer adds to cart on a product page with a gift param
- **WHEN** a customer on a product page with `?variantgift=<id>` in the URL clicks the add-to-cart button
- **THEN** the main product is added to the cart with `_freebiegwp_role: "main"` and a `_freebiegwp` timestamp
- **AND** the variant `<id>` is added as its own cart line with `_freebiegwp_role: "freebie"` and the same `_freebiegwp` timestamp

#### Scenario: Coexists with other add-to-cart side effects
- **WHEN** the product also has an upsell selection active at the time of the click
- **THEN** the freebie line is still added alongside the main product and the upsell line, without either suppressing the other

### Requirement: Feature is inert without both conditions
The freebie add-to-cart behavior SHALL only occur when both conditions hold: the page is a product page and the `variantgift` param is present. If either condition is not met, add-to-cart SHALL behave as it does without this feature (no `_freebiegwp` properties, no freebie line added).

#### Scenario: Gift param present on a non-product page
- **WHEN** a `c-buy-button` add-to-cart button is clicked on a page whose template is not `product` (e.g. a landing page), even if `variantgift` is present in the URL
- **THEN** only the main product is added, with no `_freebiegwp` properties and no freebie line

#### Scenario: Product page without a gift param
- **WHEN** a customer clicks add-to-cart on a product page and no `variantgift` param is present
- **THEN** only the main product is added, with no `_freebiegwp` properties and no freebie line

### Requirement: Freebie failures do not affect the main product
If the variant identified by `variantgift` cannot be added (e.g. sold out, invalid, or unavailable variant id), the system SHALL still add the main product normally and SHALL NOT surface an error to the customer for the failed freebie add.

#### Scenario: Freebie variant is sold out or invalid
- **WHEN** a customer clicks add-to-cart on a product page with `?variantgift=<id>` where `<id>` is sold out or not a valid variant
- **THEN** the main product is added to the cart as normal, including its `_freebiegwp` properties
- **AND** no freebie line is added and no error message is shown to the customer

### Requirement: Each add-to-cart click produces an independent gift set
The system SHALL NOT check for or prevent duplicate freebie lines across multiple add-to-cart clicks. Each click that satisfies the trigger conditions SHALL produce its own main+freebie pair, correlated by its own `_freebiegwp` timestamp, independent of any other pairs already in the cart.

#### Scenario: Customer clicks add-to-cart more than once
- **WHEN** a customer on a product page with `?variantgift=<id>` clicks add-to-cart twice
- **THEN** the cart contains two main-product lines and two freebie lines, each main/freebie pair sharing its own distinct `_freebiegwp` timestamp
