# Design: Fix Buy Box V2 variant selector and default delivery selection

## Context

Buy Box V2 is a custom purchase widget made of:

- `snippets/customcode-buy-box-v2.liquid` — server-rendered markup: variant option buttons, an empty delivery-options container, and the ATC button, wrapped in a `<c-buy-box-v2>` custom element carrying `data-default-selector` from the block setting.
- `snippets/customcode-scripts.liquid` — the `CBuyBoxV2` custom element class (~lines 1970–2250). It parses a JSON variant manifest, resolves the current variant from active option buttons in `updateState()`, and renders delivery options (OTP + subscription plans) client-side.
- `sections/customcode-featured-product.liquid` — defines the `buy_box_v2` block with a `default_selector` select setting (`otp` / `subs`, default `otp`).

Current defects:

1. The liquid guard `{% if product.options_with_values.size != 0 %}` never evaluates false — Shopify gives variant-less products a synthetic "Title" option with value "Default Title" — so a useless "Title: Default" selector renders.
2. `this.defaultSelector` is read in the constructor but never consulted. `updateState()` hardcodes the default to the first subscription plan whenever the variant has selling plan allocations, so the merchant setting does nothing.
3. `updateState()` unconditionally reassigns `this.selectedDeliveryId` on every call, so switching variants wipes the customer's manually chosen delivery option.

## Goals / Non-Goals

**Goals:**
- Hide the option selector for default-only products.
- Make `default_selector` actually drive the initial delivery selection.
- Keep the customer's delivery choice sticky across variant changes when still valid.

**Non-Goals:**
- No changes to the block schema, styles, add-to-cart flow, or the commented-out legacy `addToCart` variant.
- No refactor of the string-concatenated rendering in `renderDeliveryOptions()`.
- No changes to other buy-box components (`c-buy-button`, `c-selling-plan`, etc.).

## Decisions

1. **Use `product.has_only_default_variant` as the render guard** (replacing `options_with_values.size != 0`). This is Shopify's canonical flag for the placeholder-variant case and is exactly the condition we mean. The JS already handles the no-buttons case correctly: with zero `.value-container` elements, `selectedOptions` is empty and `Object.keys({}).every(...)` is vacuously true, so `updateState()` matches the first (only) variant.

2. **Centralize delivery-default resolution in `updateState()`** rather than in the constructor or `renderDeliveryOptions()`, since `updateState()` is the single point where the current variant changes (initial load and every option click). Logic:
   - If `this.selectedDeliveryId` is already set and still valid for the new variant, keep it. Validity: `'otp'` is always valid; `sub-<id>` is valid iff the new variant's `selling_plan_allocations` contains that `selling_plan_id`.
   - Otherwise apply the default: no allocations → `'otp'`; `defaultSelector === 'subs'` → `sub-<first allocation id>`; else → `'otp'`.
   - Chosen over tracking a separate "user has interacted" flag: validity-based persistence is simpler and behaves identically in practice, because before any user interaction `selectedDeliveryId` only ever holds a value the default rule produced.

3. **Persist by selling plan id, not by list position.** A `sub-` choice carries the selling plan id in the radio id (`sub-<selling_plan_id>`), which is stable across variants of the same product, making cross-variant matching trivial with the existing id format. No new state shape needed — `selectedDeliveryId` remains the single source of truth.

## Risks / Trade-offs

- [Merchant expectation change] Templates that today rely on the accidental "always default to subscription" behavior will start defaulting to OTP where the block setting is `otp` (the schema default). → This is the intended fix; verify live templates' configured values before deploying (`product.pouch.json`, `product.oral-mist-template.json`, `page.landing-pouch.json` all set the setting explicitly).
- [Hidden selector regression] Some product using Buy Box V2 might genuinely have a single option named "Title" with a non-default value; `has_only_default_variant` correctly stays false there, so no regression.
- [State drift] `renderDeliveryOptions()` reads `this.selectedDeliveryId` and re-renders on radio change; keeping all default logic out of the render path avoids the two writing to the same state in different orders.

## Migration Plan

Theme-file-only change; deploy via the normal theme push. Rollback = revert the two edited files. No data or schema migration.

## Open Questions

None.
