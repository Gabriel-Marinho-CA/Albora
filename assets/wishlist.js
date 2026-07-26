(function () {
  'use strict';

  // ─── Storage API ────────────────────────────────────────────────────────────

  const STORAGE_KEY = 'res_wishlist';
  // Os handles ficam num segundo registro (id → handle) para não quebrar o
  // formato do `res_wishlist`, que continua sendo só o array de ids.
  // São eles que permitem à <wishlist-grid> pedir o card de cada produto.
  const HANDLES_KEY = 'res_wishlist_handles';

  const WishlistStore = {
    getIds() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch {
        return [];
      }
    },

    getHandles() {
      try {
        return JSON.parse(localStorage.getItem(HANDLES_KEY) || '{}');
      } catch {
        return {};
      }
    },

    getHandle(productId) {
      return this.getHandles()[String(productId)] || null;
    },

    // [{ id, handle }] na ordem em que foram favoritados.
    getItems() {
      const handles = this.getHandles();
      return this.getIds().map((id) => ({ id, handle: handles[id] || null }));
    },

    has(productId) {
      return this.getIds().includes(String(productId));
    },

    add(productId, handle) {
      const id  = String(productId);
      const ids = this.getIds();
      if (handle) this._setHandle(id, handle);
      if (ids.includes(id)) return;
      ids.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      this._emit(id, true);
    },

    remove(productId) {
      const id  = String(productId);
      const ids = this.getIds().filter(i => i !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));

      const handles = this.getHandles();
      delete handles[id];
      localStorage.setItem(HANDLES_KEY, JSON.stringify(handles));

      this._emit(id, false);
    },

    toggle(productId, handle) {
      this.has(productId) ? this.remove(productId) : this.add(productId, handle);
    },

    count() {
      return this.getIds().length;
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HANDLES_KEY);
      this._emit(null, false);
    },

    _setHandle(id, handle) {
      const handles = this.getHandles();
      if (handles[id] === handle) return;
      handles[id] = handle;
      localStorage.setItem(HANDLES_KEY, JSON.stringify(handles));
    },

    _emit(productId, added) {
      window.dispatchEvent(
        new CustomEvent('wishlist:change', {
          bubbles: true,
          detail: { productId, added, ids: this.getIds(), count: this.getIds().length }
        })
      );
    }
  };

  window.WishlistStore = WishlistStore;

  // ─── <wishlist-button> Web Component ────────────────────────────────────────
  //
  // Usage:
  //   <wishlist-button product-id="123456789">
  //     <button ...>...</button>
  //   </wishlist-button>
  //
  // Attributes:
  //   product-id  (required) — Shopify product ID
  //   handle      (optional) — Shopify product handle; guardado junto com o id
  //                            para a <wishlist-grid> conseguir renderizar o card
  //
  // CSS hooks:
  //   [active]              — product is in wishlist
  //   .is-animating         — briefly added on toggle for micro-animation

  class WishlistButton extends HTMLElement {
    connectedCallback() {
      this._id     = this.getAttribute('product-id');
      this._handle = this.getAttribute('handle');
      this._btn    = this.querySelector('button');

      // Reforça o handle de itens salvos antes de existir o registro de handles.
      if (this._handle && WishlistStore.has(this._id)) {
        WishlistStore.add(this._id, this._handle);
      }

      this._render();

      this._handleClick = this._onClick.bind(this);
      this._handleChange = this._onWishlistChange.bind(this);

      this.addEventListener('click', this._handleClick);
      window.addEventListener('wishlist:change', this._handleChange);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this._handleClick);
      window.removeEventListener('wishlist:change', this._handleChange);
    }

    _onClick(e) {
      e.preventDefault();
      WishlistStore.toggle(this._id, this._handle);
      this._animate();
    }

    _onWishlistChange(e) {
      // Sync all buttons for this product, regardless of which triggered the change
      if (e.detail.productId === this._id || e.detail.productId === null) {
        this._render();
      }
    }

    _render() {
      const active = WishlistStore.has(this._id);
      this.toggleAttribute('active', active);

      if (!this._btn) return;
      this._btn.setAttribute('aria-pressed', String(active));
      this._btn.setAttribute(
        'aria-label',
        active ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'
      );
    }

    _animate() {
      this.classList.add('is-animating');
      this.addEventListener('animationend', () => this.classList.remove('is-animating'), { once: true });
    }
  }

  if (!customElements.get('wishlist-button')) {
    customElements.define('wishlist-button', WishlistButton);
  }

  // ─── <wishlist-count> Web Component ─────────────────────────────────────────
  //
  // Displays the total wishlist count — useful in header icons.
  //
  // Usage:
  //   <wishlist-count class="wishlist-count"></wishlist-count>

  class WishlistCount extends HTMLElement {
    connectedCallback() {
      this._handleChange = () => this._render();
      window.addEventListener('wishlist:change', this._handleChange);
      this._render();
    }

    disconnectedCallback() {
      window.removeEventListener('wishlist:change', this._handleChange);
    }

    _render() {
      const n = WishlistStore.count();
      this.textContent = n > 0 ? String(n) : '';
      this.toggleAttribute('hidden', n === 0);
    }
  }

  if (!customElements.get('wishlist-count')) {
    customElements.define('wishlist-count', WishlistCount);
  }
})();
