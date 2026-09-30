-- ============================================================================
-- 0003: listings
-- ============================================================================

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),

  title text not null,
  description text,
  material_name text,
  brand text,

  quantity numeric not null check (quantity > 0),
  unit text not null,

  price numeric not null check (price >= 0),
  original_price numeric,

  condition text not null check (condition in ('unused', 'like_new', 'good', 'used')),

  manufacture_date date,
  expiry_date date,

  district text not null,
  locality text not null,
  pincode text,
  location geography(Point, 4326),

  pickup_available boolean not null default true,
  delivery_available boolean not null default false,

  status text not null default 'active'
    check (status in ('draft', 'active', 'reserved', 'sold', 'expired', 'inactive')),
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.listings is
  'Construction material listings posted by sellers.';
comment on column public.listings.location is
  'Approximate pickup point as a geography(Point, 4326) — lng/lat order, used by the nearby_listings() RPC.';

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
  before update on public.listings
  for each row
  execute function public.set_updated_at();

-- Indexes ---------------------------------------------------------------
create index if not exists idx_listings_category_id on public.listings (category_id);
create index if not exists idx_listings_seller_id on public.listings (seller_id);
create index if not exists idx_listings_status on public.listings (status);
create index if not exists idx_listings_created_at on public.listings (created_at desc);
create index if not exists idx_listings_district on public.listings (district);
create index if not exists idx_listings_price on public.listings (price);
create index if not exists idx_listings_location on public.listings using gist (location);

-- Row Level Security -------------------------------------------------------
alter table public.listings enable row level security;

-- SELECT: anyone can read active listings; the owner can additionally see
-- their own listings in any status (draft/reserved/sold/expired/inactive).
create policy "listings_select_active_or_own"
  on public.listings
  for select
  to anon, authenticated
  using (
    status = 'active'
    or (auth.uid() is not null and seller_id = auth.uid())
  );

-- INSERT: authenticated users only, and only as themselves.
create policy "listings_insert_own"
  on public.listings
  for insert
  to authenticated
  with check (seller_id = auth.uid());

-- UPDATE: owner only, and cannot reassign the listing to someone else.
create policy "listings_update_own"
  on public.listings
  for update
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- DELETE: owner only.
create policy "listings_delete_own"
  on public.listings
  for delete
  to authenticated
  using (seller_id = auth.uid());
