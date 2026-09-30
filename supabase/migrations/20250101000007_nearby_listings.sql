-- ============================================================================
-- 0007: nearby_listings() — PostGIS-backed nearby search RPC
-- ============================================================================

create or replace function public.nearby_listings(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision default null,
  category_filter uuid default null,
  min_price numeric default null,
  max_price numeric default null,
  page_limit int default 20,
  page_offset int default 0
)
returns table (
  id uuid,
  title text,
  price numeric,
  condition text,
  district text,
  locality text,
  quantity numeric,
  unit text,
  status text,
  created_at timestamptz,
  distance_km double precision,
  primary_image_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.title,
    l.price,
    l.condition,
    l.district,
    l.locality,
    l.quantity,
    l.unit,
    l.status,
    l.created_at,
    case
      when l.location is null then null
      else st_distance(l.location, st_makepoint(search_lng, search_lat)::geography) / 1000.0
    end as distance_km,
    (
      select li.storage_path
      from public.listing_images li
      where li.listing_id = l.id
      order by li.display_order asc
      limit 1
    ) as primary_image_path
  from public.listings l
  where l.status = 'active'
    and (
      radius_km is null
      or l.location is null
      or st_dwithin(
        l.location,
        st_makepoint(search_lng, search_lat)::geography,
        radius_km * 1000.0
      )
    )
    and (category_filter is null or l.category_id = category_filter)
    and (min_price is null or l.price >= min_price)
    and (max_price is null or l.price <= max_price)
  order by distance_km asc nulls last, l.created_at desc
  limit greatest(page_limit, 0)
  offset greatest(page_offset, 0);
$$;

comment on function public.nearby_listings is
  'Statewide/radius-bounded search over active listings, ordered nearest-first. Pass radius_km = null for an unbounded (statewide) search that still returns distance_km when a search point is supplied.';

grant execute on function public.nearby_listings(
  double precision, double precision, double precision, uuid, numeric, numeric, int, int
) to anon, authenticated;
