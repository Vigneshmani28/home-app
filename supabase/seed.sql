-- DEMO DATA FOR DEVELOPMENT ONLY
--
-- Demo `listings` rows are intentionally NOT included here. `listings.seller_id`
-- references `profiles(id)`, which in turn references `auth.users(id)` —
-- there is no safe way to fabricate a real auth.users row (with a working
-- password/identity) from plain SQL without going through Supabase Auth, and
-- inserting a profiles row with a made-up UUID that doesn't exist in
-- auth.users would violate the foreign key.
--
-- To get demo listings locally:
--   1. Run the app, register a real user through the (auth) screens
--      (this creates both the auth.users row and, via the
--      handle_new_user() trigger, the matching profiles row).
--   2. Grab that user's id (select id from auth.users;) and insert
--      listings rows referencing it, e.g.:
--
--   insert into public.listings
--     (seller_id, category_id, title, material_name, quantity, unit, price,
--      condition, district, locality, status)
--   select
--     '00000000-0000-0000-0000-000000000000', -- replace with a real user id
--     c.id,
--     'Leftover UltraTech Cement (10 bags)',
--     'UltraTech Cement',
--     10, 'bag', 350,
--     'unused', 'Coimbatore', 'Peelamedu', 'active'
--   from public.categories c where c.slug = 'cement-and-aggregates';
--
-- Categories are re-seeded below (idempotent) so a fresh local DB always has
-- the reference data needed for the app to function even without demo
-- listings.

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
