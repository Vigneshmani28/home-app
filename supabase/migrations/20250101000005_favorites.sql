-- ============================================================================
-- 0005: favorites
-- ============================================================================

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

comment on table public.favorites is
  'Buyer-saved listings ("bookmarks").';

create index if not exists idx_favorites_user_id on public.favorites (user_id);

alter table public.favorites enable row level security;

-- Full CRUD, but only ever on the caller's own rows.
create policy "favorites_select_own"
  on public.favorites
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "favorites_update_own"
  on public.favorites
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites
  for delete
  to authenticated
  using (user_id = auth.uid());
