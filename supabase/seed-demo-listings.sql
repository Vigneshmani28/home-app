-- DEMO LISTINGS FOR DEVELOPMENT / TESTING ONLY — do not add this to supabase/migrations.
--
-- Creates ~60 varied listings owned by an existing user, so lists, filters, pagination, the My Listings
-- tabs and the detail screen have realistic data coming from the real backend.
--
-- Usage:
--   1. Register a user in the app (or use an existing one) and put their email in v_email below.
--   2. Run this file (SQL Editor, or: psql "$DB_URL" -f supabase/seed-demo-listings.sql).
--   3. Re-running is safe: it first removes the previous demo rows.
-- Cleanup only:   delete from public.listings where contact_phone = '9000000000';
--   (demo rows are the ones with that contact number; photos and views cascade with them)
--
-- Photos: off by default (listings show the "no photo" placeholder). To add some, upload a few images to
-- the `listing-images` bucket (e.g. demo/1.jpg … demo/4.jpg), list their paths in v_photo_paths and set
-- v_with_photos := true.

do $$
declare
  v_email text := 'vigneshwaranm.me@gmail.com';          -- <- CHANGE: the owner of the demo listings
  v_with_photos boolean := true;
  v_photo_paths text[] := array['demo/1.jpg','demo/2.jpg','demo/3.jpg','demo/4.jpg'];  -- match your file names

  v_total int := 60;
  v_seller uuid;
  v_listing_id uuid;
  v_i int;
  v_n int;
  v_slug text;
  v_cat uuid;
  v_item jsonb;
  v_place jsonb;
  v_locality text;
  v_qty numeric;
  v_price numeric;
  v_status text;
  v_conditions text[] := array['unused', 'like_new', 'good', 'used'];
  v_slugs text[] := array['bricks-and-blocks', 'cement-and-aggregates', 'steel-and-metal', 'tiles-and-flooring',
                          'plumbing', 'electrical', 'doors-and-windows', 'paint-and-finishing', 'roofing'];

  -- material, unit, min price, max price, brand (empty = none)
  v_catalog jsonb := '{
    "bricks-and-blocks":     [["Red Clay Bricks","piece",7,11,""],["AAC Blocks","piece",45,65,"Siporex"],["Fly Ash Bricks","piece",5,8,""]],
    "cement-and-aggregates": [["Portland Cement","bag",320,430,"UltraTech"],["River Sand","ton",1400,2200,""],["Blue Metal 20mm","ton",900,1400,""]],
    "steel-and-metal":       [["TMT Steel Bars 12mm","kg",55,72,"TATA Tiscon"],["MS Angle 40x40","piece",420,780,""],["Binding Wire","kg",70,95,""]],
    "tiles-and-flooring":    [["Vitrified Floor Tiles 2x2","box",650,1500,"Kajaria"],["Bathroom Wall Tiles","box",380,820,"Somany"],["Granite Slab","sq ft",90,220,""]],
    "plumbing":              [["CPVC Pipes 1 inch","piece",180,320,"Astral"],["PVC Water Tank 1000L","piece",4500,7800,"Sintex"],["Bathroom Fittings Set","set",1800,5200,"Jaquar"]],
    "electrical":            [["Copper Wire 2.5mm","coil",1900,3100,"Havells"],["Modular Switch Board","set",900,2400,"Anchor"],["LED Panel Lights","piece",350,780,"Philips"]],
    "doors-and-windows":     [["Teak Wood Door","piece",9000,22000,""],["Aluminium Sliding Window","piece",3500,8500,""],["UPVC Window","piece",4200,9000,"Fenesta"]],
    "paint-and-finishing":   [["Exterior Emulsion 20L","bucket",3800,6400,"Asian Paints"],["Wall Putty","bag",650,1100,"Birla White"],["Wood Polish","litre",320,640,"Asian Paints"]],
    "roofing":               [["Asbestos-free Roofing Sheets","sheet",520,980,""],["Clay Roof Tiles","piece",14,26,""],["GI Roofing Sheets","sheet",780,1300,"TATA"]]
  }';

  -- district, localities, pincode
  v_places jsonb := '[
    {"d":"Chennai","l":["Anna Nagar","Velachery","T Nagar","Tambaram"],"p":"600040"},
    {"d":"Coimbatore","l":["Peelamedu","Gandhipuram","RS Puram","Singanallur"],"p":"641004"},
    {"d":"Madurai","l":["Anna Nagar","KK Nagar","Thirunagar"],"p":"625020"},
    {"d":"Tiruchirappalli","l":["Thillai Nagar","Srirangam","KK Nagar"],"p":"620017"},
    {"d":"Salem","l":["Fairlands","Hasthampatti","Ammapet"],"p":"636016"},
    {"d":"Tirunelveli","l":["Palayamkottai","Melapalayam"],"p":"627002"},
    {"d":"Erode","l":["Perundurai Road","Surampatti"],"p":"638001"},
    {"d":"Thanjavur","l":["Medical College Road","Vallam"],"p":"613005"}
  ]';
