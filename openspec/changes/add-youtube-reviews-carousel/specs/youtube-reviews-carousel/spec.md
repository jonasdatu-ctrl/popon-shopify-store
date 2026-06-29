## ADDED Requirements

### Requirement: Section renders a YouTube reviews carousel

The theme SHALL provide a section that displays YouTube customer-review videos in a horizontally-scrolling carousel, reusing the visual layout of the existing native-video carousel (track, navigation arrows, modal) adapted to a 16:9 landscape slide format. The section SHALL expose merchant-configurable settings including section heading, the base page handle (default `video-reviews`), and the YouTube thumbnail quality.

#### Scenario: Section appears on the page

- **WHEN** the section is added to a page or template in the theme editor
- **THEN** a heading (if configured) and a horizontal carousel of review-video thumbnails are rendered

#### Scenario: Merchant configures the base handle

- **WHEN** the merchant sets the base page handle setting to a value other than `video-reviews`
- **THEN** the carousel sources its first page from `/pages/<base-handle>` and subsequent pages from `/pages/<base-handle>-2`, `-3`, and so on

### Requirement: Page 1 is server-rendered without a network request

The section SHALL render the first page of review videos at server-render time by reading `pages[<base-handle>].content`, extracting YouTube video IDs, and emitting facade slides directly in the initial HTML. This SHALL NOT require any client-side fetch and SHALL function even when JavaScript is disabled.

#### Scenario: First videos visible on initial load

- **WHEN** the page containing the section is loaded
- **THEN** the YouTube review videos from the base page are present as facade thumbnails in the initial server-rendered HTML, before any JavaScript executes

#### Scenario: Base page has no embeds

- **WHEN** `pages[<base-handle>]` does not exist or contains no YouTube embeds
- **THEN** the section renders without error and the carousel shows no slides from page 1

### Requirement: Additional pages load lazily until exhausted

After page 1, the carousel SHALL fetch subsequent pages (`/pages/<base-handle>-2`, `-3`, …) only when the visitor approaches the end of the loaded slides, appending their videos as facades. The carousel SHALL stop paging when a fetched page returns HTTP 404. At most one page fetch SHALL be in flight at a time.

#### Scenario: Loading the next page on scroll

- **WHEN** the visitor scrolls the carousel track near its end and more pages remain
- **THEN** the next sequential page is fetched and its review videos are appended as facade slides

#### Scenario: Reaching the end of the sequence

- **WHEN** a fetched page returns HTTP 404
- **THEN** the carousel stops requesting further pages and no error is shown to the visitor

#### Scenario: No overlapping fetches

- **WHEN** a page fetch is already in progress
- **THEN** a new page fetch is not started until the in-progress one completes

### Requirement: Lightweight source fetches via alternate template

Client-side page fetches SHALL request a lightweight representation (via an alternate page template, e.g. `?view=video-feed`) that returns only the video embeds rather than the full page layout, to minimize transferred bytes.

#### Scenario: Fetch uses the lightweight view

- **WHEN** the carousel fetches a subsequent page
- **THEN** the request targets the alternate lightweight template and the response excludes the site header, footer, and navigation chrome

### Requirement: Facade-based playback limits live iframes

Carousel slides SHALL render only a static YouTube thumbnail image plus a play affordance, not a live iframe. A real YouTube `<iframe>` SHALL be created only when a video is opened, and at no time SHALL more than one live YouTube iframe exist in the DOM.

#### Scenario: Slides are facades

- **WHEN** the carousel displays any number of review videos
- **THEN** each slide contains only an image and play affordance, and no YouTube iframe is present until a video is opened

#### Scenario: Opening a video creates a single iframe

- **WHEN** the visitor clicks a slide
- **THEN** a modal opens containing exactly one YouTube iframe that autoplays the selected video, and no other iframe exists in the DOM

#### Scenario: Switching videos reuses the single iframe

- **WHEN** the visitor navigates to an adjacent video within the modal
- **THEN** the modal plays the newly selected video and there is still at most one live iframe in the DOM

### Requirement: Modal playback and dismissal

The section SHALL provide a modal that plays the selected review video, allows navigation to the previous and next loaded video, and can be dismissed. Closing the modal SHALL stop playback by removing the live iframe.

#### Scenario: Navigate between videos

- **WHEN** the visitor uses the modal's next/previous controls
- **THEN** the modal loads and plays the adjacent loaded video

#### Scenario: Closing stops playback

- **WHEN** the visitor closes the modal
- **THEN** the modal is hidden, the live iframe is removed so audio/video stops, and page scrolling is restored

### Requirement: Cards display video metadata before playback

Each carousel card SHALL display the video's real title and a "Watch on YouTube" link before the visitor opens the video. The title (and channel name when available) SHALL be retrieved client-side from the YouTube oEmbed endpoint and fetched lazily (only as a card nears the viewport), with each video looked up at most once. The "Watch on YouTube" link SHALL open the video on `youtube.com` in a new tab and SHALL NOT trigger the in-page modal.

#### Scenario: Title shown on the card

- **WHEN** a card scrolls near the viewport
- **THEN** its real YouTube video title (and channel, if available) is fetched once via oEmbed and displayed on the card without opening the video

#### Scenario: Watch on YouTube link

- **WHEN** the visitor clicks the "Watch on YouTube" link on a card
- **THEN** the video opens on youtube.com in a new tab and the in-page modal does NOT open

#### Scenario: Metadata lookup is deduplicated

- **WHEN** the same video appears or is hydrated more than once
- **THEN** the oEmbed endpoint is requested at most once for that video id

### Requirement: Performance and lazy loading

Offscreen thumbnail images SHALL be lazy-loaded, and the section SHALL add resource hints (preconnect) for the YouTube thumbnail and embed hosts. The carousel's JavaScript SHALL be delivered as a deferred asset loaded only where the section is used, without modifying the shared `customcode-scripts.liquid` bundle.

#### Scenario: Thumbnails are lazy-loaded

- **WHEN** the carousel contains thumbnails outside the initial viewport
- **THEN** those thumbnail images use lazy loading and are not requested until needed

#### Scenario: Script is scoped and deferred

- **WHEN** the section is rendered
- **THEN** its JavaScript loads in a deferred manner and is not added to the global `customcode-scripts.liquid` bundle
