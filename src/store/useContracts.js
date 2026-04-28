import { create } from 'zustand';

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

  loadContracts: () => set({ contracts: load() }),

  // Upsert — replaces if same id already exists, otherwise prepends
  saveContract: (doc) => {
    const contracts = [doc, ...get().contracts.filter((c) => c.id !== doc.id)];
    persist(contracts);
    set({ contracts, activeDoc: doc });
  },

  setActiveDoc: (doc) => set({ activeDoc: doc }),

  signContract: (contractId, role, sigData) => {
    const now = new Date().toISOString();
    const contracts = get().contracts.map((c) => {
      if (c.id !== contractId) return c;
      return role === 'creator'
        ? { ...c, creator_signed_at: now,      creator_sig_data: sigData }
        : { ...c, counterparty_signed_at: now, counterparty_sig_data: sigData };
    });
    persist(contracts);
    set({ contracts, activeDoc: contracts.find((c) => c.id === contractId) ?? get().activeDoc });
  },

  sealContract: (contractId) => {
    const now = new Date().toISOString();
    const contracts = get().contracts.map((c) =>
      c.id === contractId ? { ...c, status: 'sealed', sealed_at: now } : c
    );
    persist(contracts);
    set({ contracts, activeDoc: contracts.find((c) => c.id === contractId) ?? get().activeDoc });
  },
}));
