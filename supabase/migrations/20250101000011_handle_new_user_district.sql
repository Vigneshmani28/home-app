-- ============================================================================
-- 0011: Copy district into profiles on signup
-- ============================================================================
-- The register screen now asks for the user's district (pre-filled from their
-- device location) and sends it as auth metadata (`district`). Redefine the
-- new-user trigger so it is copied into profiles.district along with
-- full_name and phone.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, district)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'district', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
