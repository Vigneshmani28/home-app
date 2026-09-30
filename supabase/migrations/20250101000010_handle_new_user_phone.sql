-- ============================================================================
-- 0010: Copy phone number into profiles on signup
-- ============================================================================
-- handle_new_user() (see 20250101000001) only ever copied `full_name` out of
-- auth.users.raw_user_meta_data when auto-creating a profiles row, so a phone
-- number entered at signup (sent as auth metadata by the register screen) was
-- silently dropped and profiles.phone stayed null. This redefines the
-- trigger function to also copy `phone` when present.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill: for existing users whose profile is missing a phone number but
-- whose auth metadata has one (signed up before this fix), copy it over now.
update public.profiles p
set phone = nullif(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
where u.id = p.id
  and p.phone is null
  and coalesce(u.raw_user_meta_data ->> 'phone', '') <> '';
