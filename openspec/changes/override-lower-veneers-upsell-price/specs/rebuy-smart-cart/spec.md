# Spec Delta

## ADDED Requirements

### Requirement: Lower veneers upsell price override

The Rebuy Smart Cart cross-sell widget SHALL display configured override prices, instead of Rebuy's default prices, on the "Complete Your Fangs with Matching Lower Veneers" product card. The override SHALL replace both the sale price and the compare-at price shown on that card, and SHALL remain in effect whenever the widget is re-rendered (for example after a cart change). The override SHALL affect only that product's card; all other cards in the widget SHALL display Rebuy's prices unchanged. The override SHALL change only what is displayed and SHALL NOT alter the price charged in the cart or at checkout.

The two override prices SHALL be defined in one clearly labelled place in the source so they can be edited without changing any other logic.

#### Scenario: Card is rendered with default prices

- **WHEN** the cross-sell widget renders the "Complete Your Fangs with Matching Lower Veneers" card with Rebuy's default sale and compare-at prices
- **THEN** the card's visible sale price shows the configured override sale price and its visible compare-at price shows the configured override compare-at price

#### Scenario: Widget re-renders after a cart change

- **WHEN** the cart changes and the widget re-renders, restoring Rebuy's default prices on the card
- **THEN** the override prices are shown again on the card without any further customer action

#### Scenario: Other cards in the widget

- **WHEN** the widget also renders other product cards (for example the Halloween Bling Bundle)
- **THEN** those cards display the prices supplied by Rebuy, unchanged

#### Scenario: Card is not rendered

- **WHEN** the widget does not render the "Complete Your Fangs with Matching Lower Veneers" card
- **THEN** the override has no visible effect and nothing else in the cart is altered

#### Scenario: Screen reader labels

- **WHEN** the override is applied to the card
- **THEN** the "Sale price" and "Original price" screen-reader labels remain in place and only the visible price text changes
