-- ============================================================================
-- 0008: listing-images storage bucket + RLS policies
-- ============================================================================
-- Public bucket: listing photos are meant to be publicly viewable in a
-- marketplace (no privacy expectation for item photos), so we go with a
-- PUBLIC bucket for MVP simplicity. Path convention enforced by policy:
--   {user_id}/{listing_id}/{filename}
-- storage.foldername(name) returns the path split into an array of folder
-- segments, e.g. for 'abc-123/def-456/photo.jpg' it returns
-- ['abc-123', 'def-456'] — foldername(name)[1] is therefore the {user_id}
-- segment, which we compare against auth.uid()::text.

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Public read of listing images.
create policy "listing_images_bucket_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'listing-images');

-- Authenticated users may upload only under their own {user_id}/ prefix.
create policy "listing_images_bucket_insert_own_prefix"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may update only objects under their own prefix.
create policy "listing_images_bucket_update_own_prefix"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may delete only objects under their own prefix.
create policy "listing_images_bucket_delete_own_prefix"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
