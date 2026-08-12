-- Lets a rental listing's owner set default contract terms (pets/smoking/
-- subletting policy, late fee, auto-renew, early termination fee, preferred
-- term type) once, at listing-creation time. Configure Contract pre-fills
-- from these but the contract itself stays fully editable per-agreement —
-- this is just a starting point, not a constraint (no DB-level enforcement
-- needed, unlike booking_margin_days which already backs the collision
-- guardrail from 007/008).

alter table public.listings
  add column if not exists default_options jsonb not null default '{}'::jsonb;
