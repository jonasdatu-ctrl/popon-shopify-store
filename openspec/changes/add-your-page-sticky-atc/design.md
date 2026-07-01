## Context

On `your-*` handle pages, the main PDP is a section (`customcode-featured-product`, containing `<c-buy-button>`) placed near the bottom of the page template content. The existing sticky ATC (`sections/customcode-sticky-atc.liquid` + `CStickyATC` in `snippets/customcode-scripts.liquid`) observes the ATC with an IntersectionObserver:

```
ATC intersecting     → hide
ATC above viewport   → SHOW   (boundingClientRect.bottom < 0)
ATC below viewport   → hide   ← gap: nothing shown while reading marketing content
```

So there is a long window (the whole scroll from page top down to the PDP) with no persistent CTA.

## Goals / Non-Goals

**Goals:**
- Fill the "ATC below viewport" gap with a mobile sticky button on `your-*` pages.
- Clean, gapless, non-overlapping handoff with the existing sticky ATC.
- Reuse existing styling/behavior conventions (`.c-mobile`, `.c-sticky-action`, IntersectionObserver, inline `style.display` toggling).

**Non-Goals:**
- No changes to the existing `customcode-sticky-atc` section or `<c-buy-button>`.
- No desktop sticky behavior.
- No new routing logic in `layout/theme.liquid`.

## Decisions

**1. New section, not an extended existing one.** Add `sections/customcode-sticky-atc-scroll.liquid` with its own custom element `<c-sticky-scroll>`. Keeps the two behaviors independent and each configurable (label/title differ from the existing sticky ATC). The JS is a mirror of `CStickyATC`.

**2. Observe the ATC directly, not the PDP section top.** Both buttons key off the same `document.querySelector('c-buy-button') || document.querySelector('button.cbb-add-to-cart')`. This guarantees a clean partition:

```
scroll down ─────────────────────────────────────────────►
State A: ATC below viewport  │ State B: ATC in view │ State C: ATC above viewport
 existing sticky:  hidden     │ hidden               │ SHOWN
 NEW sticky:       SHOWN       │ hidden               │ hidden
```

Observing the PDP section top instead would reopen a dead zone when the section is partly visible but the ATC (deeper inside it) is still unreachable.

Mirror of the existing handler:
```js
handleIntersect(entry):
  if entry.isIntersecting            → hide
  else if boundingClientRect.top > 0 → SHOW   // ATC below viewport
  else                               → hide   // ATC above → existing sticky owns it
```

**3. Self-gate on handle inside the section.** Liquid has no `startsWith`, so use `{% assign p = page.handle | slice: 0, 5 %}{% if p == 'your-' %}`. This correctly excludes `love-your-smile-1`. Gating inside the section means it is a safe no-op if placed on non-`your-` pages.

**4. Placement.** The section is added to the `your-*` page template JSON order immediately before `customcode-featured-product`. No `layout/theme.liquid` change needed.

**5. Reuse styling.** Root element uses `class="c-mobile"` (mobile-only via existing CSS) and the section wrapper uses the `c-sticky-action` class for `position: sticky; bottom: 0`. Toggle visibility with inline `style.display` (`''` reverts to the `.c-mobile` rule; `'none'` hides), matching `CStickyATC`.

**6. Click behavior.** `targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })` — identical to the existing sticky ATC.

## Risks / Trade-offs

- **Sticky positioning frame vs JS toggle timing.** `position: sticky; bottom: 0` un-pins around the element's natural flow position (just before the PDP), while the JS toggle hides based on ATC intersection. Because the element sits directly before the PDP and both are driven by the same ATC/proximity, they coincide closely; minor visual timing differences are acceptable and match how the existing sticky already behaves.
- **ATC not present / renders late.** If `<c-buy-button>` is absent or added after `connectedCallback`, the observer won't attach. Guard for a missing target (stay hidden, no errors); acceptable since the main PDP is server-rendered on these pages.
- **Duplicate registration.** Register `<c-sticky-scroll>` alongside the other `customElements.define(...)` calls in `snippets/customcode-scripts.liquid`; ensure the tag name is unique.
- **Shared-class alternative not taken.** A single class with a `direction` flag would reduce duplication but couples the two sections; independent sections were preferred for clarity and per-section configurability.
