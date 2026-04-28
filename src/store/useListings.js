import { create } from 'zustand';
import { SEED } from '../data/seed';

export const useListings = create((set, get) => ({
  listings: [],
  searchQ: '',
  filterCat: 'all',
  filterTags: [],

  loadListings: () => set({ listings: SEED }),

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
}));
