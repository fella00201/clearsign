-- ClearSign — Transition RLS policies
-- Migration: 002_transition_policies.sql
--
-- The app currently uses localStorage-based auth (no Supabase Auth / JWT).
-- These policies relax RLS so the frontend anon key can read/write during
-- the migration period.  Replace with uid()-based policies once Supabase
-- Auth is fully wired up.

-- ── USERS ──────────────────────────────────────────────────────────────────

-- Drop the auth.uid()-based policies that require a real Supabase session.
drop policy if exists "Users can read own profile"   on public.users;
drop policy if exists "Users can update own profile" on public.users;

-- Everyone can read user profiles (needed for listing JOINs + alert fan-out).
create policy "User profiles are publicly readable"
  on public.users for select
  using (true);

-- The frontend creates the profile row on signup (no Supabase Auth yet).
create policy "Anyone can create user profile"
  on public.users for insert
  with check (true);

-- updateAlerts() writes back to Supabase keyed by email in application code.
create policy "Anyone can update user profile"
  on public.users for update
  using (true);

-- ── LISTINGS ───────────────────────────────────────────────────────────────

-- Drop the auth.uid() = owner_id policies (won't fire without a JWT).
drop policy if exists "Owners can insert their own listings" on public.listings;
drop policy if exists "Owners can update their own listings" on public.listings;

-- Any authenticated or anon request can insert/update listings for now.
create policy "Anyone can insert listing"
  on public.listings for insert
  with check (true);

create policy "Anyone can update listing"
  on public.listings for update
  using (true);
