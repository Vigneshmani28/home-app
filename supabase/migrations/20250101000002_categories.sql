-- ============================================================================
-- 0002: categories (admin-managed reference data)
-- ============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.categories is
  'Admin-managed list of material categories. No client-side mutation policies — managed via service role / dashboard.';

alter table public.categories enable row level security;

-- Anyone (anon or authenticated) can browse active categories. There is
-- intentionally no INSERT/UPDATE/DELETE policy: categories are curated by
-- an administrator using the service role, which bypasses RLS entirely.
create policy "categories_select_active"
  on public.categories
  for select
  to anon, authenticated
  using (is_active = true);

-- Seed data ------------------------------------------------------------------
insert into public.categories (name, slug, sort_order) values
  ('Bricks and Blocks', 'bricks-and-blocks', 10),
  ('Cement and Aggregates', 'cement-and-aggregates', 20),
  ('Steel and Metal', 'steel-and-metal', 30),
  ('Tiles and Flooring', 'tiles-and-flooring', 40),
  ('Plumbing', 'plumbing', 50),
  ('Electrical', 'electrical', 60),
  ('Doors and Windows', 'doors-and-windows', 70),
  ('Paint and Finishing', 'paint-and-finishing', 80),
  ('Roofing', 'roofing', 90),
  ('Tools and Equipment', 'tools-and-equipment', 100),
  ('Other Materials', 'other-materials', 110)
on conflict (slug) do nothing;
