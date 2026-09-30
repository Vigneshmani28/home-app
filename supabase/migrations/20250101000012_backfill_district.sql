-- ============================================================================
-- 0012: Backfill district for accounts created before the 0011 trigger fix
-- ============================================================================
-- 0011 redefined handle_new_user() so NEW signups get their district copied
-- from auth metadata into profiles.district. But that only affects rows
-- inserted by the trigger going forward — anyone who signed up with a
-- district selected before 0011 was applied already got a profiles row with
-- district = null, and the trigger's `on conflict (id) do nothing` means it
-- will never retroactively fix them. Backfill those rows now, same pattern
-- as the phone backfill in 0010.

update public.profiles p
set district = nullif(u.raw_user_meta_data ->> 'district', '')
from auth.users u
where u.id = p.id
  and p.district is null
  and coalesce(u.raw_user_meta_data ->> 'district', '') <> '';
