-- ============================================================================
-- 0001: Extensions, generic helper functions, and profiles table
-- ============================================================================

-- Extensions -----------------------------------------------------------------
-- gen_random_uuid() ships with pgcrypto; PostGIS is required for geography
-- columns / nearby-search RPC added in a later migration.
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- Generic reusable trigger function to maintain `updated_at` columns.
-- Fixed search_path per Postgres security best practice for SECURITY DEFINER
-- and trigger functions that could otherwise be hijacked via search_path.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  district text,
  locality text,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth.users user. Created automatically by handle_new_user() trigger.';

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth.users row is inserted.
-- SECURITY DEFINER with a fixed search_path so it can write to public.profiles
-- regardless of the caller's role, and cannot be tricked by a hostile
-- search_path into resolving `public.profiles` to something else.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Row Level Security -------------------------------------------------------
alter table public.profiles enable row level security;

-- IMPORTANT: the base `profiles` table is intentionally readable ONLY by its
-- owner. Section 6A of the spec forbids exposing private auth metadata or
-- contact details (phone) to arbitrary users, but Postgres RLS is row-level
-- (not column-level), so we cannot simply allow public SELECT on this table
-- while hiding the `phone`/`pincode` columns from anon/other users.
--
-- Instead, any client code that needs to show "seller info" on a listing
-- (name/avatar/district/locality) MUST query the `public.profiles_public`
-- view defined below, which only exposes the public-safe subset of columns
-- and is granted to anon + authenticated. The base table stays locked to
-- `auth.uid() = id`.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy: rows are created exclusively by the handle_new_user()
-- trigger (SECURITY DEFINER, bypasses RLS). No DELETE policy: deletion
-- cascades automatically from auth.users via the FK ON DELETE CASCADE.

-- Public-safe view --------------------------------------------------------
-- Deliberately NOT `security_invoker = true`. Postgres views default to
-- running with the privileges of the view's OWNER (the migration role,
-- e.g. `postgres`/`supabase_admin`), not the caller. Table owners are
-- exempt from RLS unless `FORCE ROW LEVEL SECURITY` is set on the table
-- (it is not here), so a query against this view sees every row in
-- `profiles` regardless of the restrictive "profiles_select_own" policy
-- above — but only the columns explicitly listed below are ever exposed.
-- This gives us column-level privacy (no phone, no pincode) layered on
-- top of Postgres's row-level RLS, without loosening the base table's
-- owner-only SELECT policy.
create or replace view public.profiles_public as
select
  id,
  full_name,
  avatar_url,
  district,
  locality,
  created_at
from public.profiles;

comment on view public.profiles_public is
  'Public-safe subset of profiles (no phone, no pincode) for showing seller info on listings. Use this view from client code instead of the base profiles table for any non-owner read.';

grant select on public.profiles_public to anon, authenticated;
