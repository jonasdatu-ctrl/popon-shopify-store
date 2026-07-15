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

      this.setupTitleObserver();
      this.seedFromDom();
      this.bindNav();
      this.bindSlides();
      this.bindModal();
      this.observeSentinel();
    }

    // Lazily fetch the real video title/channel (via oEmbed) only when a card
    // is near the viewport, so titles never add upfront network cost.
    setupTitleObserver() {
      if (!('IntersectionObserver' in window)) { this._noTitleObserver = true; return; }
      var self = this;
      this.titleObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            self.titleObserver.unobserve(entry.target);
            self.hydrateMeta(entry.target);
          }
        });
      }, { rootMargin: '200px' });
    }

    observeOrHydrate(slide) {
      if (this._noTitleObserver) this.hydrateMeta(slide);
      else this.titleObserver.observe(slide);
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

    // Build the ordered id list from the server-rendered page-1 slides.
    seedFromDom() {
      var self = this;
      this.querySelectorAll('.ytc-slide').forEach(function (slide) {
        var id = slide.dataset.videoId;
        if (id) {
          slide.dataset.index = self.ids.length;
          self.ids.push(id);
          self.seen.add(id);
          self.observeOrHydrate(slide);
        }
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
      track.addEventListener('scroll', update);
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
          // Skip videos already shown (e.g. the base page's server-rendered ids).
          ids.forEach(function (id) {
            if (self.seen.has(id)) return;
            self.seen.add(id);
            self.appendFacade(id);
          });
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

    appendFacade(id) {
      var index = this.ids.length;
      this.ids.push(id);
      var slide = document.createElement('div');
      slide.className = 'ytc-slide';
      slide.dataset.videoId = id;
      slide.dataset.index = index;
      slide.innerHTML =
        '<div class="ytc-inner">' +
          '<img class="ytc-thumb" loading="lazy" width="480" height="360" ' +
            'src="' + thumbUrl(id, this.quality) + '" alt="Customer review video">' +
          '<div class="ytc-overlay"><div class="ytc-play-btn">' +
            '<svg viewBox="0 0 100 100" width="30" height="30"><polygon points="35,25 35,75 75,50" fill="white"/></svg>' +
          '</div></div>' +
        '</div>' +
        '<div class="ytc-meta">' +
          '<div class="ytc-title" data-yt-title>&nbsp;</div>' +
          // '<div class="ytc-channel" data-yt-channel></div>' +
          // '<a class="ytc-yt-link" href="' + watchUrl(id) + '" target="_blank" rel="noopener noreferrer">' +
          //   YT_PLAY_SVG + 'Watch on YouTube' +
          // '</a>' +
        '</div>';
      this.track.insertBefore(slide, this.sentinel);
      this.observeOrHydrate(slide);
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
