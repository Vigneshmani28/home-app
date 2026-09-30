-- ============================================================================
-- 0013: Per-listing contact phone number
-- ============================================================================
-- Buyers now contact sellers directly (WhatsApp / phone call) instead of via
-- in-app enquiries. Each listing carries the number buyers should use, so a
-- seller can use a different number for a listing without touching the phone
-- number on their profile. The number is public with the listing by design
-- (the seller enters it in the sell form for exactly this purpose).

alter table public.listings
  add column if not exists contact_phone text;

-- Backfill: existing listings fall back to the seller's profile phone, if any,
-- so their contact buttons keep working.
update public.listings l
set contact_phone = p.phone
from public.profiles p
where p.id = l.seller_id
  and l.contact_phone is null
  and p.phone is not null;
