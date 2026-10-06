-- ============================================================================
-- 0016: soft-delete listings
-- ============================================================================
-- "Deleting" a listing keeps the row (for analytics) and marks it status = 'deleted'. A deleted
-- listing is invisible to everyone through the API, the owner included. Deleting an ACCOUNT still
-- removes everything: listings.seller_id -> profiles -> auth.users cascade, and listing_images,
-- listing_views, favorites and enquiries cascade from the listing.

alter table public.listings
  drop constraint if exists listings_status_check;
alter table public.listings
  add constraint listings_status_check
  check (status in ('draft', 'active', 'reserved', 'sold', 'expired', 'inactive', 'deleted'));

alter table public.listings
  add column if not exists deleted_at timestamptz;

-- SELECT: active listings for everyone; the owner also sees their own, except deleted ones.
drop policy if exists "listings_select_active_or_own" on public.listings;
create policy "listings_select_active_or_own"
  on public.listings
  for select
  to anon, authenticated
  using (
    status = 'active'
    or (auth.uid() is not null and seller_id = auth.uid() and status <> 'deleted')
  );

-- UPDATE: owner only, never on a deleted listing, and the app cannot set status = 'deleted'
-- directly — that goes through delete_listing() so deleted_at is always set.
drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own"
  on public.listings
  for update
  to authenticated
  using (seller_id = auth.uid() and status <> 'deleted')
  with check (seller_id = auth.uid() and status <> 'deleted');

-- Photos follow the listing's visibility.
drop policy if exists "listing_images_select_visible" on public.listing_images;
create policy "listing_images_select_visible"
  on public.listing_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_images.listing_id
        and (
          l.status = 'active'
          or (auth.uid() is not null and l.seller_id = auth.uid() and l.status <> 'deleted')
        )
    )
  );

-- Soft-deletes one of the caller's own listings. Returns false if it isn't theirs / doesn't exist.
create or replace function public.delete_listing(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete a listing.';
  end if;

  update public.listings
  set status = 'deleted', deleted_at = now()
  where id = p_listing_id
    and seller_id = auth.uid()
    and status <> 'deleted';

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.delete_listing(uuid) from public;
grant execute on function public.delete_listing(uuid) to authenticated;
