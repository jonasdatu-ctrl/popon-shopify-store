## 1. Link extraction helper

- [x] 1.1 Add an `extractNextUrl(htmlString)` helper next to `extractIdsFromHtml` in `assets/customcode-youtube-carousel.js` that parses the HTML with `DOMParser`, finds `img[alt="More videos"]`, walks to its `.closest('a')`, and returns that anchor's `href` (or `null` if not found).
- [x] 1.2 Normalize the returned href to a same-origin path with `new URL(href, location.href).pathname` (return `null` when the href is missing/invalid).

## 2. Paging state

- [x] 2.1 Replace the `nextPage = 2` integer field with a `nextUrl` string field initialized in `connectedCallback` to `/pages/<base-handle>` (using `this.baseHandle`).
- [x] 2.2 Add `this.seen` (Set of video IDs) and `this.visited` (Set of fetched page paths) fields.
- [x] 2.3 In `seedFromDom`, add each server-rendered slide's video ID to `this.seen` as it is pushed to `this.ids`.

## 3. loadNextPage rewrite

- [x] 3.1 Guard: return early if `isLoading`/`done`, or if `nextUrl` is falsy, or if `nextUrl`'s path is already in `visited`.
- [x] 3.2 Build the fetch URL from `nextUrl`, appending `?view=video-feed` when `useFeedView` is true; add the path to `visited` before/after the fetch.
- [x] 3.3 On non-OK response, call `stop()` (retain existing safety net).
- [x] 3.4 Extract IDs from the response, filter out any already in `this.seen`, add the rest to `seen`, and append them as facades; if the fetched page yields no video IDs at all, call `stop()`.
- [x] 3.5 Set `this.nextUrl = extractNextUrl(html)`; if it is `null`, call `stop()`.
- [x] 3.6 Remove all remaining `nextPage`/`<base>-<n>` URL-construction logic.

## 4. Section setting copy

- [x] 4.1 Update the `base_handle` setting `info` text in `sections/customcode-youtube-reviews-carousel.liquid` to describe following the in-page "More videos" link instead of `<handle>-2, -3, …`.

## 5. Verification

- [ ] 5.1 On the live domain, confirm scrolling the carousel walks `video-reviews → more-videos-211 → more-videos-210 → …`, appending videos, with at most one fetch in flight.
- [ ] 5.2 Confirm paging stops cleanly at the end of the chain (no console errors) and that a page linking back to an already-visited URL does not loop or duplicate slides.
- [ ] 5.3 Confirm modal "next past the last loaded video" still pulls in the next page via the new logic.
- [x] 5.4 Confirm the "More videos" anchor is present inside the fetched `?view=video-feed` response (part of `page.content`).
