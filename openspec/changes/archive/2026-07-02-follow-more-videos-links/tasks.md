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

## 4. Fill-loop so paging advances past zero-append loads (D6)

- [x] 4.1 Add a synchronous `needsMore()` method: return true when the sentinel's left edge is within 600px of the track's right edge (`getBoundingClientRect`), false when `done`/missing nodes.
- [x] 4.2 In `loadNextPage`'s `.finally`, after clearing `isLoading`, call `loadNextPage()` again while `needsMore()` is true (relies on existing `done`/`!nextUrl`/`visited` guards to terminate).

## 5. Section setting copy

- [x] 5.1 Update the `base_handle` setting `info` text in `sections/customcode-youtube-reviews-carousel.liquid` to describe following the in-page "More videos" link instead of `<handle>-2, -3, …`.

## 6. Performance: skip painting offscreen slides (D7 Tier 1)

- [x] 6.1 Add `content-visibility: auto; contain-intrinsic-size: <slide-w> <slide-h>;` to the `.ytc-slide` CSS rule in `snippets/customcode-youtube-carousel-slider.liquid`, using intrinsic sizes matching the 16:9 thumbnail plus meta block.
- [x] 6.2 Confirm no visible scroll-position jump or thumbnail cropping is introduced by the intrinsic-size placeholder. (Scroll geometry verified stable in headless-browser harness; sentinel column + scrollWidth correct across a 60-video chain.)

## 7. Performance: DOM windowing / virtualization (D7 Tier 3)

> **Group 7 REVERTED.** DOM windowing was implemented and browser-tested, but virtualization is incompatible with the track's `scroll-snap-type: x mandatory`: with only a window of slides mounted, most scroll positions have no snap target, so the browser force-snapped the scroller back into the window — freezing scroll near the end and hiding the nav. The virtualization was reverted to the original append-all rendering (scroll-snap restored). Tier 1 (`content-visibility`, group 6) is retained and still skips paint for offscreen slides. The DOM-bound optimization is deferred; if revisited it must drop mandatory snap (or use `proximity`) as a prerequisite.

- [ ] 7.1 ~~Split `appendFacade` into record-id (paging) + `renderWindow()` (renderer).~~ Reverted.
- [ ] 7.2 ~~Preserve scroll geometry via explicit `grid-column` + implicit tracks.~~ Reverted.
- [ ] 7.3 ~~rAF-throttled scroll handler mounting/unmounting a window with a recycle pool.~~ Reverted.
- [ ] 7.4 ~~Modal reads ids from `this.ids`; remount reuses `oembedCache`.~~ (Modal already read from `this.ids` — unchanged.)
- [ ] 7.5 ~~Keep paging + `needsMore()` fill-loop working with the windowed renderer.~~ Reverted (fill-loop retained with append rendering).
- [ ] 7.6 (Deferred, D7 Tier 2) Optional hard cap (~100 videos) + "See all reviews on YouTube" link to bound request count — only relevant if a DOM-bound approach is revisited.

## 8. Verification

- [x] 8.1 Confirm scrolling the carousel walks the chain (`video-reviews → more-videos-N → …`), appending videos, one fetch in flight. (Verified in headless Chrome against a mocked 30-page chain; all pages fetched once, in order.)
- [x] 8.2 Confirm paging stops cleanly at the end of the chain (no console errors) and that a page linking back to an already-visited URL does not loop or duplicate slides. (Verified: dedicated cycle test stops after 4 distinct fetches, `done=true`, no refetch.)
- [x] 8.3 Confirm modal "next past the last loaded video" still pulls in the next page via the new logic. (navigateModal unchanged, reads `this.ids` + calls `loadNextPage`; modal open/next/close verified in harness.)
- [x] 8.4 Confirm the "More videos" anchor is present inside the fetched `?view=video-feed` response (part of `page.content`).
- [x] 8.5 Scroll a long chain and confirm the carousel loads it and scrolls both ways. (Verified in headless Chrome after the group-7 revert: 60 videos load with append rendering, scroll-back to start works, arrows correct, no page errors. Note: DOM now holds all loaded slides — `content-visibility` keeps offscreen ones from painting.)

## 9. Post-deploy smoke test (live domain)

- [ ] 9.1 After deploying the asset + snippet, load a page with the section on `poponveneers.com` and confirm the carousel pages past the original videos and stays smooth while scrolling the full chain (harness verified logic; this confirms the live theme + template assignment).
