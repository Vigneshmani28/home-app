-- ============================================================================
-- 0017: report a listing
-- ============================================================================
-- Signed-in users can report a listing once each. Reports are only readable by the reporter (to show
-- "You reported this"); moderators review them in the Supabase dashboard / with the service role.

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null
    check (reason in ('spam', 'scam', 'wrong_info', 'prohibited', 'sold_unavailable', 'offensive', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (listing_id, reporter_id)
);

comment on table public.listing_reports is
  'User reports against listings. One per (listing, reporter). Moderation status is managed by staff.';

create index if not exists idx_listing_reports_status_created
  on public.listing_reports (status, created_at desc);
create index if not exists idx_listing_reports_listing_id
  on public.listing_reports (listing_id);
create index if not exists idx_listing_reports_reporter_created
  on public.listing_reports (reporter_id, created_at desc);

alter table public.listing_reports enable row level security;

-- A reporter can see only their own reports. There are no insert/update/delete policies:
-- creating a report goes through report_listing() below, which validates it.
create policy "listing_reports_select_own"
  on public.listing_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

revoke insert, update, delete on public.listing_reports from anon, authenticated;

-- Files a report. Returns a status string instead of raising, so the app can show a precise message:
--   'ok' | 'already_reported' | 'own_listing' | 'not_found' | 'rate_limited' | 'invalid'
create or replace function public.report_listing(
  p_listing_id uuid,
  p_reason text,
  p_details text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_status text;
  v_details text := nullif(btrim(coalesce(p_details, '')), '');
  v_rows int;
begin
  if v_uid is null then
    raise exception 'You must be signed in to report a listing.';
  end if;

  if p_reason is null
     or p_reason not in ('spam', 'scam', 'wrong_info', 'prohibited', 'sold_unavailable', 'offensive', 'other')
     or (v_details is not null and char_length(v_details) > 500)
     or (p_reason = 'other' and (v_details is null or char_length(v_details) < 10)) then
    return 'invalid';
  end if;

  select seller_id, status into v_seller, v_status
  from public.listings
  where id = p_listing_id;

  if not found or v_status = 'deleted' then
    return 'not_found';
  end if;
  if v_seller = v_uid then
    return 'own_listing';
  end if;

  -- Abuse guard: at most 10 reports per user per 24 hours.
  if (select count(*) from public.listing_reports
      where reporter_id = v_uid and created_at > now() - interval '24 hours') >= 10 then
    return 'rate_limited';
  end if;

  insert into public.listing_reports (listing_id, reporter_id, reason, details)
  values (p_listing_id, v_uid, p_reason, v_details)
  on conflict (listing_id, reporter_id) do nothing;

  get diagnostics v_rows = row_count;
  return case when v_rows > 0 then 'ok' else 'already_reported' end;
end;
$$;

revoke all on function public.report_listing(uuid, text, text) from public;
grant execute on function public.report_listing(uuid, text, text) to authenticated;
