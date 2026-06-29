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

  function thumbUrl(id, quality) {
    return 'https://i.ytimg.com/vi/' + id + '/' + (quality || 'hqdefault') + '.jpg';
  }

  function embedUrl(id) {
    return 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
  }

  class YoutubeCarouselSlider extends HTMLElement {
    constructor() {
      super();
      this.ids = [];
      this.nextPage = 2; // page 1 is server-rendered
      this.isLoading = false;
      this.done = false;
      this.currentIndex = 0;
    }

    connectedCallback() {
      this.baseHandle = this.dataset.baseHandle || 'video-reviews';
      this.quality = this.dataset.quality || 'hqdefault';
      this.useFeedView = this.dataset.feedView !== 'false';

      this.track = this.querySelector('.ytc-track');
      this.sentinel = this.querySelector('.ytc-sentinel');
      this.modal = this.querySelector('.ytc-modal');
      this.modalStage = this.querySelector('.ytc-modal-stage');

      if (!this.track || !this.modal) return;

      this.seedFromDom();
      this.bindNav();
      this.bindSlides();
      this.bindModal();
      this.observeSentinel();
    }

    // Build the ordered id list from the server-rendered page-1 slides.
    seedFromDom() {
      var self = this;
      this.querySelectorAll('.ytc-slide').forEach(function (slide) {
        var id = slide.dataset.videoId;
        if (id) {
          slide.dataset.index = self.ids.length;
          self.ids.push(id);
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

    loadNextPage() {
      if (this.isLoading || this.done) return Promise.resolve();
      this.isLoading = true;
      var self = this;
      var url = '/pages/' + this.baseHandle + '-' + this.nextPage;
      if (this.useFeedView) url += '?view=video-feed';

      return fetch(url, { headers: { 'X-Requested-With': 'fetch' } })
        .then(function (res) {
          if (!res.ok) { self.stop(); return null; } // 404 => end of sequence
          return res.text();
        })
        .then(function (html) {
          if (html == null) return;
          var ids = extractIdsFromHtml(html);
          if (!ids.length) { self.stop(); return; } // empty page => treat as end
          ids.forEach(function (id) { self.appendFacade(id); });
          self.nextPage += 1;
          if (self._updateArrows) self._updateArrows();
        })
        .catch(function () { self.stop(); })
        .finally(function () { self.isLoading = false; });
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
        '</div>';
      this.track.insertBefore(slide, this.sentinel);
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
