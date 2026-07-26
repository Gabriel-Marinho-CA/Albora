/**
 * <wishlist-grid> — renderiza os cards dos produtos favoritados.
 *
 * Lê os itens do `WishlistStore` (assets/wishlist.js) e busca o markup de cada
 * card pelo Section Rendering API, para o card ser sempre o mesmo Liquid do
 * resto do tema (`snippets/res-cards.liquid`) em vez de um clone em JS.
 *
 * Markup esperado (ver sections/albora-wishlist.liquid):
 *   <wishlist-grid data-card-section="albora-wishlist-card">
 *     <ul data-wishlist-list></ul>
 *     <div data-wishlist-empty hidden></div>
 *     <div data-wishlist-loading hidden></div>
 *   </wishlist-grid>
 */
(function () {
  'use strict';

  class WishlistGrid extends HTMLElement {
    connectedCallback() {
      this.cardSection = this.dataset.cardSection || 'albora-wishlist-card';
      this.list = this.querySelector('[data-wishlist-list]');
      this.empty = this.querySelector('[data-wishlist-empty]');
      this.loading = this.querySelector('[data-wishlist-loading]');
      this.countEl = this.dataset.countElement ? document.getElementById(this.dataset.countElement) : null;

      this._onChange = this._handleChange.bind(this);
      window.addEventListener('wishlist:change', this._onChange);

      this.render();
    }

    disconnectedCallback() {
      window.removeEventListener('wishlist:change', this._onChange);
    }

    get store() {
      return window.WishlistStore || null;
    }

    _handleChange(event) {
      const { productId, added } = event.detail;

      // Remoção feita a partir do próprio card: tira só ele, sem refazer o fetch.
      if (productId && !added) {
        const item = this.list.querySelector(`[data-product-id="${productId}"]`);
        if (item) {
          item.remove();
          this._syncEmptyState();
          return;
        }
      }

      this.render();
    }

    async render() {
      if (!this.store) return;

      const items = this.store.getItems().filter((item) => item.handle);

      if (items.length === 0) {
        this.list.innerHTML = '';
        this._syncEmptyState();
        return;
      }

      this._toggle(this.loading, true);
      this._toggle(this.empty, false);

      const cards = await Promise.all(items.map((item) => this._fetchCard(item)));

      this.list.innerHTML = '';
      cards.forEach((card) => {
        if (card) this.list.appendChild(card);
      });

      this._toggle(this.loading, false);
      this._syncEmptyState();
    }

    async _fetchCard(item) {
      try {
        const url = `${window.Shopify.routes.root}products/${item.handle}?section_id=${this.cardSection}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = new DOMParser().parseFromString(await response.text(), 'text/html');
        const card = html.querySelector('.res-card');
        if (!card) return null;

        const li = document.createElement('li');
        li.className = 'albora-wishlist__item';
        li.dataset.productId = item.id;
        li.appendChild(card);
        return li;
      } catch (error) {
        // Produto removido/despublicado: some da lista em vez de quebrar a página.
        console.error(`[wishlist] Não foi possível carregar "${item.handle}":`, error);
        return null;
      }
    }

    _syncEmptyState() {
      const isEmpty = this.list.children.length === 0;
      this._toggle(this.empty, isEmpty);
      this._toggle(this.list, !isEmpty);
      this._toggle(this.countEl, !isEmpty);
      this.toggleAttribute('data-empty', isEmpty);
    }

    _toggle(el, visible) {
      if (el) el.toggleAttribute('hidden', !visible);
    }
  }

  if (!customElements.get('wishlist-grid')) {
    customElements.define('wishlist-grid', WishlistGrid);
  }
})();
