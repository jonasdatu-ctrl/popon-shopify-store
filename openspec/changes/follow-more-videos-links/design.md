## Context

The YouTube reviews carousel (`assets/customcode-youtube-carousel.js`) pages by building `/pages/<base-handle>-<n>?view=video-feed` for n = 2, 3, 4… and stopping on the first non-OK response. This implemented decision **D4** of the original design (`archive/2026-06-29-add-youtube-reviews-carousel/design.md`), which assumed "the merchant is standardizing on the numeric sequence" and explicitly rejected following an in-page next-link.

The live pages disprove that assumption. Inspecting them:

```
/pages/video-reviews   ──"More videos"──▶  /pages/more-videos-211
/pages/more-videos-211 ──"More videos"──▶  /pages/more-videos-210
/pages/more-videos-210 ──"More videos"──▶  /pages/more-videos-209  ──▶ …
```

The successor handle prefix changes (`video-reviews` → `more-videos`) and the numbers descend, so no `<base>-n` increment can reach page 2. In practice the carousel's first paging request 404s and it shows only page 1. The pages are chained by a merchant-authored anchor of the form:

```html
<a href="https://poponveneers.com/pages/more-videos-211" title="more videos 211">
  <img src="…more_videos_button_480x480.png…" alt="More videos" …>
</a>
```

Constraints carried over from the original design: client fetches are same-origin only; Liquid renders page 1 server-side but the JS does not otherwise have page 1's raw HTML; the extraction helper already parses fetched HTML with `DOMParser`.

## Goals / Non-Goals

**Goals:**
- Reverse D4: page by following each page's "More videos" link instead of an incrementing numeric handle.
- Reach every page in the real chain regardless of handle naming or numeric direction.
- Preserve all existing behavior: server-rendered page 1, facade/single-iframe playback, modal, oEmbed metadata, lazy fetch on scroll and on modal next-past-end, ≤1 in-flight fetch.
- Be robust against cycles and overlapping video sets.

**Non-Goals:**
- Changing server-side page-1 rendering, playback, modal, or metadata.
- Making the carousel work on cross-origin `*.myshopify.com` previews beyond page 1 (still same-origin only; the pathname normalization is a resilience measure, not a cross-origin fix).
- A general-purpose crawler — extraction stays tuned to the merchant's `alt="More videos"` button.
- Supporting multiple distinct "More videos" links on one page (first match is used).

## Decisions

### D1: Follow the in-page "More videos" link instead of incrementing a handle
Replace the integer `nextPage` with a `nextUrl` string. `loadNextPage()` fetches `nextUrl`, extracts video IDs, then extracts the next `nextUrl` from the same response via a new `extractNextUrl(html)` helper: `DOMParser` → `querySelector('img[alt="More videos"]')` → `.closest('a')` → its `href`. Paging stops when `extractNextUrl` returns nothing. *Why:* it is the only strategy that matches the real page chain. *Alternative — keep numeric, fix the base:* rejected; the numbers descend and the count/endpoint is unknown, so no static rule works.

### D2: Discover page 1's link by fetching the base page once, deduped by a seen-ID set
Page 1's slides are server-rendered, so the JS cannot see page 1's "More videos" anchor. Initialize `nextUrl` to `/pages/<base-handle>` and let the normal `loadNextPage()` loop fetch it first. Seed a `seen` Set with the IDs of the server-rendered slides; when the base page is fetched, its already-known IDs are filtered out and only its "More videos" link is used. *Why:* keeps all HTML parsing in JS with `DOMParser` (robust) and needs no brittle Liquid href extraction; the extra fetch is a few KB under `?view=video-feed`, negligible against the iframe-dominated budget. *Alternative — Liquid emits `data-next-url`:* rejected; parsing an anchor's `href` out of `pages[].content` with Liquid `split` is order-dependent and fragile compared to `DOMParser`.

