-- ClearSign — Fix booking margin double-counting.
-- Migration: 008_booking_margin_fix.sql
--
-- 007_booking_system.sql expanded every contract's blocked_range by margin
-- on BOTH ends (start - margin, end + margin). Because the EXCLUDE
-- constraint compares two independently-expanded ranges, two bookings
-- separated by exactly `margin` days would each push `margin` days into
-- the same gap from opposite sides and register as overlapping — the
-- effective required separation was 2×margin, not margin.
--
-- Fix: only expand forward (end + margin), never backward from start. For
-- any two bookings A (earlier) and B (later) on the same listing, this
-- correctly requires B.start_date to be at least `margin` days after
-- A.end_date, without doubling — CREATE OR REPLACE updates the trigger
-- function's behavior in place; the trigger and EXCLUDE constraint
-- themselves are unchanged.

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
    new.start_date,
    case when new.end_date is null then 'infinity'::date else new.end_date + margin end,
    '[]'
  );
  return new;
end;
$$;

-- Existing rows were computed with the old (buggy) function at insert/update
-- time and won't recompute on their own — force a re-evaluation so the
-- stored blocked_range values reflect the corrected formula immediately.
update public.contracts set blocked_range = blocked_range where start_date is not null;
