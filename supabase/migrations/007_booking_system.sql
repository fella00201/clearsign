-- ClearSign — Rental booking system: term structure, per-listing margin,
-- owner-blocked dates, and a database-level guarantee that two active
-- contracts for the same listing can never have overlapping (or
-- margin-violating) date ranges.
-- Migration: 007_booking_system.sql

-- ── LISTINGS ─────────────────────────────────────────────────────────────
alter table public.listings add column if not exists booking_margin_days integer not null default 0;
alter table public.listings add column if not exists blocked_dates jsonb not null default '[]'::jsonb;
-- blocked_dates shape: [{ "start": "2026-09-01", "end": "2026-09-05", "reason": "maintenance" }, ...]

-- ── CONTRACTS — term structure & options ────────────────────────────────
alter table public.contracts add column if not exists term_type text;              -- 'fixed' | 'open_ended'
alter table public.contracts add column if not exists start_date date;
alter table public.contracts add column if not exists end_date date;               -- null for open_ended
alter table public.contracts add column if not exists notice_period_days integer;  -- null for fixed
alter table public.contracts add column if not exists ended_at date;               -- reserved for a future
  -- "give notice to end an open-ended contract" flow — not built yet, so this
  -- is always null today. Included now so the EXCLUDE constraint below
  -- already accounts for it once that flow exists, without another migration.
alter table public.contracts add column if not exists options jsonb not null default '{}'::jsonb;
-- options shape: { petsAllowed, smokingAllowed, sublettingAllowed: bool|null,
--                  autoRenew: bool|null, lateFee: {graceDays, amount}|null,
--                  earlyTerminationFee: number|null }

-- ── Date-collision guarantee ─────────────────────────────────────────────
-- Only contracts with a start_date participate (non-rental deal types never
-- set one, so blocked_range stays null and they're invisible to this check).

create extension if not exists btree_gist;

alter table public.contracts add column if not exists blocked_range daterange;

create or replace function public.contracts_compute_blocked_range()
returns trigger language plpgsql as $$
declare
  margin integer := 0;
begin
  if new.start_date is null then
    new.blocked_range := null;
    return new;
  end if;

  if new.listing_id is not null then
    select booking_margin_days into margin from public.listings where id = new.listing_id;
    margin := coalesce(margin, 0);
  end if;

  new.blocked_range := daterange(
    new.start_date - margin,
    case when new.end_date is null then 'infinity'::date else new.end_date + margin end,
    '[]'
  );
  return new;
end;
$$;

drop trigger if exists contracts_before_write_blocked_range on public.contracts;

create trigger contracts_before_write_blocked_range
  before insert or update on public.contracts
  for each row execute function public.contracts_compute_blocked_range();

alter table public.contracts drop constraint if exists contracts_no_date_overlap;

alter table public.contracts
  add constraint contracts_no_date_overlap
  exclude using gist (
    listing_id with =,
    blocked_range with &&
  ) where (status in ('pending_counterparty', 'sealed') and ended_at is null and blocked_range is not null);
