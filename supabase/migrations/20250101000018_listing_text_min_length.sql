-- ============================================================================
-- 0018: minimum length for listing title and material name
-- ============================================================================
-- The app already enforces these (title >= 10, material name >= 3 characters, ignoring surrounding
-- spaces). This is the database backstop so other clients cannot bypass it.
--
-- A trigger is used instead of a CHECK constraint on purpose: a CHECK is evaluated on every update of
-- a row, so existing listings with a short title could no longer be marked sold or deleted. The trigger
-- only looks at new rows and at edits that actually change the title or material name.

create or replace function public.enforce_listing_text_min_length()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title then
    if char_length(btrim(new.title)) < 10 then
      raise exception 'Listing title must be at least 10 characters.' using errcode = 'check_violation';
    end if;
  end if;

  if (tg_op = 'INSERT' or new.material_name is distinct from old.material_name)
     and new.material_name is not null
     and char_length(btrim(new.material_name)) < 3 then
    raise exception 'Material name must be at least 3 characters.' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_listing_text_min_length on public.listings;
create trigger trg_enforce_listing_text_min_length
  before insert or update of title, material_name on public.listings
  for each row
  execute function public.enforce_listing_text_min_length();
