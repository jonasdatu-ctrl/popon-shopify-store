## MODIFIED Requirements

### Requirement: Section renders a YouTube reviews carousel

The theme SHALL provide a section that displays YouTube customer-review videos in a horizontally-scrolling carousel, reusing the visual layout of the existing native-video carousel (track, navigation arrows, modal) adapted to a 16:9 landscape slide format. The section SHALL expose merchant-configurable settings including section heading, the base page handle (default `video-reviews`), and the YouTube thumbnail quality.

#### Scenario: Section appears on the page

- **WHEN** the section is added to a page or template in the theme editor
- **THEN** a heading (if configured) and a horizontal carousel of review-video thumbnails are rendered

#### Scenario: Merchant configures the base handle

- **WHEN** the merchant sets the base page handle setting to a value other than `video-reviews`
- **THEN** the carousel sources its first page from `/pages/<base-handle>` and sources each subsequent page by following the "More videos" link found on the previously loaded page

### Requirement: Additional pages load lazily until exhausted

After page 1, the carousel SHALL fetch subsequent pages only when the visitor approaches the end of the loaded slides, following each page's in-page "More videos" link to determine the next page, and appending the videos from each fetched page as facades. The "More videos" link is the URL of the anchor that wraps an image with `alt="More videos"`; discovered links SHALL be reduced to a same-origin path before fetching so that absolute canonical-domain URLs also work on preview domains. The carousel SHALL stop paging when a fetched page contains no "More videos" link, when a fetch returns a non-OK response, or when a fetched page contains no video embeds. The carousel SHALL NOT fetch the same page URL twice and SHALL NOT append a video that has already been shown, so that a page linking back into the chain cannot cause an infinite loop or duplicate slides. At most one page fetch SHALL be in flight at a time.

#### Scenario: Loading the next page on scroll

- **WHEN** the visitor scrolls the carousel track near its end and the last loaded page contained a "More videos" link
- **THEN** the page that link points to is fetched and its review videos are appended as facade slides

#### Scenario: Following the chain across differing handles

- **WHEN** the loaded page's "More videos" link points to a handle unrelated to the base handle (e.g. `more-videos-211` following `video-reviews`, or a descending `more-videos-210` after `more-videos-211`)
- **THEN** the carousel fetches exactly that linked page rather than an incremented `<base-handle>-n` URL

#### Scenario: Reaching the end of the chain

- **WHEN** a fetched page contains no anchor wrapping an image with `alt="More videos"`
- **THEN** the carousel stops requesting further pages and no error is shown to the visitor

#### Scenario: Chain links back to an already-visited page

- **WHEN** a "More videos" link points to a page URL that has already been fetched
- **THEN** the carousel does not fetch it again and stops paging, and no duplicate slides are appended

#### Scenario: Overlapping video sets between pages

- **WHEN** a fetched page includes a video that was already appended from an earlier page
- **THEN** that video is not appended a second time

#### Scenario: No overlapping fetches

- **WHEN** a page fetch is already in progress
- **THEN** a new page fetch is not started until the in-progress one completes

## ADDED Requirements

### Requirement: Carousel remains performant across long chains

The carousel SHALL keep its rendering cost bounded regardless of how many videos the "More videos" chain ultimately yields. Offscreen slides SHALL NOT incur layout/paint cost, and the number of slide elements mounted in the DOM SHALL be bounded to a window around the visitor's current scroll position rather than growing with the total number of loaded videos. Video identifiers and fetched metadata SHALL be retained as the source of truth so that slides can be unmounted and remounted without re-fetching metadata, and modal navigation SHALL continue to work for videos whose slides are not currently mounted. Loading additional pages SHALL remain scroll-driven so that no videos beyond the visitor's viewport-plus-buffer are fetched or rendered on initial load.

#### Scenario: Offscreen slides are not painted

- **WHEN** the carousel holds many slides and most are scrolled out of view
- **THEN** the browser skips layout and paint for the offscreen slides (they do not contribute rendering cost until scrolled near)

#### Scenario: DOM node count stays bounded while scrolling a long chain

- **WHEN** the visitor scrolls through a chain that yields hundreds of videos
- **THEN** the number of slide elements present in the DOM stays bounded to a window around the current position rather than accumulating one element per loaded video

#### Scenario: Unmounted videos remain navigable and re-render without refetch

- **WHEN** the visitor navigates the modal to, or scrolls back to, a video whose slide was unmounted
- **THEN** that video plays / its slide re-renders using the retained id and cached metadata, without re-requesting the metadata

#### Scenario: Initial load does not fetch the whole chain

- **WHEN** the page first loads
- **THEN** only the first page plus a scroll-ahead buffer is fetched and rendered, not the entire chain