### D3: Normalize discovered links to a same-origin path
Discovered hrefs are absolute canonical-domain URLs (`https://poponveneers.com/pages/…`). Reduce each to its `pathname` (via `new URL(href, location.href).pathname`) before appending `?view=video-feed` and fetching. *Why:* on the live domain it is already same-origin, but taking the pathname makes the request same-origin on any host (including previews), and keeps the lightweight-view contract. *Alternative — fetch the absolute URL as-is:* rejected; guarantees a cross-origin failure on preview and couples fetches to the canonical hostname.

### D4: Cycle and duplicate protection via `visited` URLs + `seen` IDs
Maintain `this.visited` (Set of normalized page paths already fetched) and `this.seen` (Set of appended video IDs). Before fetching, if `nextUrl`'s path is in `visited`, stop. After fetching, add the path to `visited`; append only IDs not already in `seen`. *Why:* a linked list can cycle or revisit, which the old 404 terminator made impossible; without guards the carousel could loop forever or show duplicates. *Alternative — rely on IDs only:* rejected; ID dedupe prevents duplicate slides but not repeated network fetches of a cycling URL.

### D5: Keep existing stop conditions as safety nets
Retain the non-OK-response stop and the empty-page (no IDs) stop from the current `loadNextPage()`. The primary terminator becomes "no More videos link," with these as fallbacks. *Why:* defense in depth against malformed or moved pages.

### D6: Fill the load-ahead zone synchronously after each fetch
The base-page refetch (D2) appends zero new slides (its IDs are already in `seen`), so it does not move the trailing sentinel and the `IntersectionObserver` — which only fires on intersection *changes* — never re-fires, stalling the chain before the first page with new content. The same stall hits any page whose ~2 videos are too few to push the sentinel out of the 600px trigger zone. Add a synchronous `needsMore()` check (`getBoundingClientRect` on sentinel vs. track right edge + 600px) and, in `loadNextPage`'s `.finally`, call `loadNextPage()` again while `needsMore()` is true. Termination is guaranteed by the existing guards (`done`, `!nextUrl`, `visited`). *Why:* the observer alone cannot advance across zero-append loads; the fill-loop is bounded by scroll position (it only fills ~600px ahead), so initial load stays cheap. *Alternative — seed `nextUrl` from a Liquid `data-next-url` to avoid the zero-append base fetch:* still needed for small pages, and adds the brittle Liquid parsing D2 rejected.

### D7: Performance at scale — facades + `content-visibility`, then DOM windowing
The link chain can reach ~200 pages × ~2 videos ≈ **~400 slides** if a visitor scrolls the whole carousel. The facade pattern already caps the catastrophic cost (≤ 1 live iframe regardless of count) and paging is scroll-bounded (nothing loads until scrolled toward), so *initial* load is unaffected. The remaining cost is **unbounded DOM/image accumulation** — ~400 slides (~4,000 nodes) plus their lazy thumbnails and per-card oEmbed lookups — which is only paid by a visitor who scrolls to the end. Three tiers, applied in order of payoff/effort:

