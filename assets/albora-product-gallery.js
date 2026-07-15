/**
 * Albora — galeria de produto com Swiper.
 *
 * Desktop (>= 990px): thumbs verticais à esquerda controlam o slider principal.
 * Mobile: thumbs horizontais abaixo do produto.
 *
 * Reage à troca de variante via PUB_SUB_EVENTS.variantChange, indo para a mídia
 * destacada da variante selecionada.
 */
if (!customElements.get('albora-media-gallery')) {
  customElements.define(
    'albora-media-gallery',
    class AlboraMediaGallery extends HTMLElement {
      connectedCallback() {
        this.mainEl = this.querySelector('[data-albora-main]');
        if (!this.mainEl) return;

        this.desktopThumbsEl = this.querySelector('[data-albora-thumbs]');
        this.mobileThumbsEl = this.querySelector('[data-albora-thumbs-mobile]');

        this.whenSwiperReady().then(() => this.init());

        if (typeof subscribe === 'function') {
          // `sectionId` can differ from `data-section` during a product swap, so the
          // gallery matches on media id instead — setActiveMedia no-ops when the media
          // belongs to another gallery.
          this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
            const mediaId = data?.variant?.featured_media?.id;
            if (mediaId) this.setActiveMedia(mediaId);
          });
        }
      }

      disconnectedCallback() {
        this.variantChangeUnsubscriber?.();
        this.mainSwiper?.destroy(true, true);
        this.desktopThumbs?.destroy(true, true);
        this.mobileThumbs?.destroy(true, true);
      }

      whenSwiperReady() {
        if (window.Swiper) return Promise.resolve();
        return new Promise((resolve) => {
          const timer = setInterval(() => {
            if (window.Swiper) {
              clearInterval(timer);
              resolve();
            }
          }, 50);
        });
      }

      init() {
        const thumbCommon = {
          slidesPerView: 'auto',
          watchSlidesProgress: true,
          freeMode: true,
        };

        if (this.desktopThumbsEl) {
          this.desktopThumbs = new Swiper(this.desktopThumbsEl, {
            ...thumbCommon,
            direction: 'vertical',
            spaceBetween: 16,
          });
        }

        if (this.mobileThumbsEl) {
          this.mobileThumbs = new Swiper(this.mobileThumbsEl, {
            ...thumbCommon,
            direction: 'horizontal',
            spaceBetween: 16,
          });
        }

        this.mainSwiper = new Swiper(this.mainEl, {
          slidesPerView: 1,
          spaceBetween: 0,
          keyboard: { enabled: true },
          a11y: { enabled: true },
          thumbs: {
            swiper: this.desktopThumbs || this.mobileThumbs,
          },
        });

        // Swiper's `thumbs` module only binds one thumbnail instance, so the second
        // set (mobile) is kept in sync by hand.
        this.syncSecondaryThumbs();
      }

      syncSecondaryThumbs() {
        const secondary = this.mainSwiper.thumbs?.swiper === this.desktopThumbs ? this.mobileThumbs : this.desktopThumbs;
        if (!secondary) return;

        secondary.on('click', () => {
          if (secondary.clickedIndex != null) this.mainSwiper.slideTo(secondary.clickedIndex);
        });

        const markActive = () => {
          secondary.slides.forEach((slide, index) => {
            slide.classList.toggle('swiper-slide-thumb-active', index === this.mainSwiper.activeIndex);
          });
        };

        this.mainSwiper.on('slideChange', markActive);
        markActive();
      }

      /**
       * @param {number|string} mediaId - id da mídia (sem o prefixo da seção).
       */
      setActiveMedia(mediaId) {
        const slides = Array.from(this.mainEl.querySelectorAll('.swiper-slide[data-media-id]'));
        const index = slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
        if (index === -1) return;
        this.mainSwiper?.slideTo(index);
      }
    }
  );
}
