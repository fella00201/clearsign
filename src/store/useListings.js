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

  // Computed getter — call as useListings(s => s.filteredListings())
  filteredListings: () => {
    const { listings, searchQ, filterCat, filterTags } = get();
    const q = searchQ.toLowerCase();

    return listings.filter((l) => {
      if (filterCat !== 'all' && l.cat !== filterCat) return false;
      if (filterTags.length > 0) {
        const lt = l.tags ?? [];
        if (!filterTags.every((t) => lt.includes(t))) return false;
      }
      if (q) {
        const hay = [l.title, l.location, l.description ?? '', ...(l.tags ?? [])]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  },
}));