begin
  select id into v_seller from auth.users where email = v_email;
  if v_seller is null then
    raise exception 'No user with email %. Register one in the app first, then set v_email at the top of this script.', v_email;
  end if;

  delete from public.listings where seller_id = v_seller and contact_phone = '9000000000';

  for v_i in 1..v_total loop
    v_slug := v_slugs[1 + (v_i % array_length(v_slugs, 1))];
    select id into v_cat from public.categories where slug = v_slug;
    if v_cat is null then continue; end if;

    v_n := jsonb_array_length(v_catalog -> v_slug);
    v_item := (v_catalog -> v_slug) -> floor(random() * v_n)::int;
    v_place := v_places -> floor(random() * jsonb_array_length(v_places))::int;
    v_locality := v_place -> 'l' ->> floor(random() * jsonb_array_length(v_place -> 'l'))::int;

    v_qty := 1 + floor(random() * 60);
    v_price := round(((v_item ->> 2)::numeric + random() * ((v_item ->> 3)::numeric - (v_item ->> 2)::numeric)) * v_qty / 5) * 5;

    v_status := case
      when v_i <= 44 then 'active'
      when v_i <= 50 then 'sold'
      when v_i <= 54 then 'reserved'
      when v_i <= 57 then 'inactive'
      else 'expired'
    end;

    insert into public.listings (
      seller_id, category_id, title, description, material_name, brand,
      quantity, unit, price, original_price, condition,
      manufacture_date, expiry_date,
      district, locality, pincode, contact_phone,
      pickup_available, delivery_available, status, created_at
    ) values (
      v_seller, v_cat,
      case
        when v_i % 11 = 0 then 'Surplus ' || (v_item ->> 0) || ' left over from a completed residential project in ' || (v_place ->> 'd') || ' — excellent quality, stored indoors, ready for immediate pickup'
        when v_i % 3 = 0 then (v_item ->> 0) || ' – ' || v_qty || ' ' || (v_item ->> 1)
        else 'Leftover ' || (v_item ->> 0) || ' (' || v_qty || ' ' || (v_item ->> 1) || ')'
      end,
      case
        when v_i % 4 = 0 then null
        when v_i % 9 = 0 then 'Bought extra for a site that finished early. Stored under cover and never opened. Genuine bill available on request. Happy to show the material before you decide — please call between 9 AM and 6 PM. Price is slightly negotiable for the full quantity, and bulk pickup can be arranged with a tempo or lorry.'
        else 'Excess material from a finished project, in good condition. Contact me for pickup.'
      end,
      v_item ->> 0,
      nullif(v_item ->> 4, ''),
      v_qty, v_item ->> 1, v_price,
      case when v_i % 5 = 0 then round(v_price * 1.25 / 5) * 5 end,
      v_conditions[1 + floor(random() * 4)::int],
      case when v_i % 6 = 0 then current_date - (30 + floor(random() * 300))::int end,
      case when v_i % 8 = 0 then current_date + (60 + floor(random() * 500))::int end,
      v_place ->> 'd', v_locality, v_place ->> 'p', '9000000000',
      random() < 0.8, random() < 0.4,
      v_status,
      now() - (random() * 45 || ' days')::interval
    )
    returning id into v_listing_id;

    if v_with_photos and v_i % 2 = 0 then
      insert into public.listing_images (listing_id, storage_path, display_order)
      select v_listing_id, v_photo_paths[p], p - 1
      from generate_series(1, least(array_length(v_photo_paths, 1), 1 + floor(random() * 5)::int)) as p;
    end if;
  end loop;

  raise notice 'Inserted demo listings for %', v_email;
end;
$$;
