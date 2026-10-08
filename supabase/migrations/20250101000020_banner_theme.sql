-- ============================================================================
-- 0020: banner colour theme + transparent-art image types
-- ============================================================================
-- Banners are now drawn by the app like the built-in ones: coloured card, text on the left, the uploaded
-- transparent picture on the right. `theme` picks the card colours.

alter table public.banners
  add column if not exists theme text not null default 'green'
    check (theme in ('green', 'orange', 'dark', 'blue'));

-- Transparent art only makes sense as PNG or WebP.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/webp']
where id = 'banners';
