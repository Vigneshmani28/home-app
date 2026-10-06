-- ============================================================================
-- 0015: listing views (unique viewers per listing)
-- ============================================================================
-- One row per (listing, viewer). Signed-in viewers are keyed by their user id, guests by a random
-- id the app generates once per install. The unique constraint means opening a listing again and
-- again never adds a second row, so "views" = unique viewers. The table is not readable or
-- writable directly; everything goes through the two functions below.

create table if not exists public.listing_views (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  viewer_key text not null check (char_length(viewer_key) between 3 and 80),
  created_at timestamptz not null default now(),
  unique (listing_id, viewer_key)
);

comment on table public.listing_views is
  'Unique viewers of a listing. viewer_key is "u:<user id>" for signed-in users or "d:<device id>" for guests.';

alter table public.listing_views enable row level security;
-- No policies on purpose: with RLS on and no policy, anon/authenticated can do nothing directly.
revoke all on public.listing_views from anon, authenticated;

-- Records a view. Returns true only when it was a new unique view.
-- Not counted: unknown / non-active listings, the seller viewing their own listing,
-- guests without a valid device id, and repeat views by the same viewer.
create or replace function public.record_listing_view(
  p_listing_id uuid,
  p_device_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_status text;
  v_key text;
  v_rows int;
begin
  select seller_id, status into v_seller, v_status
  from public.listings
  where id = p_listing_id;

  if not found or v_status <> 'active' then
    return false;
  end if;

  if v_uid is not null then
    if v_uid = v_seller then
      return false;
    end if;
    v_key := 'u:' || v_uid::text;
  else
    if p_device_id is null or p_device_id !~ '^[A-Za-z0-9-]{16,64}$' then
      return false;
    end if;
    v_key := 'd:' || p_device_id;
  end if;

  insert into public.listing_views (listing_id, viewer_key)
  values (p_listing_id, v_key)
  on conflict (listing_id, viewer_key) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.record_listing_view(uuid, text) from public;
grant execute on function public.record_listing_view(uuid, text) to anon, authenticated;

-- View counts for the caller's own listings (all statuses), for the My Listings screen.
create or replace function public.my_listing_view_counts()
returns table (listing_id uuid, view_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, count(v.id)
  from public.listings l
  left join public.listing_views v on v.listing_id = l.id
  where l.seller_id = auth.uid()
  group by l.id;
$$;

revoke all on function public.my_listing_view_counts() from public;
grant execute on function public.my_listing_view_counts() to authenticated;