- **Tier 1 — `content-visibility: auto` (adopt now, cheap):** add `content-visibility: auto; contain-intrinsic-size: <w> <h>;` to `.ytc-slide` so the browser skips layout/paint for offscreen slides. Near-zero risk, largest single win against scroll jank; makes hundreds of slides render like a handful. Does not reduce node count or image/oEmbed requests.
- **Tier 3 — DOM windowing/virtualization (adopt — the structural fix):** decouple paging from rendering. `this.ids` (all known video IDs, plus the cached oEmbed meta) becomes the single source of truth; the DOM holds only a **window** of slide elements around the current scroll position (plus a small buffer). Rather than spacer elements, each mounted slide is placed with an explicit `grid-column`, so the existing CSS grid auto-creates full-width but empty implicit tracks for the unmounted videos — preserving `scrollWidth` and scroll offset with no layout-model change and keeping the no-JS page-1 fallback intact (the sentinel is pinned to column `ids.length + 1`). A scroll handler throttled with `requestAnimationFrame` recomputes the window and mounts/unmounts slides via a small recycle pool; slide stride is measured once from a mounted slide (and re-measured from an in-view slide on resize, since `content-visibility` would mis-size an offscreen probe). Modal navigation already reads from `this.ids` (not the DOM), so it is unaffected by unmounting; `oembedCache` prevents metadata refetch when a slide remounts. This bounds DOM cost to O(window) instead of O(videos), enabling unbounded chains without bloat. **`scroll-snap-type: x mandatory` MUST be removed from the track:** windowing leaves most scroll positions without a snap target, so mandatory snap force-snaps the scroller back into the mounted window and makes it impossible to scroll (and to reach the arrows' end state) through unmounted regions. *Cost:* a real refactor — `appendFacade` splits into "record ID" (paging) and "render window" (renderer), title/click hydration moves onto the windowed slides, and the carousel loses slide snapping.
- **Tier 2 — hard cap (optional belt-and-suspenders):** with virtualization the DOM is already bounded, so a cap is optional; if desired, stop paging after ~100 videos and surface a "See all reviews on YouTube" link to also bound total page/oEmbed requests. *Alternative to Tier 3 — cap only:* rejected as the primary answer because it hides content and the merchant's chain may keep growing; kept as an optional add-on.

*Why this ordering:* Tier 1 is a free CSS win shipped immediately; Tier 3 is the correct structural bound for a potentially long chain; Tier 2 is a cheap optional guard on request count.

## Risks / Trade-offs

- **Merchant changes the button's `alt` text or markup** → paging halts after page 1 (same failure mode as today, no worse). Mitigation: `alt="More videos"` selector is isolated in one helper for easy update; document the contract in tasks.
- **"More videos" anchor stripped by the feed view** → the link lives inside merchant-authored `{{ page.content }}`, which the feed template renders, so it survives; but if a merchant authors the button outside page content it would be lost. Mitigation: JS falls back to full-page parsing when the feed template is absent; note the requirement that the button be inside page content.
- **Extra page-1 fetch** → one additional small request on first paging. Mitigation: gated behind the scroll sentinel (only when the user nears the end) and served by the lightweight `?view=video-feed` template.
- **Pages mixing non-YouTube embeds (e.g. TikTok)** → `extractIdsFromHtml` only matches YouTube iframes, so non-YouTube items are silently skipped; a page of only non-YouTube embeds hits the empty-page stop. Mitigation: acceptable — the carousel is YouTube-only by design; flag during implementation if review pages are actually TikTok.
- **Very long chains** → link-following has no upper bound, and slides accumulate in the DOM (~400 at full scroll). Mitigation: fetches remain lazy (scroll-bounded) and `visited` bounds distinct fetches to the real page count; DOM/paint cost is addressed by D7 (`content-visibility` now, DOM windowing for the node-count bound), with an optional hard cap on request count.

## Migration Plan

1. Edit `assets/customcode-youtube-carousel.js`: swap `nextPage` for `nextUrl`, add `extractNextUrl` + `visited`/`seen` sets, seed `nextUrl` and `seen`, update `loadNextPage()`, add the `needsMore()` fill-loop (D6). No new files.
2. Add `content-visibility` to `.ytc-slide` (D7 Tier 1) in `snippets/customcode-youtube-carousel-slider.liquid`.
3. Refactor rendering to DOM windowing (D7 Tier 3): split `appendFacade` into ID-recording (paging) and window-rendering (renderer) with spacers + rAF-throttled scroll handler and a recycle pool.
4. Update the `base_handle` `info` text in `sections/customcode-youtube-reviews-carousel.liquid`.
5. Verify on the live domain that paging walks `video-reviews → more-videos-211 → 210 → …`, terminates cleanly, and that the mounted-slide count stays bounded while scrolling a long chain.
6. **Rollback:** revert the asset and section edits; behavior returns to numeric paging. No data or template migration involved.

## Open Questions

- Should the base-page fetch be skipped entirely if a `data-next-url` could instead be cheaply emitted by Liquid later? (Deferred; D2's runtime fetch is chosen for robustness now.)
- Are all review pages genuinely YouTube embeds, or do some carry TikTok/other players that should also surface? (To confirm during implementation; out of scope if YouTube-only.)
