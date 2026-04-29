-- ClearSign — Thread & Message transition RLS policies
-- Migration: 004_thread_message_transition.sql
--
-- The threads and messages tables use auth.uid()-based RLS which requires a
-- Supabase JWT.  During the localStorage-auth transition period we add email
-- columns (matching the contracts table pattern) and relax RLS so the anon
-- frontend key can read/write.  Tighten once Supabase Auth is implemented.

-- ── THREADS ──────────────────────────────────────────────────────────────────

-- Email columns let us query without a Supabase JWT (mirrors creator_email
-- / counterparty_email pattern on the contracts table).
alter table public.threads add column if not exists p1_email text;
alter table public.threads add column if not exists p2_email text;

-- Drop auth.uid()-based policies.
drop policy if exists "Thread participants can read"           on public.threads;
drop policy if exists "Authenticated users can create threads" on public.threads;
drop policy if exists "Participants can update thread"         on public.threads;

create policy "Threads are publicly readable"
  on public.threads for select using (true);

create policy "Anyone can create thread"
  on public.threads for insert with check (true);

create policy "Anyone can update thread"
  on public.threads for update using (true);

-- ── MESSAGES ─────────────────────────────────────────────────────────────────

-- from_email lets the app identify the sender without a JWT.
alter table public.messages add column if not exists from_email text;

-- Drop auth.uid()-based policies.
drop policy if exists "Thread participants can read messages" on public.messages;
drop policy if exists "Sender can insert message"            on public.messages;
drop policy if exists "Recipient can mark message read"      on public.messages;

create policy "Messages are publicly readable"
  on public.messages for select using (true);

create policy "Anyone can insert message"
  on public.messages for insert with check (true);

create policy "Anyone can update message"
  on public.messages for update using (true);
