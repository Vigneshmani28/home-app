-- ============================================================================
-- 0004: listing_images
-- ============================================================================

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.listing_images is
  'Up to 5 images per listing, stored in the listing-images storage bucket under {user_id}/{listing_id}/{filename}.';

create index if not exists idx_listing_images_listing_id on public.listing_images (listing_id);

-- Enforce a maximum of 5 images per listing at the database layer.
create or replace function public.enforce_listing_images_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count integer;
begin
  select count(*) into existing_count
  from public.listing_images
  where listing_id = new.listing_id;

  if existing_count >= 5 then
    raise exception 'A listing may have at most 5 images (listing_id: %)', new.listing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_listing_images_limit on public.listing_images;
create trigger trg_enforce_listing_images_limit
  before insert on public.listing_images
  for each row
  execute function public.enforce_listing_images_limit();

-- Row Level Security -------------------------------------------------------
alter table public.listing_images enable row level security;

-- SELECT: visible whenever the parent listing is visible (active, or owned
-- by the requester) — mirrors the listings_select_active_or_own policy.
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
          or (auth.uid() is not null and l.seller_id = auth.uid())
        )
    )
  );

-- INSERT/UPDATE/DELETE: only the listing owner.
create policy "listing_images_insert_owner"
  on public.listing_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = auth.uid()
    )
  );

create policy "listing_images_update_owner"
  on public.listing_images
  for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = auth.uid()
    )
  );

create policy "listing_images_delete_owner"
  on public.listing_images
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = auth.uid()
    )
  );
