## Context

The theme already has a "GTAG Scripts" block at the bottom of `snippets/customcode-scripts.liquid` (~line 2284) with three custom GA events (`c_gorgias_rivo_traffic`, `c_variant_clicked`, `c_search`). `gtag()` is defined in `snippets/customcode-header-scripts.liquid` and pushes to the GTM `dataLayer` (container GTM-P48PB3L).

The Accordion block of `sections/customcode-featured-product.liquid` is rendered by `snippets/customcode-accordion.liquid`. All its content settings are `richtext` or structured types; Shopify richtext strips attributes, so a merchant cannot author a link carrying `data-` attributes today.

Immediate use case: a "Contact us" link inside a PDP accordion whose clicks marketing wants to see in GA.

## Goals / Non-Goals

**Goals:**
- One generic, site-wide mechanism: any element with `data-ga-label` fires `c_element_clicked` on click.
- Works for elements added at any time (dynamic content, theme-editor re-renders, merchant-pasted HTML).
- Merchant can author trackable HTML in the Featured Product accordion block via the theme editor.

**Non-Goals:**
- No arbitrary extra event parameters (e.g. `data-ga-property-*` spreading) — label + page URL only, until a real need appears.
- No changes to existing GA events or GTM container configuration (GA4 custom-dimension registration is an admin task outside this repo).
- No tracking of non-click interactions (impressions, hovers).

## Decisions

**1. Attribute: `data-ga-label` serves as both marker and payload.**
Presence opts the element in; value is the `event_label`. One attribute to remember when authoring HTML. A generic name like `data-property` was rejected — too likely to collide with third-party scripts (Rebuy, Intelligems, Friendbuy all run on this theme).

**2. Document-level event delegation, not per-element binding.**
`document.addEventListener('click', e => e.target.closest('[data-ga-label]') ...)` instead of the `querySelectorAll` + per-element pattern used by `c_variant_clicked`. Delegation covers dynamically injected elements (the merchant-pasted HTML, Rebuy widgets, editor re-renders) with zero re-initialization, and clicks on descendants resolve to the tracked ancestor via `closest()`.

**3. Event name `c_element_clicked`, fired via `gtag()`.**
Follows the established `c_` prefix convention and the existing `gtag('event', ...)` pipeline so GTM/GA treatment is identical to the current custom events. Payload mirrors `c_variant_clicked`: `event_category: 'interaction'`, `event_label`, `page_url`. Guard with `typeof gtag === 'function'` so ad blockers or script-load failures never break navigation.

**4. New setting is `"type": "html"` on the accordion block schema.**
Shopify's `html` setting type preserves raw markup (richtext strips attributes; `liquid` type would also work but invites logic in settings). Rendered unconditionally-if-present in `snippets/customcode-accordion.liquid`, wrapped in a `custom-html-container` div, placed after the existing content outputs so live accordions are unchanged.

**5. Tracker lives in the existing "GTAG Scripts" script block.**
Same file and section as the other GA event handlers — one place to look for all custom GA wiring. No new asset file; this theme's custom JS convention is inline scripts in `customcode-scripts.liquid`.

## Risks / Trade-offs

- [Event may race same-tab navigation on link clicks] → GA4's default beacon transport survives page unload in modern browsers; if drops are observed, author the link with `target="_blank"` — no code change needed.
- [`gtag` here is configured for Google Ads (AW-615818041); GA4 collection depends on GTM forwarding] → The three existing custom events already rely on this pipeline and are visible in GA, so the same wiring applies. Verify `c_element_clicked` arrives in GA4 DebugView during QA; register `event_label` as a custom dimension in GA4 admin if it needs to be queryable.
- [Merchant-authored HTML is rendered raw] → This is the point of the setting, and only staff with theme-editor access can set it. Same trust level as the theme's existing `liquid`/custom HTML surfaces.
- [Duplicate events if an element with `data-ga-label` is nested inside another] → `closest()` returns only the nearest tracked ancestor; exactly one event fires per click. Documented behavior, not a bug.

## Migration Plan

Additive only. New setting defaults to empty (no render change), tracker no-ops until an element opts in. Deploy via the normal theme push; rollback is removing the two small additions.

## Open Questions

- None blocking. GA4 custom-dimension registration for `event_label` (admin console) should be coordinated with whoever owns the GA property.
