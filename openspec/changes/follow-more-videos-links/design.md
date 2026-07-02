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

## Risks / Trade-offs

- **Merchant changes the button's `alt` text or markup** → paging halts after page 1 (same failure mode as today, no worse). Mitigation: `alt="More videos"` selector is isolated in one helper for easy update; document the contract in tasks.
- **"More videos" anchor stripped by the feed view** → the link lives inside merchant-authored `{{ page.content }}`, which the feed template renders, so it survives; but if a merchant authors the button outside page content it would be lost. Mitigation: JS falls back to full-page parsing when the feed template is absent; note the requirement that the button be inside page content.
- **Extra page-1 fetch** → one additional small request on first paging. Mitigation: gated behind the scroll sentinel (only when the user nears the end) and served by the lightweight `?view=video-feed` template.
- **Pages mixing non-YouTube embeds (e.g. TikTok)** → `extractIdsFromHtml` only matches YouTube iframes, so non-YouTube items are silently skipped; a page of only non-YouTube embeds hits the empty-page stop. Mitigation: acceptable — the carousel is YouTube-only by design; flag during implementation if review pages are actually TikTok.
- **Very long chains** → link-following has no upper bound. Mitigation: fetches remain lazy (one per sentinel trigger) and `visited` bounds total distinct fetches to the number of real pages.

## Migration Plan

1. Edit `assets/customcode-youtube-carousel.js`: swap `nextPage` for `nextUrl`, add `extractNextUrl` + `visited`/`seen` sets, seed `nextUrl` and `seen`, update `loadNextPage()`. No new files.
2. Update the `base_handle` `info` text in `sections/customcode-youtube-reviews-carousel.liquid`.
3. Verify on the live domain that paging walks `video-reviews → more-videos-211 → 210 → …` and terminates cleanly.
4. **Rollback:** revert the asset and section edits; behavior returns to numeric paging. No data or template migration involved.

## Open Questions

- Should the base-page fetch be skipped entirely if a `data-next-url` could instead be cheaply emitted by Liquid later? (Deferred; D2's runtime fetch is chosen for robustness now.)
- Are all review pages genuinely YouTube embeds, or do some carry TikTok/other players that should also surface? (To confirm during implementation; out of scope if YouTube-only.)
