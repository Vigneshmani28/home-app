# RLS / storage security checklist

This is a manual verification checklist, **not an executed test suite** —
there is no live Supabase project connected to this repo yet, so none of the
SQL below has actually been run. Once a project exists (`supabase link` +
`supabase db push`, see the root `README.md`), each scenario can be verified
in the Supabase SQL editor by impersonating two different users and running
the snippet under it.

General technique for impersonating a user in the SQL editor: Supabase's
`auth.uid()` reads from the request JWT, which the SQL editor doesn't send by
default. Use `set local role authenticated; set local request.jwt.claims =
'{"sub":"<user-a-uuid>","role":"authenticated"}';` before each snippet (or
simpler: sign in as each test user from the app / via `supabase auth` and use
the Table Editor's "RLS" test panel, which does this for you). All snippets
below assume two already-created auth users, referred to as **User A**
(`<uid-a>`) and **User B** (`<uid-b>`), each with a `profiles` row (created
automatically by the `handle_new_user` trigger — see
`20250101000001_extensions_and_profiles.sql`), and User A owns a listing
`<listing-a>`.

---

## 1. User A cannot edit User B's listing

**Enforced by:** `listings_update_own` policy on `public.listings`
(`supabase/migrations/20250101000003_listings.sql`, lines 84-89). The `using`
clause restricts which rows are visible to `UPDATE` to `seller_id =
auth.uid()`, so an `UPDATE` targeting a listing owned by another user matches
zero rows and silently affects nothing (returns 0 rows updated, no error).

**Verify (as User A, target a listing owned by User B, `<listing-b>`):**

```sql
update public.listings
set title = 'hijacked title'
where id = '<listing-b>';
-- Expect: UPDATE 0 (no rows affected), not an error.
select title from public.listings where id = '<listing-b>';
-- Expect: title unchanged.
```

## 2. User A cannot delete User B's listing

**Enforced by:** `listings_delete_own` policy on `public.listings`
(`20250101000003_listings.sql`, lines 92-96), same pattern — `using (seller_id
= auth.uid())`.

**Verify (as User A):**

```sql
delete from public.listings where id = '<listing-b>';
-- Expect: DELETE 0.
select id from public.listings where id = '<listing-b>';
-- Expect: row still present.
```

## 3. User A cannot change a listing's seller_id (reassign ownership)

**Enforced by:** `listings_update_own`'s `with check (seller_id =
auth.uid())` clause (`20250101000003_listings.sql`, line 89). Even on a row
User A *does* own, the `with check` clause rejects any update that would
result in `seller_id <> auth.uid()` after the write — so User A cannot give
their own listing away to User B, and (per scenario 1) cannot touch User B's
listing to begin with.

**Verify (as User A, on their own listing `<listing-a>`):**

```sql
update public.listings
set seller_id = '<uid-b>'
where id = '<listing-a>';
-- Expect: error — "new row violates row-level security policy for table
-- \"listings\"" (the with check clause rejects the post-write row).
```

Also covered client-side: `src/features/listings/services/listings-service.ts`
`createListing()` derives `seller_id` from `supabase.auth.getUser()` — the
`CreateListingInput` type has no `sellerId` field, so the client can't even
attempt to submit a different one on insert.

## 4. User A cannot access User B's enquiries

**Enforced by:** `enquiries_select_buyer_or_seller` policy on
`public.enquiries` (`supabase/migrations/20250101000006_enquiries.sql`, lines
36-47). A row is visible only if the caller is the `buyer_id` on it, or the
`seller_id` of the listing it references. There is deliberately **no**
`UPDATE`/`DELETE` policy on `enquiries` at all (see the comment at the bottom
of that migration) — with RLS enabled and no permissive policy for those
commands, every `UPDATE`/`DELETE` is denied for every user, including the
buyer or seller themselves.

**Verify (as User A, where `<enquiry-b>` is an enquiry between User B and a
third user, not involving User A at all):**

```sql
select * from public.enquiries where id = '<enquiry-b>';
-- Expect: 0 rows (not visible, not an error).

update public.enquiries set message = 'x' where id = '<enquiry-b>';
-- Expect: UPDATE 0 (no policy permits UPDATE for anyone).
```

## 5. User A cannot modify User B's favorites

**Enforced by:** `favorites_update_own` and `favorites_delete_own` policies
on `public.favorites` (`supabase/migrations/20250101000005_favorites.sql`,
lines 33-44), both scoped to `using (user_id = auth.uid())`. `favorites_
insert_own` (line 27-31) similarly requires `with check (user_id =
auth.uid())`, so User A can't even insert a favorite row on User B's behalf.

**Verify (as User A, `<favorite-b>` owned by User B):**

```sql
delete from public.favorites where id = '<favorite-b>';
-- Expect: DELETE 0.

