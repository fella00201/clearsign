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

      // Self-heal: a contract can end up with both signatures recorded but
      // status stuck on 'pending_counterparty' if the seal step was ever
      // skipped client-side (e.g. the signer's local activeDoc was stale
      // and didn't reflect the other party's already-recorded signature).
      // Backfill status/sealedAt here so it can't stay stuck forever.
      const healed = withSigs.map(c => {
        if (c.creatorSignedAt && c.counterpartySignedAt && c.status !== 'sealed') {
          const sealedAt = c.sealedAt || new Date(Math.max(
            new Date(c.creatorSignedAt).getTime(),
            new Date(c.counterpartySignedAt).getTime()
          )).toISOString();
          return { ...c, status: 'sealed', sealedAt };
        }
        return c;
      });

      persist(healed);
      set({ contracts: healed });

      healed.forEach((c, i) => {
        if (c !== withSigs[i]) {
          updateContract(c.id, { status: 'sealed', sealedAt: c.sealedAt }).catch(() => {});
        }
      });
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

  // ── Revise (propose changed terms) ──────────────────────────────────────
  /**
   * Apply a proposed revision to a contract's terms. Bumps `version`,
   * snapshots the prior terms into `previousOptions` (so the UI can show a
   * before/after diff), and resets both signatures — a signature given for
   * one set of terms must never silently carry over to different terms.
   *
   * @param {string} contractId
   * @param {{options, contractText, templateId?, templateVersion?, byEmail, byName}} revision
   * @returns {Promise<Object|null>}  the revised doc, or null if not found
   */
  reviseContract: async (contractId, revision) => {
    const current = get().contracts.find(c => c.id === contractId)
    if (!current) return null

    const updated = {
      ...current,
      version:              (current.version || 1) + 1,
      previousOptions:      current.options,
      options:              revision.options,
      contractText:         revision.contractText,
      templateId:           revision.templateId      ?? current.templateId,
      templateVersion:      revision.templateVersion ?? current.templateVersion,
      termType:             revision.options?.termType         ?? current.termType,
      startDate:            revision.options?.startDate        ?? current.startDate,
      endDate:              revision.options?.endDate          ?? current.endDate,
      noticePeriodDays:     revision.options?.noticePeriodDays ?? current.noticePeriodDays,
      proposedByEmail:      revision.byEmail,
      proposedByName:       revision.byName,
      revisedAt:            new Date().toISOString(),
      creatorSignedAt:      null,
      counterpartySignedAt: null,
      creatorSigData:       null,
      counterpartySigData:  null,
      status:               'pending_counterparty',
      sealedAt:             null,
    }

    const contracts = get().contracts.map(c => c.id === contractId ? updated : c)
    persist(contracts)
    set({ contracts, activeDoc: updated })

    updateContract(contractId, {
      options: updated.options, previousOptions: updated.previousOptions,
      contractText: updated.contractText, templateId: updated.templateId, templateVersion: updated.templateVersion,
      version: updated.version, proposedByEmail: updated.proposedByEmail, proposedByName: updated.proposedByName,
      revisedAt: updated.revisedAt, startDate: updated.startDate, endDate: updated.endDate,
      noticePeriodDays: updated.noticePeriodDays, status: updated.status,
      creatorSignedAt: null, counterpartySignedAt: null, sealedAt: null,
    }).catch(err => console.warn('[Supabase] reviseContract update failed:', err.message))

    return updated
  },

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
