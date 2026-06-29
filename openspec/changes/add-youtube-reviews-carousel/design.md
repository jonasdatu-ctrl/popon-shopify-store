## Context

The theme already ships `customcode-video-carousel-slider` (markup in `snippets/customcode-video-carousel-slider.liquid`, behavior in the `VideoCarouselSlider` class at `snippets/customcode-scripts.liquid:557`). It is built entirely around native Shopify `<video>` elements sourced from the `firelight_video_set` metaobject: 9:16 portrait slides, hover-to-autoplay previews, and a vertical modal track of `<video>` elements.

The new requirement is a parallel carousel sourced from **YouTube embeds** that the merchant maintains across a sequence of CMS pages (`/pages/video-reviews`, `/pages/video-reviews-2`, …). Because the theme runs on the same origin as those pages (`poponveneers.com`), the browser can fetch them directly. The merchant will author the pages with a consistent format, so an incrementing handle sequence terminated by a 404 is a reliable paging contract.

Constraints:
- Liquid cannot perform HTTP requests, but it **can** read any page's body via the global `pages[<handle>]`.
- YouTube iframes are heavy (~0.5–1 MB+ each); naively rendering many would wreck Core Web Vitals.
- Client-side fetching is same-origin only — it works on the live domain, not `*.myshopify.com` previews.

## Goals / Non-Goals

**Goals:**
- A new, self-contained section that presents YouTube review videos in the existing carousel's look and feel.
- Infinite/lazy paging across `video-reviews`, `video-reviews-2`, … until 404.
- Strict performance budget: facade thumbnails only in the carousel; at most one live iframe at a time.
- Page 1 server-rendered for instant first paint and no-JS resilience.
- Zero changes to the existing native-video carousel and its shared script bundle.

**Non-Goals:**
- Replacing or migrating the existing `firelight_video_set` carousel.
- Hover-to-autoplay video previews (impossible with facades; static thumbnail instead).
- Working on `*.myshopify.com` theme previews (cross-origin fetch is out of scope).
- A general-purpose web scraper — extraction is tuned to the merchant's own consistent page format.
- Using the YouTube IFrame Player API for fine-grained playback control (a plain `<iframe>` with `autoplay=1` suffices).

## Decisions

### D1: Reuse the visual shell, replace the media engine
Fork the markup/CSS of `customcode-video-carousel-slider` into a new snippet rather than parameterizing the original. The playback layer differs fundamentally (facade `<img>` + on-demand `<iframe>` vs native `<video>`), slides are 16:9 not 9:16, and there is no hover preview. *Alternative considered:* adding a `mode` flag to the existing snippet/class — rejected because it would entangle two divergent media models in one 90-line CSS block and the 557-line shared class, raising regression risk on a live carousel.

### D2: Page 1 server-rendered from `pages[handle].content`
The section reads `pages[section.settings.base_handle].content` in Liquid, extracts video IDs with `split`-based string parsing on `youtube.com/embed/` (and `youtu.be/` / `watch?v=` as fallbacks), and emits facade slides inline. *Why:* fastest LCP, no initial network round-trip, and the carousel still shows content if the asset JS fails or is blocked. *Alternative:* fetch page 1 via JS like the others — rejected for the extra round-trip and empty-state flash.

### D3: Facade pattern with a single live iframe
Slides contain only `https://i.ytimg.com/vi/<ID>/<quality>.jpg` plus a play button. Clicking opens a modal that injects one `<iframe>` (`…/embed/<ID>?autoplay=1&rel=0`). Modal next/prev and close swap or remove that single iframe. *Why:* decouples DOM cost from video count — N videos cost N small images + ≤1 iframe, which is what makes "infinite" viable. *Alternatives:* inline iframes per slide (catastrophic at scale); YouTube IFrame API facade libraries (extra dependency, unneeded control).

### D4: Incrementing-handle paging with 404 as terminator
Client fetches `/pages/<base>-<n>?view=video-feed` for n = 2,3,4…; a non-`ok` response (404) stops paging. An `IntersectionObserver` on a trailing sentinel triggers the next fetch as the user nears the track end; an `isLoading` guard prevents overlapping requests. *Why:* matches the merchant's stated authoring scheme and needs no index/manifest. *Alternative:* follow an in-page "More videos" next-link (the current live site's pattern) — rejected because the merchant is standardizing on the numeric sequence.

### D5: Lightweight alternate page template for fetches
Add `templates/page.video-feed.liquid` (assigned to the review pages, requested via `?view=video-feed`) that renders only `{{ page.content }}` (the embeds) with no header/footer/nav. *Why:* turns a ~100 KB full-page fetch into a few KB. *Fallback:* if the template is not assigned, the JS still parses the full page HTML via `DOMParser` — correctness holds, only payload grows.

### D6: Dedicated deferred asset, custom element `<youtube-carousel-slider>`
Behavior lives in `assets/customcode-youtube-carousel.js`, loaded with `defer` and only by the section. *Why:* keeps it out of the 2,284-line global `customcode-scripts.liquid`, scopes cost to pages that use it, and isolates it from the existing `VideoCarouselSlider`. Extraction shares one helper: parse an HTML string with `DOMParser`, `querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]')`, map to 11-char IDs via regex.

### D7: Resource hints and lazy images
Emit `<link rel="preconnect">` for `https://www.youtube.com` and `https://i.ytimg.com`. Facade thumbnails use `loading="lazy"` and explicit width/height to avoid layout shift.

## Risks / Trade-offs

- **Cross-origin on previews** → Documented as live-domain-only; previews show page 1 (SSR) but cannot page further. Acceptable per the environment decision.
- **Liquid HTML parsing of `pages[].content` is brittle** → Constrain to splitting on stable `youtube.com/embed/<ID>` substrings with multiple fallbacks; if extraction finds nothing, page 1 simply renders empty rather than erroring, and JS paging still covers pages 2+.
- **Merchant forgets to assign the `video-feed` template** → JS falls back to parsing full-page HTML (heavier but correct); document the assignment step in tasks.
- **Thumbnail quality gaps** (`maxresdefault.jpg` absent for some videos) → Default to `hqdefault`/`mqdefault`, which always exist; make quality a setting with a safe default.
- **Sequence gaps** (merchant skips `-3` but has `-4`) → A single 404 terminates paging, so gaps hide later videos. Documented contract: pages must be contiguous. (Could later be relaxed with a small look-ahead, deferred.)
- **YouTube embed/thumbnail URL format changes** → Low likelihood; isolated to the extraction helper and thumbnail URL builder for easy update.

## Migration Plan

1. Add the four new files; no existing files are modified, so deployment is additive and low-risk.
2. Merchant creates/labels review pages with contiguous handles and assigns the `video-feed` template.
3. Add the section to the desired page/template via the theme editor and configure settings.
4. **Rollback:** remove the section from the template (instant) and/or delete the new files; nothing else depends on them.

## Open Questions

- Modal navigation orientation: up/down (mirrors the existing modal) vs left/right for landscape. Defaulting to up/down unless the merchant prefers otherwise.
- Default thumbnail quality: `hqdefault` (always present, 4:3 with letterbox, cropped via `object-fit: cover`) vs `mqdefault` (clean 16:9, lower res). Leaning `hqdefault` cropped.
- Whether to cache extracted IDs in `sessionStorage` to skip refetching on back-navigation (nice-to-have, can be a follow-up).
