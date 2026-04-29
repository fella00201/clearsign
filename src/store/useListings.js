import { create } from 'zustand';
import { SEED } from '../data/seed';
import { fetchListings, insertListing } from '../lib/supabase';

export const useListings = create((set, get) => ({
  listings:   [],
  searchQ:    '',
  filterCat:  'all',
  filterTags: [],

  // ── Load ──────────────────────────────────────────────────────────────────
  loadListings: async () => {
    try {
      const remote = await fetchListings();

      if (!remote.length) {
        // Supabase returned nothing (empty DB or network issue) — show SEED.
        set({ listings: SEED });
        return;
      }

      // Remote rows first; append any SEED demo entries not already present
      // (avoids duplicates when the DB later contains production data).
      const remoteIds = new Set(remote.map(l => l.id));
      const seedFill  = SEED.filter(l => !remoteIds.has(l.id));
      set({ listings: [...remote, ...seedFill] });
    } catch (err) {
      console.warn('[Supabase] fetchListings failed — falling back to localStorage + SEED:', err.message);

      // Fallback: localStorage user-posted listings merged with SEED.
      try {
        const userListings = JSON.parse(localStorage.getItem('cs_listings_user') || '[]');
        const seen         = new Set();
        const merged       = [...userListings, ...SEED].filter(l => {
          if (seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });
        set({ listings: merged });
      } catch {
        set({ listings: SEED });
      }
    }
  },

  // ── Filters ───────────────────────────────────────────────────────────────
  setSearch: (q) => set({ searchQ: q }),

  // Switching category clears tag filters (mirrors original behaviour).
  setFilter: (cat) => set({ filterCat: cat, filterTags: [] }),

  toggleFilterTag: (tag) => {
    const { filterTags } = get();
    set({
      filterTags: filterTags.includes(tag)
        ? filterTags.filter(t => t !== tag)
        : [...filterTags, tag],
    });
  },

  clearTagFilters: () => set({ filterTags: [] }),

  // ── Mutations ─────────────────────────────────────────────────────────────
  updateListing: (id, updates) => {
    const listings = get().listings.map(l => l.id === id ? { ...l, ...updates } : l);
    set({ listings });
    try {
      const existing = JSON.parse(localStorage.getItem('cs_listings_user') || '[]');
      localStorage.setItem(
        'cs_listings_user',
        JSON.stringify(existing.map(l => l.id === id ? { ...l, ...updates } : l))
      );
    } catch {}
  },

  addListing: async (listing) => {
    // 1. Optimistic update — show the card immediately.
    set(state => ({ listings: [listing, ...state.listings] }));

    // 2. Persist to localStorage as a reliable local backup.
    try {
      const existing = JSON.parse(localStorage.getItem('cs_listings_user') || '[]');
      localStorage.setItem('cs_listings_user', JSON.stringify([listing, ...existing]));
    } catch {}

    // 3. Push to Supabase. On success, swap the optimistic entry with the
    //    Supabase-returned row so the card gets its real UUID.
    try {
      const saved = await insertListing(listing);
      set(state => ({
        listings: state.listings.map(l => l.id === listing.id ? saved : l),
      }));
    } catch (err) {
      // Non-fatal — the optimistic localStorage copy is still shown.
      console.warn('[Supabase] insertListing failed, kept local copy:', err.message);
    }
  },
}));
