-- ============================================================================
-- 0019: home-screen banners + admin allowlist + banners storage bucket
-- ============================================================================
-- Managed from the admin web app (admin/) with the *anon* key and a signed-in admin session. There is no
-- service-role key anywhere: everything is enforced here with RLS, so a leaked web bundle can't write anything.
--
--   * public.admins     – allowlist of auth users who may manage banners (insert rows from the SQL editor).
--   * public.banners    – up to 4 ACTIVE banners (enforced by a trigger, not just the UI).
--   * storage 'banners' – public-read bucket, admin-only writes.

-- admins ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'Auth users allowed to manage banners. Rows are added manually in the SQL editor; no client can write here.';

alter table public.admins enable row level security;

-- An admin can see their own row only (lets the web app double check). No write policies at all.
create policy "admins_select_own"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.admins from anon, authenticated;

-- SECURITY DEFINER so policies on other tables can consult `admins` without granting access to it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- banners --------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  subtitle text check (subtitle is null or char_length(subtitle) <= 200),
  -- Path inside the 'banners' bucket (e.g. 'a1b2c3.webp'), not a full URL, so the host can change freely.
  image_path text not null check (char_length(image_path) between 1 and 300),
  button_text text not null check (char_length(btrim(button_text)) between 1 and 50),
  action_type text not null default 'explore'
    check (action_type in ('explore', 'sell', 'category', 'none')),
  category_id uuid references public.categories (id) on delete set null,
  display_order integer not null default 1 check (display_order between 0 and 9999),
  is_active boolean not null default true,
  -- Both optional, inclusive, India time. Null start = from now on, null end = no expiry.
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_date_range check (start_date is null or end_date is null or end_date >= start_date),
  constraint banners_category_required check (action_type <> 'category' or category_id is not null)
);

comment on table public.banners is
  'Promotional banners for the mobile Home screen. Max 4 active at once (see banners_limit_active).';

create index if not exists idx_banners_active_order on public.banners (is_active, display_order);

drop trigger if exists set_banners_updated_at on public.banners;
create trigger set_banners_updated_at
  before update on public.banners
  for each row
  execute function public.set_updated_at();

-- At most 4 active banners. The advisory lock serialises concurrent inserts/updates so two admins (or two
-- tabs) can't both slip a 5th one in.
create or replace function public.banners_limit_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active then
    perform pg_advisory_xact_lock(hashtext('public.banners.active_limit'));
    if (select count(*) from public.banners where is_active and id <> new.id) >= 4 then
      raise exception 'Only 4 banners can be active at a time. Deactivate one first.'
        using errcode = 'check_violation', hint = 'banner_limit';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists banners_limit_active on public.banners;
create trigger banners_limit_active
  before insert or update of is_active on public.banners
  for each row
  execute function public.banners_limit_active();

alter table public.banners enable row level security;

-- The mobile app (anon or signed in) sees only banners that are active and inside their date window.
create policy "banners_select_live"
  on public.banners
  for select
  to anon, authenticated
  using (
    is_active
    and (start_date is null or start_date <= (now() at time zone 'Asia/Kolkata')::date)
    and (end_date is null or end_date >= (now() at time zone 'Asia/Kolkata')::date)
  );

-- Admins see and change everything.
create policy "banners_admin_all"
  on public.banners
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.banners to anon, authenticated;
grant insert, update, delete on public.banners to authenticated;

-- storage ----------------------------------------------------------------------
-- Public bucket (banner art is meant to be seen by everyone), capped at 2 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without a policy; these let the admin upload, replace and delete.
create policy "banners_bucket_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'banners' and public.is_admin());

create policy "banners_bucket_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'banners' and public.is_admin())
  with check (bucket_id = 'banners' and public.is_admin());

create policy "banners_bucket_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'banners' and public.is_admin());

create policy "banners_bucket_admin_select"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'banners' and public.is_admin());
