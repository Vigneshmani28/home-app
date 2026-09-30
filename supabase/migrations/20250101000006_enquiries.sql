-- ============================================================================
-- 0006: enquiries
-- ============================================================================

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  contact_method text not null default 'in_app',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

comment on table public.enquiries is
  'Buyer enquiries sent to a seller about a listing.';

create index if not exists idx_enquiries_buyer_id on public.enquiries (buyer_id);
create index if not exists idx_enquiries_listing_id on public.enquiries (listing_id);

alter table public.enquiries enable row level security;

-- INSERT: authenticated buyers only, must enquire as themselves, and may
-- not enquire on their own listing.
create policy "enquiries_insert_buyer"
  on public.enquiries
  for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and buyer_id <> (select seller_id from public.listings where id = listing_id)
  );

-- SELECT: the buyer can see their own enquiries; the seller can see
-- enquiries made on their own listings.
create policy "enquiries_select_buyer_or_seller"
  on public.enquiries
  for select
  to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = enquiries.listing_id
        and l.seller_id = auth.uid()
    )
  );

-- No UPDATE/DELETE policy for MVP (kept intentionally simple; revisit in a
-- later phase if buyers need to close/withdraw an enquiry).
