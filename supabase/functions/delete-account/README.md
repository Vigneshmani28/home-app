# delete-account Edge Function

Deletes the calling user's account (`auth.users` row + everything that
cascades from it: `profiles`, `listings`, `listing_images`, `favorites`,
`enquiries`). Must run server-side because it needs the service-role key,
which must never be bundled into the mobile app.

## Local development

```bash
supabase functions serve delete-account --env-file supabase/functions/.env.local
```

`.env.local` (not committed) should contain:

```
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<local service role key from `supabase status`>
```

## Deploying

```bash
supabase functions deploy delete-account
```

## Required secrets (production)

Set once per linked project — never commit these values:

```bash
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role key from Project Settings > API>
```

## How the app calls it

`src/features/profile/services/account-service.ts` calls
`supabase.functions.invoke('delete-account')`. The Supabase client SDK
automatically attaches the current user's JWT as the `Authorization` header,
which this function verifies (via `supabase.auth.getUser(jwt)` using an
admin client constructed with the service-role key) before deleting.
