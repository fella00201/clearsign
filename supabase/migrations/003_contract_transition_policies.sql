-- ClearSign — Contract transition RLS policies
-- Migration: 003_contract_transition_policies.sql
--
-- The contracts table policies use auth.uid() = creator_id / counterparty_id
-- which requires a Supabase JWT.  During the localStorage-auth transition
-- period we replace them with email-based open policies so the anon frontend
-- key can read/write contracts.  Tighten once Supabase Auth is implemented.

drop policy if exists "Contracts readable by participants" on public.contracts;
drop policy if exists "Creator can insert contract"        on public.contracts;
drop policy if exists "Participants can update contract"   on public.contracts;

-- Any signed-in or anon request can read contracts (app code filters by email).
create policy "Contracts are publicly readable"
  on public.contracts for select
  using (true);

-- Any request can create a contract during the transition.
create policy "Anyone can insert contract"
  on public.contracts for insert
  with check (true);

-- Any request can update a contract (sign / seal) during the transition.
create policy "Anyone can update contract"
  on public.contracts for update
  using (true);
