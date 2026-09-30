-- ============================================================================
-- 0009: profile phone visibility opt-in
-- ============================================================================
--
-- Phase 5 adds seller contact via WhatsApp/phone from the listing detail
-- screen. Per spec section 6A/18, we must not automatically reveal a
-- seller's private phone number without explicit consent. The base
-- `profiles` table stays owner-only readable (see 0001), and
-- `profiles_public` still excludes `phone` by default. This migration adds
-- an explicit opt-in column and conditionally exposes `phone` through the
-- view only for profiles where the owner has turned it on.

alter table public.profiles
  add column if not exists show_phone_publicly boolean not null default false;

comment on column public.profiles.show_phone_publicly is
  'Explicit opt-in: when true, this profile''s phone number is exposed via the profiles_public view for buyer contact (WhatsApp/call). Defaults to false — phone is private by default.';

-- Recreate the public-safe view to conditionally include phone. Same
-- ownership/security notes as 0001 apply: this view is NOT security_invoker,
-- so it can read every row of `profiles` regardless of the owner-only RLS
-- policy on the base table, but only exposes the columns listed here — and
-- `phone` is only ever populated when the owner opted in.
create or replace view public.profiles_public as
select
  id,
  full_name,
  avatar_url,
  district,
  locality,
  created_at,
  show_phone_publicly,
  case when show_phone_publicly then phone else null end as phone
from public.profiles;

comment on view public.profiles_public is
  'Public-safe subset of profiles for showing seller info on listings. phone is null unless the owner set show_phone_publicly = true. Use this view from client code instead of the base profiles table for any non-owner read.';

grant select on public.profiles_public to anon, authenticated;
