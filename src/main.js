import './main.css';
import Alpine from 'alpinejs';

// ── Dark mode ──────────────────────────────────────────────────────────────────
// Reads/writes localStorage key "theme" ('dark' | 'light').
// Flash prevention script (in _includes/head.html) handles initial load.

Alpine.data('darkMode', () => ({
  dark: document.documentElement.dataset.theme === 'dark',
  toggle() {
    this.dark = !this.dark;
    document.documentElement.dataset.theme = this.dark ? 'dark' : 'light';
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
  },
  init() {
    const s = localStorage.getItem('theme');
    if (s !== null) {
      this.dark = s === 'dark';
    } else {
      this.dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.dataset.theme = this.dark ? 'dark' : 'light';
  },
}));

// ── Mobile nav ─────────────────────────────────────────────────────────────────

Alpine.data('mobileNav', () => ({
  open: false,
  toggle() { this.open = !this.open; },
  close() { this.open = false; },
}));

// ── Search ─────────────────────────────────────────────────────────────────────
// Pagefind is built into _site/ at CI time (npx pagefind --site _site).
// The JS is imported dynamically on first open so pages load without it.

Alpine.data('search', () => ({
  isOpen: false,
  query: '',
  results: [],
  loading: false,
  _pagefind: null,

  init() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.isOpen ? this.close() : this.open();
      }
    });
  },

  async open() {
    this.isOpen = true;
    this.$nextTick(() => this.$refs.input?.focus());
    if (!this._pagefind) {
      try {
        this._pagefind = await import('/pagefind/pagefind.js');
        await this._pagefind.init();
      } catch {
        // Pagefind not available in local dev (run `npx pagefind --site _site` first)
      }
    }
  },

  close() {
    this.isOpen = false;
    this.query = '';
    this.results = [];
  },

  async runSearch() {
    if (!this._pagefind || !this.query.trim()) {
      this.results = [];
      return;
    }
    this.loading = true;
    try {
      const search = await this._pagefind.search(this.query);
      this.results = await Promise.all(
        search.results.slice(0, 8).map(r => r.data())
      );
    } catch {
      this.results = [];
    } finally {
      this.loading = false;
    }
  },
}));

// ── Photo gallery lightbox ──────────────────────────────────────────────────
// Used by _includes/gallery.html. Images are passed via x-init from Liquid JSON.

Alpine.data('gallery', () => ({
  active: false,
  idx: 0,
  images: [],

  init() {
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.key === 'Escape')     { this.hide(); return; }
      if (e.key === 'ArrowLeft')  { this.prev();  return; }
      if (e.key === 'ArrowRight') { this.next();  return; }
    });
  },

  show(idx) {
    this.idx = idx;
    this.active = true;
    this.$nextTick(() => this.$refs.close?.focus());
  },

  hide() {
    this.active = false;
  },

  prev() { if (this.idx > 0) this.idx--; },
  next() { if (this.idx < this.images.length - 1) this.idx++; },
}));

// ── Photo carousel ─────────────────────────────────────────────────────────────
// Used by _includes/carousel.html. Images passed via x-init from Liquid JSON.

Alpine.data('carousel', () => ({
  idx: 0,
  images: [],

  prev() { if (this.idx > 0) this.idx--; },
  next() { if (this.idx < this.images.length - 1) this.idx++; },
  goTo(i) { this.idx = i; },
}));

Alpine.start();
