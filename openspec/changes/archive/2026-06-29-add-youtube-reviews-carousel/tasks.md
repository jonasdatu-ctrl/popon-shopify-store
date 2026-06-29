## 1. Lightweight source template

- [x] 1.1 Create `templates/page.video-feed.liquid` that renders only `{{ page.content }}` (the YouTube embeds) with no header, footer, or nav chrome.
- [ ] 1.2 Verify fetching `/pages/video-reviews?view=video-feed` returns a small response containing the embed iframes.

## 2. Shared ID-extraction helper

- [x] 2.1 In `assets/customcode-youtube-carousel.js`, add a helper that parses an HTML string with `DOMParser`, selects `iframe[src*="youtube"], iframe[src*="youtu.be"]`, and returns deduped 11-char video IDs (regex on `/embed/<ID>`, `youtu.be/<ID>`, `watch?v=<ID>`).
- [x] 2.2 Add a thumbnail-URL builder `https://i.ytimg.com/vi/<ID>/<quality>.jpg` and an embed-URL builder `https://www.youtube.com/embed/<ID>?autoplay=1&rel=0`.

## 3. Section + server-rendered page 1

- [x] 3.1 Create `sections/customcode-youtube-reviews-carousel.liquid` with `{% schema %}` settings: heading, `base_handle` (default `video-reviews`), thumbnail quality (default `hqdefault`), and presets.
- [x] 3.2 In the section, read `pages[section.settings.base_handle].content` and extract video IDs via Liquid `split` on `youtube.com/embed/` (with `youtu.be/` / `watch?v=` fallbacks); guard for missing page / no embeds.
- [x] 3.3 Render the carousel shell by including the new snippet, passing the page-1 IDs and settings; emit `<link rel="preconnect">` for `www.youtube.com` and `i.ytimg.com`.
- [x] 3.4 Enqueue the deferred script: `<script src="{{ 'customcode-youtube-carousel.js' | asset_url }}" defer></script>`.

## 4. Facade carousel markup (snippet)

- [x] 4.1 Create `snippets/customcode-youtube-carousel-slider.liquid` adapting the existing carousel CSS/markup to 16:9 landscape slides (track, prev/next nav arrows).
- [x] 4.2 Render each page-1 slide as a facade: lazy-loaded `<img>` thumbnail (`loading="lazy"`, explicit width/height) + play button overlay, carrying `data-video-id`.
- [x] 4.3 Add a trailing sentinel element for infinite-load detection and the modal container (single-iframe slot, close button, prev/next controls).

## 5. Custom element behavior

- [x] 5.1 Define `<youtube-carousel-slider>` in `assets/customcode-youtube-carousel.js`; on connect, wire prev/next track scrolling and arrow visibility (mirror existing `VideoCarouselSlider`).
- [x] 5.2 Maintain an ordered in-memory list of loaded video IDs seeded from the server-rendered page-1 slides.
- [x] 5.3 Implement `appendFacade(id)` that builds and appends a facade slide and registers its click handler to open the modal at the right index.

## 6. Infinite paging

- [x] 6.1 Add an `IntersectionObserver` on the sentinel that triggers loading the next page when it nears the viewport.
- [x] 6.2 Implement `loadNextPage()`: increment counter (start at 2), `fetch('/pages/' + base + '-' + n + '?view=video-feed')`, guard with an `isLoading` flag to prevent overlapping fetches.
- [x] 6.3 On `response.ok`, extract IDs, append facades, advance the counter; on 404/non-ok, stop and disconnect the observer.

## 7. Modal playback (single iframe)

- [x] 7.1 Implement `openModal(index)`: show modal, lock body scroll, inject one `<iframe>` with the autoplay embed URL for the selected video.
- [x] 7.2 Implement next/prev navigation that swaps the iframe `src` to the adjacent loaded video (and, optionally, triggers `loadNextPage()` when navigating past the last loaded item).
- [x] 7.3 Implement `closeModal()`: remove the iframe (stops playback), hide modal, restore body scroll.

## 9. Card metadata (title + watch link)

- [x] 9.1 Add a `fetchMeta(id)` oEmbed helper (cached) and a `watchUrl(id)` builder to the asset JS.
- [x] 9.2 Render a meta area (title placeholder, channel, "Watch on YouTube" link) on both server-rendered and JS-appended facade cards.
- [x] 9.3 Lazily hydrate each card's title/channel via an IntersectionObserver; skip modal opening when the watch link is clicked.

## 8. Verification

- [ ] 8.1 On the live domain, confirm page 1 renders facades server-side with JS disabled, and that no YouTube iframe exists in the DOM until a slide is clicked.
- [ ] 8.2 Confirm scrolling toward the end fetches `video-reviews-2`, `-3`, … and stops cleanly at the first 404, with only one live iframe ever present.
- [ ] 8.3 Sanity-check page speed: thumbnails lazy-load, preconnects fire, and the section script is not in the global `customcode-scripts.liquid` bundle.
