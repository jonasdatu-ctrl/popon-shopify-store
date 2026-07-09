# rebuy-smart-cart Specification

## ADDED Requirements

### Requirement: Selling plan indicator on cart line items
The Rebuy Smart Cart SHALL display the selling plan name (e.g. "Delivery every 1 month") on every line item that carries a `selling_plan_allocation`, positioned below the variant title. The indicator SHALL NOT render when Rebuy's switch-to-subscription block is shown for that item, since that block's frequency select already displays the current plan. Line items without a selling plan SHALL render unchanged.

#### Scenario: Subscription item without switch-to-subscription configured
- **WHEN** an item added with a selling plan renders in the Smart Cart and `hasSwitchToSubscription(item)` is false
- **THEN** the item shows the selling plan's name below its variant title

#### Scenario: Subscription item with switch-to-subscription configured
- **WHEN** an item added with a selling plan renders and Rebuy's switch-to-subscription block (frequency select) is shown for it
- **THEN** the plain indicator is not rendered, and the plan remains visible via the select's current option

#### Scenario: One-time purchase item
- **WHEN** an item without a selling plan renders in the Smart Cart
- **THEN** no selling plan indicator is rendered and the item's layout is unchanged
