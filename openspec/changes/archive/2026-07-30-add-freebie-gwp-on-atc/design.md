## Context

See proposal.md - Why. Relevant existing code, all in `snippets/customcode-scripts.liquid`:

- `CBuyButton` (custom element behind `<c-buy-button>`, rendered by `customcode-buy-button.liquid` inside `sections/customcode-featured-product.liquid`) is the live add-to-cart path for essentially all product templates in this theme — not the native Horizon `product-form.js`.
- `CBuyButton.handleClick` builds a single-item payload via `buildProductData(variantId, sellingPlanId)` and posts it to `/cart/add.js`. On success or failure it dispatches `document.dispatchEvent(new CustomEvent('main-variant:added', { bubbles: true }))`.
- `snippets/customcode-product-upsells.liquid` (`CProductUpsells`) already listens for `main-variant:added` and performs its own independent `/cart/add.js` call for an upsell variant. This is the established pattern for "add a second line after the main add" in this codebase.
- The gift variant id currently arrives via `?variantgift=<id>` (kept as-is; not renamed by this change).

## Goals / Non-Goals

**Goals:**
- Replace the page-load auto-add with an add-to-cart-triggered add, scoped to `CBuyButton` only.
- Reuse the existing `main-variant:added` event rather than introducing a new mechanism.
- Keep the main product add and the freebie add as independent requests so a freebie failure never blocks or rolls back the main product.

**Non-Goals:**
- No changes to `assets/product-form.js` or any native theme ATC path.
- No changes to `snippets/customcode-buy-box-v2.liquid` or the older `GVariantSelector` variant-picker component.
- No dedupe/anti-abuse logic for repeated freebie adds (explicitly out of scope per proposal).
- No customer-facing messaging for a failed/sold-out freebie.

## Decisions

**Two independent `/cart/add.js` calls, not a single batched `items: [...]` request.**
Shopify's cart API treats a batched multi-item add as atomic: if any item in the array fails validation, none of the items are added. Since the requirement is "freebie failure must not affect the main product," a single main-item request followed by a separate freebie request (mirroring `CProductUpsells`) is the only option that keeps the two outcomes decoupled.

**Timestamp generated once per click, passed via the `main-variant:added` event's `detail`.**
The `_freebiegwp` value must be identical on both lines to correlate them as one set. Generating it in `handleClick` before the main add, and carrying it on the event (e.g. `detail: { freebieGwpTimestamp, freebieVariantId }`), lets the new freebie listener use the exact same value without recomputing `new Date().toISOString()` a second time (which would produce a slightly different timestamp and break the correlation).

**Gate at the top of `handleClick`, not at script-include time.**
`<c-buy-button>` is also used on non-`product` templates (e.g. `page.landing-pro-pods.json`). Since the custom element itself must stay defined globally, the product-page check (`template.name == 'product'`, emitted from Liquid as a small boolean) is evaluated inside `handleClick`/`buildProductData` at click time rather than by conditionally omitting the class definition.

**New freebie listener is a sibling to `CProductUpsells`'s pattern, not a merge into it.**
Upsell and freebie are unrelated concerns that happen to hook the same event. Keeping them as separate listeners (each doing its own fetch) matches the proposal's "coexist without suppression" requirement and avoids coupling two features that may evolve independently.

**No cart-state check before adding the freebie.**
The old script's "is this variant already in the cart?" guard is dropped entirely per the confirmed decision to allow multiple main+freebie sets. This also removes the extra `/cart.js` fetch that guard required.

## Risks / Trade-offs

- **[Risk] Repeat clicks multiply free items.** Confirmed as intended (1:1 sets, no cap) — flagging again here since it's a real cost exposure if someone spam-clicks. Mitigation: none in this change; if abuse becomes a problem later, a cap would need a new requirement (spec change), not a silent implementation tweak.
- **[Risk] `main-variant:added` currently fires in `handleClick`'s `finally` block, i.e. even when the main add fails.** The freebie listener must check for actual success (not just presence of the event) before adding the freebie, or a failed main add could still produce an orphaned freebie line. This is called out explicitly in tasks.md.
- **[Trade-off] Freebie add is fire-and-forget from the customer's perspective.** No loading state or confirmation UI for the freebie line; it simply appears (or doesn't) whenever the cart is next viewed/refreshed. Acceptable per the "add nothing on failure" decision, but worth knowing this is the same fire-and-forget UX the upsell feature already has.

## Migration Plan

- Remove the `giftVariantId` extraction and `processGiftVariant`/window-load block from `snippets/customcode-scripts.liquid` in the same change that adds the new behavior, so there is no window where both the old auto-add and the new click-triggered add are active together.
- No data migration needed; this only affects cart lines created going forward.
- Rollback: revert the single file change (`snippets/customcode-scripts.liquid`); no other files are touched.