insert into public.favorites (user_id, listing_id)
values ('<uid-b>', '<listing-a>');
-- Expect: error — row violates row-level security policy (with check fails:
-- user_id = '<uid-b>' but auth.uid() = '<uid-a>').
```

## 6. Unauthenticated users cannot create listings

**Enforced by:** `listings_insert_own` policy
(`20250101000003_listings.sql`, lines 77-81) is scoped `to authenticated`
only — the `anon` role has no matching policy for `INSERT`, so with RLS
enabled the insert is denied outright before the `with check` clause is even
evaluated.

**Verify (run as the `anon` role — e.g. via the SQL editor's "anon" role
switch, or an unauthenticated `supabase-js` client using the anon key):**

```sql
set local role anon;
insert into public.listings (seller_id, category_id, material_name, title, quantity, unit, price, condition, district, locality, pickup_available, delivery_available)
values ('<uid-a>', '<some-category-id>', 'Cement', 'Test', 10, 'bags', 100, 'unused', 'Chennai', 'Adyar', true, false);
-- Expect: error — new row violates row-level security policy for table "listings".
```

## 7. Sold (and otherwise inactive) listings are excluded from active search

**Enforced by:** `listings_select_active_or_own` policy
(`20250101000003_listings.sql`, lines 67-74) — `anon`/`authenticated` callers
only see rows where `status = 'active'`, *unless* they're the listing's own
seller (`seller_id = auth.uid()`). This means a `sold`/`reserved`/`inactive`/
`expired`/`draft` listing disappears from every other user's search results
and detail-page lookups (`getListingById` in
`src/features/listings/services/listings-service.ts` will get `null` for a
non-owner querying a non-active listing), while the seller can still see it
in "My Listings".

Additionally, `src/features/listings/services/listings-service.ts`
`searchListings()` always applies `.eq('status', 'active')` itself as a
belt-and-suspenders app-level filter on top of the RLS policy.

**Verify (as User B, a `<listing-a>` owned by User A with `status = 'sold'`):**

```sql
select id from public.listings where status = 'active';
-- Expect: '<listing-a>' NOT in the result set.

select * from public.listings where id = '<listing-a>';
-- Expect: 0 rows (User B is not the owner, and it's not active).
```

**Verify (as User A, the owner):**

```sql
select * from public.listings where id = '<listing-a>';
-- Expect: 1 row — owners can always see their own listing regardless of status.
```

## 8. Storage policies prevent unauthorized upload/delete

**Enforced by:** the `listing-images` bucket policies in
`supabase/migrations/20250101000008_storage_listing_images.sql`:
- `listing_images_bucket_insert_own_prefix` (lines 25-32) — `INSERT` only
  allowed when `(storage.foldername(name))[1] = auth.uid()::text`, i.e. the
  first path segment (`{user_id}/...`) must match the caller.
- `listing_images_bucket_update_own_prefix` (lines 35-46) — same prefix check
  for `UPDATE`.
- `listing_images_bucket_delete_own_prefix` (lines 49-56) — same prefix check
  for `DELETE`.
- `listing_images_bucket_public_read` (lines 18-22) is intentionally public
  (`to anon, authenticated`, no prefix check) since listing photos have no
  privacy expectation in this marketplace.

**Verify (as User A, attempting to upload/delete under User B's prefix):**

```sql
-- Simulated via the storage.objects table directly (in practice this is
-- exercised through the Storage API / supabase-js .upload()/.remove(),
-- which enforce the same policies under the hood).
insert into storage.objects (bucket_id, name, owner)
values ('listing-images', '<uid-b>/<listing-b>/fake.jpg', auth.uid());
-- Expect: error — row violates row-level security policy
-- (foldername(name)[1] = '<uid-b>' but auth.uid() = '<uid-a>').

delete from storage.objects
where bucket_id = 'listing-images' and name like '<uid-b>/%';
-- Expect: DELETE 0 — no objects visible/deletable under another user's prefix.
```

**Verify read is still public (as `anon`):**

```sql
set local role anon;
select name from storage.objects where bucket_id = 'listing-images' limit 1;
-- Expect: rows returned — public read works for anyone.
```

---

## Summary table

| # | Scenario | Policy name | Migration file |
|---|----------|-------------|-----------------|
| 1 | Can't edit another user's listing | `listings_update_own` | `20250101000003_listings.sql` |
| 2 | Can't delete another user's listing | `listings_delete_own` | `20250101000003_listings.sql` |
| 3 | Can't change seller_id | `listings_update_own` (`with check`) | `20250101000003_listings.sql` |
| 4 | Can't access another user's enquiries | `enquiries_select_buyer_or_seller` (+ no UPDATE/DELETE policy at all) | `20250101000006_enquiries.sql` |
| 5 | Can't modify another user's favorites | `favorites_update_own`, `favorites_delete_own`, `favorites_insert_own` | `20250101000005_favorites.sql` |
| 6 | Unauthenticated can't create listings | `listings_insert_own` (`to authenticated` only) | `20250101000003_listings.sql` |
| 7 | Sold listings excluded from search | `listings_select_active_or_own` | `20250101000003_listings.sql` |
| 8 | Storage upload/delete restricted to own prefix | `listing_images_bucket_insert_own_prefix`, `listing_images_bucket_update_own_prefix`, `listing_images_bucket_delete_own_prefix` | `20250101000008_storage_listing_images.sql` |

Related but not itemized above: `profiles_select_own` / `profiles_update_own`
(`20250101000001_extensions_and_profiles.sql`) restrict the base `profiles`
table to owner-only reads/writes — public profile info (name, locality,
avatar) is exposed instead through the `profiles_public` view, which the app
reads via `src/features/listings/services` / `src/features/enquiries/services`
joins instead of querying `profiles` directly.
