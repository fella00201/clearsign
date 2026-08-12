-- Lets either party on a contract propose changes to its terms before
-- signing. A revision bumps `version`, snapshots the prior terms into
-- `previous_options` (for a before/after diff in the UI), records who
-- proposed the current version, and — since the terms changed — resets
-- both signatures so a stale signature can never apply to different terms
-- than the ones it was given for.

alter table public.contracts
  add column if not exists version integer not null default 1,
  add column if not exists previous_options jsonb,
  add column if not exists proposed_by_email text,
  add column if not exists proposed_by_name text,
  add column if not exists revised_at timestamptz;

-- Backfill proposed_by_email for existing rows so "whose turn is it"
-- display logic has something sane to work with immediately. Sealed
-- contracts are skipped — the 006 integrity trigger permanently freezes
-- any row once sealed (by design, so a binding contract can never be
-- touched again), and proposed_by_email is only used for "who should
-- review this" UI, which is moot once a contract is already sealed.
update public.contracts
  set proposed_by_email = creator_email,
      proposed_by_name  = creator_name
  where proposed_by_email is null
    and status <> 'sealed';
