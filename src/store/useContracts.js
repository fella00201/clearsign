import { create } from 'zustand';
import { fetchContracts, insertContract, updateContract } from '../lib/supabase';

const STORAGE_KEY = 'cs_contracts';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(contracts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  } catch { /* quota exceeded */ }
}

export const useContracts = create((set, get) => ({
  contracts: [],
  activeDoc: null,

  // ── Load ──────────────────────────────────────────────────────────────────
  loadContracts: async (userEmail) => {
    // Always hydrate from localStorage first for instant render.
    const local = load();
    set({ contracts: local });

    if (!userEmail) return;

    try {
      const remote = await fetchContracts(userEmail);

      if (remote.length === 0) return;

      // Merge: remote rows take precedence; keep any local-only entries
      // (e.g. optimistic inserts that haven't been confirmed yet).
      const remoteIds  = new Set(remote.map(c => c.id));
      const localOnly  = local.filter(c => !remoteIds.has(c.id));
      const merged     = [...remote, ...localOnly];

      // Preserve sig image data from localStorage (not stored in Supabase).
      const localMap   = Object.fromEntries(local.map(c => [c.id, c]));
      const withSigs   = merged.map(c => {
        const lc = localMap[c.id];
        if (!lc) return c;
        return {
          ...c,
          creatorSigData:      lc.creatorSigData      ?? null,
          counterpartySigData: lc.counterpartySigData ?? null,
        };
      });

      persist(withSigs);
      set({ contracts: withSigs });
    } catch (err) {
      console.warn('[Supabase] fetchContracts failed — using localStorage:', err.message);
    }
  },

  // ── Save (insert or upsert) ────────────────────────────────────────────────
  /**
   * Upsert a contract locally and push to Supabase.
   * Returns the saved doc — callers MUST await this to get the canonical UUID.
   *
   * @param {Object} doc  app-shaped contract doc
   * @returns {Promise<Object>}  saved doc (Supabase UUID after remote insert)
   */
  saveContract: async (doc) => {
    // 1. Optimistic local update.
    const contracts = [doc, ...get().contracts.filter(c => c.id !== doc.id)];
    persist(contracts);
    set({ contracts, activeDoc: doc });

    // 2. Push to Supabase and swap the optimistic entry with the real UUID.
    try {
      const saved = await insertContract(doc);

      // Swap: replace the optimistic doc (old id) with the Supabase doc (UUID).
      const swapped = get().contracts.map(c => c.id === doc.id ? saved : c);
      persist(swapped);
      set({ contracts: swapped, activeDoc: saved });

      return saved;
    } catch (err) {
      console.warn('[Supabase] insertContract failed, kept local copy:', err.message);
      return doc; // return the local doc so callers still get something valid
    }
  },

  setActiveDoc: (doc) => set({ activeDoc: doc }),

  // ── Sign ──────────────────────────────────────────────────────────────────
  signContract: (contractId, role, sigData) => {
    const now = new Date().toISOString();
    const contracts = get().contracts.map(c => {
      if (c.id !== contractId) return c;
      return role === 'creator'
        ? { ...c, creatorSignedAt: now,      creatorSigData: sigData }
        : { ...c, counterpartySignedAt: now, counterpartySigData: sigData };
    });
    persist(contracts);
    set({ contracts, activeDoc: contracts.find(c => c.id === contractId) ?? get().activeDoc });

    // Mirror to Supabase (fire-and-forget — sig image not stored remotely).
    const updates = role === 'creator'
      ? { creatorSignedAt: now }
      : { counterpartySignedAt: now };

    updateContract(contractId, updates).catch(err =>
      console.warn('[Supabase] signContract update failed:', err.message)
    );
  },

  // ── Seal ──────────────────────────────────────────────────────────────────
  sealContract: (contractId) => {
    const now = new Date().toISOString();
    const contracts = get().contracts.map(c =>
      c.id === contractId ? { ...c, status: 'sealed', sealedAt: now } : c
    );
    persist(contracts);
    set({ contracts, activeDoc: contracts.find(c => c.id === contractId) ?? get().activeDoc });

    // Mirror to Supabase (fire-and-forget).
    updateContract(contractId, { status: 'sealed', sealedAt: now }).catch(err =>
      console.warn('[Supabase] sealContract update failed:', err.message)
    );
  },
}));
