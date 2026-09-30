-- ============================================================================
-- 0014: Indexes for cursor-paged listing browsing and search
-- ============================================================================
-- The app pages through listings with keyset pagination: filter by status
-- (+ district / category), order by (created_at desc, id desc) or by
-- (price, id), and continue "after" the last row seen. These composite
-- indexes let Postgres serve each page straight from the index however many
-- listings exist, instead of sorting the filtered set on every request.

create index if not exists idx_listings_active_newest
  on public.listings (created_at desc, id desc)
  where status = 'active';

create index if not exists idx_listings_active_district_newest
  on public.listings (district, created_at desc, id desc)
  where status = 'active';

create index if not exists idx_listings_active_category_newest
  on public.listings (category_id, created_at desc, id desc)
  where status = 'active';

create index if not exists idx_listings_active_price
  on public.listings (price, id)
  where status = 'active';

-- Text search uses ilike '%term%', which a normal btree index cannot serve.
-- Trigram GIN indexes make those substring searches fast as the table grows.
create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_listings_title_trgm
  on public.listings using gin (title extensions.gin_trgm_ops);

create index if not exists idx_listings_material_name_trgm
  on public.listings using gin (material_name extensions.gin_trgm_ops);
