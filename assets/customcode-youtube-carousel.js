/*
 * YouTube Reviews Carousel
 * ------------------------------------------------------------------
 * Custom element <youtube-carousel-slider>.
 *
 * - Page 1 slides are server-rendered (see the section Liquid); this script
 *   seeds its in-memory id list from them.
 * - Subsequent pages are fetched lazily (same-origin) from
 *   /pages/<base-handle>-<n>?view=video-feed, parsed for YouTube embeds, and
 *   appended as lightweight facade thumbnails. Paging stops on the first 404.
 * - Slides are facades (just an <img>). A real <iframe> is created only when a
 *   video is opened, and at most ONE live iframe exists at any time.
 */
(function () {
  'use strict';

  // Matches the 11-char id in /embed/<id>, youtu.be/<id>, or ?v=<id>
  var YT_ID_RE = /(?:youtube\.com\/embed\/|youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/;

  function extractIdsFromHtml(htmlString) {
    var doc = new DOMParser().parseFromString(htmlString, 'text/html');
    var iframes = doc.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]');
    var ids = [];
    iframes.forEach(function (frame) {
      var match = (frame.getAttribute('src') || '').match(YT_ID_RE);
      if (match) ids.push(match[1]);
    });
    return ids;
  }

  // The review pages chain via a merchant-authored "More videos" button
  // (<a href="..."><img alt="More videos"></a>). Return that link reduced to a
  // same-origin path (so absolute canonical-domain hrefs also work on previews),
  // or null when the page has no such button (end of the chain).
  function extractNextUrl(htmlString) {
    var doc = new DOMParser().parseFromString(htmlString, 'text/html');
    var img = doc.querySelector('img[alt="More videos"]');
    var anchor = img && img.closest('a');
    var href = anchor && anchor.getAttribute('href');
    if (!href) return null;
    try {
      return new URL(href, window.location.href).pathname;
    } catch (e) {
      return null;
    }
  }

  function thumbUrl(id, quality) {
    return 'https://i.ytimg.com/vi/' + id + '/' + (quality || 'hqdefault') + '.jpg';
  }

  function embedUrl(id) {
    return 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
  }

  function watchUrl(id) {
    return 'https://www.youtube.com/watch?v=' + id;
  }

  // Cache oEmbed lookups (title/author) so each id is fetched at most once.
  var oembedCache = {};
  function fetchMeta(id) {
    if (oembedCache[id]) return oembedCache[id];
    var url = 'https://www.youtube.com/oembed?url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + id) + '&format=json';
    oembedCache[id] = fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
    return oembedCache[id];
  }

  var YT_PLAY_SVG =
    '<svg viewBox="0 0 24 24" fill="#c4302b" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>';

  class YoutubeCarouselSlider extends HTMLElement {
    constructor() {
      super();
      this.ids = [];
      this.seen = new Set();    // video ids already shown (dedupe across pages)
      this.visited = new Set(); // page paths already fetched (loop protection)
      this.nextUrl = null;      // path of the next page to fetch (from "More videos")
      this.isLoading = false;
      this.done = false;
      this.currentIndex = 0;
    }

    connectedCallback() {
      this.baseHandle = this.dataset.baseHandle || 'video-reviews';
      this.quality = this.dataset.quality || 'hqdefault';
      this.useFeedView = this.dataset.feedView !== 'false';
      // Page 1 is server-rendered; its "More videos" link isn't in the DOM, so
      // the base page is fetched once (deduped by `seen`) to discover it.
      this.nextUrl = '/pages/' + this.baseHandle;

      this.track = this.querySelector('.ytc-track');
      this.sentinel = this.querySelector('.ytc-sentinel');
      this.modal = this.querySelector('.ytc-modal');
      this.modalStage = this.querySelector('.ytc-modal-stage');

      if (!this.track || !this.modal) return;

      this.mounted = new Map(); // index -> mounted slide element (the window)
      this.pool = [];           // detached slide elements available for reuse
      this._stride = 0;         // measured slide width + column gap (px)

      this.seedFromDom();
      this.bindNav();
      this.bindSlides();
      this.bindModal();
      this.bindScroll();
      this.updateSentinel();
      this.renderWindow();
      this.observeSentinel();
    }

    hydrateMeta(slide) {
      if (slide.dataset.metaLoaded) return;
      slide.dataset.metaLoaded = '1';
      var id = slide.dataset.videoId;
      var titleEl = slide.querySelector('[data-yt-title]');
      var channelEl = slide.querySelector('[data-yt-channel]');
      fetchMeta(id).then(function (meta) {
        if (!meta) return;
        if (titleEl && meta.title) {
          titleEl.textContent = meta.title;
          titleEl.setAttribute('title', meta.title);
        }
        if (channelEl && meta.author_name) channelEl.textContent = meta.author_name;
      });
    }

    // --- Virtualized rendering -------------------------------------------
    // `this.ids` is the source of truth; only a window of slide elements around
    // the scroll position is mounted. Each mounted slide is positioned by an
    // explicit `grid-column`, so the grid creates full-width (but empty)
    // implicit tracks for the unmounted videos — preserving scrollWidth and
    // scroll offset so the carousel behaves as if every slide were present.

    // Record page-1 ids from the server-rendered slides, then detach those
    // slides into the recycle pool; renderWindow() re-mounts the visible window.
    seedFromDom() {
      var self = this;
      this.querySelectorAll('.ytc-slide').forEach(function (slide) {
        var id = slide.dataset.videoId;
        if (id) { self.ids.push(id); self.seen.add(id); }
        slide.remove();
        self.pool.push(slide);
      });
    }

    createSlideEl() {
      var slide = document.createElement('div');
      slide.className = 'ytc-slide';
      slide.innerHTML =
        '<div class="ytc-inner">' +
          '<img class="ytc-thumb" loading="lazy" width="480" height="360" alt="Customer review video">' +
          '<div class="ytc-overlay"><div class="ytc-play-btn">' +
            '<svg viewBox="0 0 100 100" width="30" height="30"><polygon points="35,25 35,75 75,50" fill="white"/></svg>' +
          '</div></div>' +
        '</div>' +
        '<div class="ytc-meta">' +
          '<div class="ytc-title" data-yt-title>&nbsp;</div>' +
          '<div class="ytc-channel" data-yt-channel></div>' +
          '<a class="ytc-yt-link" target="_blank" rel="noopener noreferrer">' +
            YT_PLAY_SVG + 'Watch on YouTube' +
          '</a>' +
        '</div>';
      return slide;
    }

    // Populate a fresh or recycled slide element for ids[index].
    buildSlide(index) {
      var id = this.ids[index];
      var el = this.pool.pop() || this.createSlideEl();
      el.dataset.index = index;
      el.dataset.videoId = id;
      el.dataset.metaLoaded = '';
      el.style.gridColumn = String(index + 1);
      el.querySelector('.ytc-thumb').src = thumbUrl(id, this.quality);
      el.querySelector('.ytc-yt-link').href = watchUrl(id);
      var titleEl = el.querySelector('[data-yt-title]');
      if (titleEl) { titleEl.innerHTML = '&nbsp;'; titleEl.removeAttribute('title'); }
      var channelEl = el.querySelector('[data-yt-channel]');
      if (channelEl) channelEl.textContent = '';
      return el;
    }

    mountSlide(index) {
      var el = this.mounted.get(index);
      if (el) return el;
      el = this.buildSlide(index);
      this.track.insertBefore(el, this.sentinel);
      this.mounted.set(index, el);
      this.hydrateMeta(el); // mounted slides are near the viewport by definition
      return el;
    }

    unmountSlide(index) {
      var el = this.mounted.get(index);
      if (!el) return;
      el.remove();
      this.mounted.delete(index);
      if (this.pool.length < 24) this.pool.push(el); // cap the recycle pool
    }

    // Keep the sentinel at the column after the last known video so the grid
    // reserves full width for every video (mounted or not).
    updateSentinel() {
      if (this.sentinel) this.sentinel.style.gridColumn = String(this.ids.length + 1);
    }

    columnGap() {
      return parseFloat(getComputedStyle(this.track).columnGap) || 15;
    }

    // Slide stride (column width + gap). Bootstrapped from slide 0, which is in
    // view at initial load (scrollLeft 0) so its measured width is the true
    // column width — an offscreen probe would report the content-visibility
    // intrinsic size instead. Cached; re-measured on resize via remeasureStride.
    getStride() {
      if (this._stride) return this._stride;
      var probe = this.mounted.get(0);
      if (!probe && this.ids.length) probe = this.mountSlide(0);
      if (!probe) return 0;
      this._stride = probe.offsetWidth + this.columnGap();
      return this._stride;
    }

    // After a resize the column width changes; measure from a slide currently in
    // the viewport (content-visibility skips — and would mis-size — offscreen ones).
    remeasureStride() {
      var inView = null;
      var tRect = this.track.getBoundingClientRect();
      this.mounted.forEach(function (el) {
        if (inView) return;
        var r = el.getBoundingClientRect();
        if (r.right > tRect.left && r.left < tRect.right) inView = el;
      });
      if (inView) this._stride = inView.offsetWidth + this.columnGap();
    }

    // Mount the slides in view (± buffer) and unmount everything else.
    renderWindow() {
      if (!this.ids.length) { this.updateSentinel(); return; }
      var stride = this.getStride();
      if (!stride) return;
      var BUFFER = 4;
      var scrollLeft = this.track.scrollLeft;
      var viewW = this.track.clientWidth;
      var start = Math.max(0, Math.floor(scrollLeft / stride) - BUFFER);
      var end = Math.min(this.ids.length - 1, Math.ceil((scrollLeft + viewW) / stride) + BUFFER);
      for (var i = start; i <= end; i++) this.mountSlide(i);
      var self = this;
      this.mounted.forEach(function (el, idx) {
        if (idx < start || idx > end) self.unmountSlide(idx);
      });
      this.updateSentinel();
    }

    bindScroll() {
      var self = this;
      this.track.addEventListener('scroll', function () {
        if (self._rafPending) return;
        self._rafPending = true;
        requestAnimationFrame(function () {
          self._rafPending = false;
          self.renderWindow();
          if (self._updateArrows) self._updateArrows();
        });
      });
      window.addEventListener('resize', function () {
        self.remeasureStride(); // column width is responsive
        self.renderWindow();
      });
    }

    bindNav() {
      var prev = this.querySelector('.ytc-nav-arrow.prev');
      var next = this.querySelector('.ytc-nav-arrow.next');
      if (!prev || !next) return;
      var track = this.track;
      var update = function () {
        prev.classList.toggle('hidden', track.scrollLeft <= 5);
        next.classList.toggle('hidden', track.scrollLeft + track.offsetWidth >= track.scrollWidth - 5);
      };
      next.onclick = function () { track.scrollBy({ left: track.offsetWidth / 1.5, behavior: 'smooth' }); };
      prev.onclick = function () { track.scrollBy({ left: -track.offsetWidth / 1.5, behavior: 'smooth' }); };
      // Scroll updates (arrows + window render) are driven by bindScroll().
      this._updateArrows = update;
      update();
    }

    bindSlides() {
      var self = this;
      // Event delegation covers both server-rendered and appended slides.
      this.track.addEventListener('click', function (e) {
        // Let the "Watch on YouTube" link behave as a normal external link.
        if (e.target.closest('.ytc-yt-link')) return;
        var slide = e.target.closest('.ytc-slide');
        if (!slide) return;
        self.openModal(Number(slide.dataset.index));
      });
    }

    bindModal() {
      var self = this;
      var closeBtn = this.querySelector('.ytc-modal-close');
      var prevBtn = this.querySelector('.ytc-m-arrow.prev');
      var nextBtn = this.querySelector('.ytc-m-arrow.next');
      if (closeBtn) closeBtn.onclick = function () { self.closeModal(); };
      if (prevBtn) prevBtn.onclick = function (e) { e.stopPropagation(); self.navigateModal(-1); };
      if (nextBtn) nextBtn.onclick = function (e) { e.stopPropagation(); self.navigateModal(1); };

      // Click on the backdrop (not the player) closes.
      this.modal.addEventListener('click', function (e) {
        if (e.target === self.modal || e.target.classList.contains('ytc-modal-viewport')) {
          self.closeModal();
        }
      });

      document.addEventListener('keydown', function (e) {
        if (self.modal.getAttribute('aria-hidden') !== 'false') return;
        if (e.key === 'Escape') self.closeModal();
        else if (e.key === 'ArrowRight') self.navigateModal(1);
        else if (e.key === 'ArrowLeft') self.navigateModal(-1);
      });
    }

    observeSentinel() {
      if (!this.sentinel || !('IntersectionObserver' in window)) return;
      var self = this;
      this.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) self.loadNextPage();
        });
      }, { root: this.track, rootMargin: '0px 600px 0px 0px' });
      this.observer.observe(this.sentinel);
    }

    // Whether the sentinel is still within the load-ahead zone (mirrors the
    // IntersectionObserver's 600px right rootMargin). Used to keep filling
    // synchronously after a load, since a load that appends 0 new slides (e.g.
    // the base-page refetch, or a page whose videos were all already seen) does
    // not move the sentinel and so would not re-trigger the observer.
    needsMore() {
      if (this.done || !this.sentinel || !this.track) return false;
      var t = this.track.getBoundingClientRect();
      var s = this.sentinel.getBoundingClientRect();
      return s.left <= t.right + 600;
    }

    loadNextPage() {
      if (this.isLoading || this.done || !this.nextUrl) return Promise.resolve();
      var path = this.nextUrl;
      // A "More videos" link back into the chain would loop forever; stop instead.
      if (this.visited.has(path)) { this.stop(); return Promise.resolve(); }
      this.isLoading = true;
      this.visited.add(path);
      var self = this;
      var url = this.useFeedView ? path + '?view=video-feed' : path;

      return fetch(url, { headers: { 'X-Requested-With': 'fetch' } })
        .then(function (res) {
          if (!res.ok) { self.stop(); return null; } // missing page => end
          return res.text();
        })
        .then(function (html) {
          if (html == null) return;
          var ids = extractIdsFromHtml(html);
          if (!ids.length) { self.stop(); return; } // no embeds => treat as end
          // Record new ids only (dedupe against the base page's server-rendered
          // ids and any cross-page overlap); the renderer mounts what's in view.
          ids.forEach(function (id) {
            if (self.seen.has(id)) return;
            self.seen.add(id);
            self.ids.push(id);
          });
          self.updateSentinel();
          self.renderWindow();
          if (self._updateArrows) self._updateArrows();
          self.nextUrl = extractNextUrl(html);
          if (!self.nextUrl) self.stop(); // no "More videos" link => end of chain
        })
        .catch(function () { self.stop(); })
        .finally(function () {
          self.isLoading = false;
          // Keep loading until the sentinel is pushed out of the load-ahead
          // zone (or the chain ends); one fetch of ~2 videos is rarely enough.
          if (self.needsMore()) self.loadNextPage();
        });
    }

    stop() {
      this.done = true;
      if (this.observer) this.observer.disconnect();
    }

    openModal(index) {
      this.currentIndex = index;
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this.renderModalVideo();
    }

    closeModal() {
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      this.modalStage.innerHTML = ''; // removes the single iframe -> stops playback
    }

    navigateModal(dir) {
      var target = this.currentIndex + dir;
      // Navigating past the last loaded video pulls in the next page first.
      if (target >= this.ids.length && !this.done) {
        var self = this;
        this.loadNextPage().then(function () {
          if (target < self.ids.length) {
            self.currentIndex = target;
            self.renderModalVideo();
          }
        });
        return;
      }
      if (target < 0 || target >= this.ids.length) return;
      this.currentIndex = target;
      this.renderModalVideo();
    }

    renderModalVideo() {
      var id = this.ids[this.currentIndex];
      // Exactly one live iframe at a time.
      this.modalStage.innerHTML =
        '<iframe class="ytc-modal-iframe" src="' + embedUrl(id) + '" ' +
        'title="Customer review video" frameborder="0" allow="accelerometer; autoplay; ' +
        'clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'allowfullscreen></iframe>';
    }
  }

  if (!customElements.get('youtube-carousel-slider')) {
    customElements.define('youtube-carousel-slider', YoutubeCarouselSlider);
  }
})();
