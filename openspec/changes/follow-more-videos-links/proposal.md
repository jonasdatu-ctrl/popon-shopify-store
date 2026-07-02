## Why

The YouTube reviews carousel pages its content by requesting `/pages/<base>-2`, `-3`, … and stopping on the first 404. The merchant's live pages do not follow that scheme: `video-reviews` links to `more-videos-211`, which links to `more-videos-210`, and so on — the handle prefix changes and the numbers descend. The current logic 404s on its very first paging request, so the carousel silently shows only page 1. The pages are instead chained by an in-page "More videos" button, so paging must follow that link.

## What Changes

- Replace the numeric-increment paging strategy (`<base>-2`, `-3`, … terminated by 404) with a link-following strategy: each fetched page is scanned for an anchor wrapping an image with `alt="More videos"`, and that anchor's URL becomes the next page to fetch.
- Terminate paging when a fetched page contains no "More videos" link (in addition to the existing non-OK / empty-page safety stops).
- Discover page 1's "More videos" link at runtime by fetching the base page once (page 1's video slides remain server-rendered; the fetch is only to read its next-link and is deduplicated against already-rendered slides).
- Add loop protection: track visited page URLs and already-seen video IDs so a page that links back into the chain cannot cause an infinite loop or duplicate slides.
- Normalize discovered links to a same-origin path (use only the URL pathname) before fetching, so absolute `poponveneers.com` hrefs also work on `*.myshopify.com` previews and keep the `?view=video-feed` behavior.
- Update the `base_handle` section setting help text, which currently documents the `<handle>-2, -3, …` contract.

## Capabilities

### New Capabilities
<!-- None; this modifies existing carousel behavior. -->

### Modified Capabilities
- `youtube-reviews-carousel`: The "Additional pages load lazily until exhausted" requirement changes its paging contract from an incrementing numeric handle sequence terminated by HTTP 404 to following each page's in-page "More videos" link, terminated when no such link is present; loop/duplicate protection is added. The base-handle configuration scenario no longer implies `-2`/`-3` successor handles.

## Impact

- `assets/customcode-youtube-carousel.js`: paging state and `loadNextPage()` logic (next-URL string instead of page counter; new `extractNextUrl` helper; visited-URL and seen-ID sets).
- `sections/customcode-youtube-reviews-carousel.liquid`: `base_handle` setting `info` text only (no rendering change).
- `templates/page.video-feed.liquid`: unchanged, but relied upon to keep the merchant-authored "More videos" anchor inside `{{ page.content }}`.
- No change to server-side page-1 rendering, facade/modal playback, metadata, or the shared script bundle.
