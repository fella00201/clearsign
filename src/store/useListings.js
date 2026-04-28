import { create } from 'zustand';
import { SEED } from '../data/seed';

export const useListings = create((set, get) => ({
  listings: [],
  searchQ: '',
  filterCat: 'all',
  filterTags: [],

  loadListings: () => {
    try {
      const userListings = JSON.parse(localStorage.getItem('cs_listings_user') || '[]')
      const seen = new Set()
      const merged = [...userListings, ...SEED].filter(l => {
        if (seen.has(l.id)) return false
        seen.add(l.id)
        return true
      })
      set({ listings: merged })
    } catch {
      set({ listings: SEED })
    }
  },

  setSearch: (q) => set({ searchQ: q }),

  // Mirrors the HTML behaviour: switching category clears tag filters
  setFilter: (cat) => set({ filterCat: cat, filterTags: [] }),

  toggleFilterTag: (tag) => {
    const { filterTags } = get();
    set({
      filterTags: filterTags.includes(tag)
        ? filterTags.filter((t) => t !== tag)
        : [...filterTags, tag],
    });
  },

  clearTagFilters: () => set({ filterTags: [] }),

  addListing: (listing) => {
    const next = [listing, ...get().listings];
    set({ listings: next });
    try {
      const existing = JSON.parse(localStorage.getItem('cs_listings_user') || '[]');
      localStorage.setItem('cs_listings_user', JSON.stringify([listing, ...existing]));
    } catch {}
  },
}));
