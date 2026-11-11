-- Test checkouts: records from the HOUZQORA test checkout page.
-- TEST MODE only. No real payment, and no card details are ever
-- asked for or stored here, only name, email and an optional note.
-- Run this once in the Supabase SQL editor (or via the Management API).
create table if not exists public.test_checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_slug text not null references public.properties (slug) on delete cascade,
  amount_cents int not null,
  name text not null,
  email text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.test_checkouts enable row level security;

drop policy if exists "test_checkouts own read" on public.test_checkouts;
create policy "test_checkouts own read" on public.test_checkouts for select using (auth.uid() = user_id);

drop policy if exists "test_checkouts own insert" on public.test_checkouts;
create policy "test_checkouts own insert" on public.test_checkouts for insert with check (auth.uid() = user_id);
