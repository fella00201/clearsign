-- ClearSign — Initial Schema
-- Migration: 20260501000000_initial_schema.sql

-- ── EXTENSIONS ──────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ── USERS ───────────────────────────────────────────────
create table public.users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text unique not null,
  avatar_color  text default '#5b8fff',
  alerts        jsonb default '[]'::jsonb,
  created_at    timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ── LISTINGS ────────────────────────────────────────────
create table public.listings (
  id            uuid primary key default uuid_generate_v4(),
  cat           text not null,
  subcat        text not null,
  title         text not null,
  location      text not null,
  description   text,
  tags          text[] default '{}',
  price_per_month text,
  price_per_day text,
  hourly_rate   text,
  asking_price  text,
  loan_amount   text,
  total_fee     text,
  max_budget    text,
  max_rate      text,
  available_from text,
  move_in       text,
  availability  text,
  frequency     text,
  repay_by      text,
  subject       text,
  owner_id      uuid references public.users(id) on delete cascade,
  review_count  integer default 0,
  avg_rating    numeric(3,2) default 0,
  status        text default 'active',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index listings_location_idx on public.listings using gin(to_tsvector('english', location));
create index listings_title_idx on public.listings using gin(to_tsvector('english', title));
create index listings_tags_idx on public.listings using gin(tags);
create index listings_cat_idx on public.listings(cat);

alter table public.listings enable row level security;

create policy "Listings are publicly readable"
  on public.listings for select
  using (status = 'active');

create policy "Owners can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own listings"
  on public.listings for update
  using (auth.uid() = owner_id);

-- ── CONTRACTS ───────────────────────────────────────────
create table public.contracts (
  id                   uuid primary key default uuid_generate_v4(),
  listing_id           uuid references public.listings(id) on delete set null,
  listing_title        text,
  contract_text        text not null,
  creator_id           uuid references public.users(id) on delete cascade,
  creator_name         text not null,
  creator_email        text not null,
  creator_color        text,
  creator_signed_at    timestamptz,
  counterparty_id      uuid references public.users(id) on delete cascade,
  counterparty_name    text not null,
  counterparty_email   text not null,
  counterparty_color   text,
  counterparty_signed_at timestamptz,
  status               text default 'pending_counterparty',
  timeline             jsonb default '[]'::jsonb,
  sealed_at            timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.contracts enable row level security;

create policy "Contracts readable by participants"
  on public.contracts for select
  using (auth.uid() = creator_id or auth.uid() = counterparty_id);

create policy "Creator can insert contract"
  on public.contracts for insert
  with check (auth.uid() = creator_id);

create policy "Participants can update contract"
  on public.contracts for update
  using (auth.uid() = creator_id or auth.uid() = counterparty_id);

-- ── THREADS (message conversations) ─────────────────────
create table public.threads (
  id            uuid primary key default uuid_generate_v4(),
  listing_id    uuid references public.listings(id) on delete set null,
  listing_title text,
  p1_id         uuid references public.users(id) on delete cascade,
  p1_name       text not null,
  p1_color      text,
  p2_id         uuid references public.users(id) on delete cascade,
  p2_name       text not null,
  p2_color      text,
  last_at       timestamptz default now(),
  created_at    timestamptz default now()
);

alter table public.threads enable row level security;

create policy "Thread participants can read"
  on public.threads for select
  using (auth.uid() = p1_id or auth.uid() = p2_id);

create policy "Authenticated users can create threads"
  on public.threads for insert
  with check (auth.uid() = p1_id);

create policy "Participants can update thread"
  on public.threads for update
  using (auth.uid() = p1_id or auth.uid() = p2_id);

-- ── MESSAGES ────────────────────────────────────────────
create table public.messages (
  id            uuid primary key default uuid_generate_v4(),
  thread_id     uuid references public.threads(id) on delete cascade,
  from_id       uuid references public.users(id) on delete cascade,
  from_name     text not null,
  text          text not null,
  read          boolean default false,
  created_at    timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Thread participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id
      and (t.p1_id = auth.uid() or t.p2_id = auth.uid())
    )
  );

create policy "Sender can insert message"
  on public.messages for insert
  with check (auth.uid() = from_id);

create policy "Recipient can mark message read"
  on public.messages for update
  using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id
      and (t.p1_id = auth.uid() or t.p2_id = auth.uid())
    )
  );

-- ── NOTIFICATIONS ────────────────────────────────────────
create table public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.users(id) on delete cascade,
  type          text not null, -- alert_match | message | contract_request | sealed
  title         text not null,
  body          text,
  read          boolean default false,
  listing_id    uuid references public.listings(id) on delete set null,
  contract_id   uuid references public.contracts(id) on delete set null,
  thread_id     uuid references public.threads(id) on delete set null,
  created_at    timestamptz default now()
);

create index notifications_user_idx on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true); -- controlled by Edge Functions with service role

create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ── REVIEWS ─────────────────────────────────────────────
create table public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  listing_id    uuid references public.listings(id) on delete cascade,
  contract_id   uuid references public.contracts(id) on delete set null,
  reviewer_id   uuid references public.users(id) on delete cascade,
  reviewer_name text not null,
  reviewer_color text,
  rating        integer check (rating between 1 and 5),
  text          text not null,
  created_at    timestamptz default now(),
  unique (contract_id, reviewer_id) -- one review per person per contract
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "Reviewer can insert their own review"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.handle_updated_at();

create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function public.handle_updated_at();

-- ── REVIEW STATS TRIGGER ────────────────────────────────
create or replace function public.update_listing_review_stats()
returns trigger language plpgsql as $$
begin
  update public.listings
  set
    review_count = (select count(*) from public.reviews where listing_id = new.listing_id),
    avg_rating   = (select avg(rating) from public.reviews where listing_id = new.listing_id)
  where id = new.listing_id;
  return new;
end;
$$;

create trigger reviews_update_listing_stats
  after insert on public.reviews
  for each row execute function public.update_listing_review_stats();
