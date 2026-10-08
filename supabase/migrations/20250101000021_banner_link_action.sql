-- ============================================================================
-- 0021: banners can open an external link
-- ============================================================================

alter table public.banners
  add column if not exists link_url text
    check (link_url is null or (char_length(link_url) <= 500 and link_url ~* '^https?://[^\s]+$'));

alter table public.banners drop constraint if exists banners_action_type_check;
alter table public.banners
  add constraint banners_action_type_check
  check (action_type in ('explore', 'sell', 'category', 'link', 'none'));

alter table public.banners drop constraint if exists banners_link_required;
alter table public.banners
  add constraint banners_link_required
  check (action_type <> 'link' or link_url is not null);
