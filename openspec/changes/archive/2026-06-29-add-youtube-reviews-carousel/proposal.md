## Why

The store has a growing library of YouTube customer-review videos spread across paginated CMS pages (`/pages/video-reviews`, `/pages/video-reviews-2`, `-3`, …). We want to surface them in a single, on-brand carousel that visitors can browse without leaving the page, while the merchant keeps adding pages over time. The existing `customcode-video-carousel-slider` only plays Shopify-hosted native videos from a metaobject, so it cannot present YouTube embeds, and naively loading many YouTube iframes would destroy page speed.

## What Changes

- Add a **new theme section** that renders a YouTube-review carousel, reusing the visual shell (track, nav arrows, modal) of the existing `customcode-video-carousel-slider` but with a brand-new media layer.
- **Facade-based playback**: carousel slides render only lightweight YouTube thumbnail images; the real `<iframe>` is instantiated lazily on click inside a modal, with at most **one live iframe at any time**.
- **Infinite loading by following an incrementing page sequence**: render page 1 (`video-reviews`) first, then fetch `video-reviews-2`, `-3`, `-4`, … on demand until a page returns 404.
- **Page 1 is server-rendered** from `pages['video-reviews'].content` (no network request, works without JS); pages 2+ are fetched client-side, same-origin.
- **Lightweight source fetches** via an alternate page template (`?view=video-feed`) that outputs only the video embeds instead of the full page chrome.
- Slides switch from the existing 9:16 portrait layout to **16:9 landscape** to match YouTube embeds.
- Add a **dedicated, deferred asset JS file** for the new custom element rather than appending to the shared `customcode-scripts.liquid` bundle.
- Hover-to-autoplay preview is **not** carried over (facades show a static thumbnail) — this is inherent to the perf-safe approach, not a regression of the new section.

## Capabilities

### New Capabilities
- `youtube-reviews-carousel`: A theme section that aggregates YouTube review videos from a sequence of CMS pages, lazy-loads them as facades into a horizontally-scrolling carousel with infinite paging, and plays them one-at-a-time in a modal.

### Modified Capabilities
<!-- None. The existing native-video carousel is left untouched; this is a new, parallel section. -->

## Impact

- **New files**:
  - `sections/customcode-youtube-reviews-carousel.liquid` — section with schema settings and server-rendered page 1.
  - `snippets/customcode-youtube-carousel-slider.liquid` — facade/landscape markup shell (modal, nav).
  - `assets/customcode-youtube-carousel.js` — deferred custom element (`<youtube-carousel-slider>`): fetch, parse, infinite-load, facade, modal.
  - `templates/page.video-feed.liquid` (or `.json`) — lightweight alternate template emitting only video embeds for fetches.
- **Merchant setup (content, not code)**: review pages must be created with consistent handles (`video-reviews`, `video-reviews-2`, …) and contain YouTube embed iframes; the alternate template must be assigned to them.
- **External dependencies (runtime only)**: YouTube thumbnail host `i.ytimg.com` and embed host `www.youtube.com` (preconnect added). No new build dependencies.
- **Untouched**: existing `customcode-video-carousel-slider`, its metaobject (`firelight_video_set`), and `customcode-scripts.liquid`.
- **Constraint**: client-side fetching is same-origin and therefore only works on the live `poponveneers.com` domain, not on `*.myshopify.com` theme previews.
