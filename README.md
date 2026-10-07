# Rebix

A mobile marketplace for buying and selling surplus/used construction
materials in Tamil Nadu — cement, steel, tiles, sanitaryware, and similar —
built with Expo Router and backed by Supabase. Sellers post listings with
photos, price, quantity, condition, and pickup location; buyers browse by
category, search by location (including a "nearby" radius search), save
favorites, and send enquiries directly to sellers.

## Tech stack

- **Expo SDK 57** / **React Native 0.86** / **React 19**, app code in
  TypeScript with `strict` mode on.
- **Expo Router** for file-based navigation (`src/app/`).
- **Supabase** — Postgres + PostGIS (nearby search), Row Level Security,
  Storage (listing photos), Auth, and one Edge Function
  (`delete-account`).
- **TanStack Query** for server state (listings, favorites, enquiries,
  profile), **React Hook Form** + **Zod** for form validation, **Redux
  Toolkit** for the small bits of client-only UI state.
- **react-native-paper** for UI components.
- **Jest** (`jest-expo` preset) + **@testing-library/react-native** for
  unit tests.

## Project structure

```
src/
  app/            Expo Router routes — every file here is a screen
  components/     Shared, non-route UI components
  features/       Feature modules (auth, categories, listings, location,
                   favorites, enquiries, profile), each with its own
                   components/hooks/services/schemas/types
  lib/             Supabase client, TanStack Query client
  theme/, constants/, hooks/, utils/, stores/   Cross-cutting app code
supabase/
  migrations/     Numbered SQL migrations (schema, RLS, storage, RPC)
  functions/      Edge Functions (delete-account)
  seed.sql        Category seed data (see "Local dev" below)
  tests/          RLS/security verification checklist
tests/
  unit/           Jest unit tests, mirroring the src/ structure
  integration/    Placeholder for future integration tests
```

## Prerequisites

- Node.js (LTS) and npm.
- A [Supabase](https://supabase.com) account and the
  [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install
  supabase/tap/supabase`, or see the CLI docs for other platforms).
- Expo Go (for quick testing) or a development build — some native modules
  used here (expo-location, expo-image-picker, expo-notifications,
  expo-secure-store) work in Expo Go, but for production-accurate testing
  prefer `npx expo run:ios` / `npx expo run:android`.
- iOS Simulator (macOS + Xcode) and/or Android Studio, if running native
  simulators/emulators locally.

## Supabase project setup (from scratch)

1. **Create a project** at [supabase.com](https://supabase.com/dashboard) —
   note the project's **URL** and **anon/publishable key** (Project
   Settings → API).
2. **Install and authenticate the CLI**:
   ```bash
   supabase login
   ```
3. **Link this repo to your project**:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
4. **Apply the database schema**. All schema, RLS policies, storage bucket
   setup, and the `nearby_listings` PostGIS RPC live in
   `supabase/migrations/` (10 files, applied in order):
   ```bash
   supabase db push
   ```
   PostGIS is enabled by the first migration
   (`20250101000001_extensions_and_profiles.sql`) via `create extension if
   not exists postgis;` — no manual dashboard step needed.
5. **Seed category data**:
   ```bash
   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/seed.sql
   ```
   (or paste the contents of `supabase/seed.sql` into the SQL editor in the
   dashboard). Note: `supabase/seed.sql` intentionally does **not** include
   demo *listings*, since `listings.seller_id` must reference a real
   `auth.users` row — see the comment at the top of that file for how to
   add demo listings after registering a test user through the app.
6. **Configure Auth** in the dashboard (Authentication → Providers /
   URL Configuration):
   - Email provider: decide whether to require email confirmation
     ("Confirm email" toggle) for your environment — the app's
     register/login flows work either way, but with confirmation off,
     users are signed in immediately after registering.
   - Add a **redirect URL** for password reset matching the app's scheme:
     `rebix://reset-password` (see `app.json`'s
     `expo.scheme`), plus the Expo Go / dev-client equivalent if you test
     password reset outside a standalone build.
7. **Deploy the `delete-account` Edge Function** (used for account
   deletion — it needs the service-role key, which must never ship in the
   mobile app, so it runs server-side):
   ```bash
   supabase functions deploy delete-account
   supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role key from Project Settings > API>
   ```
   Full details in `supabase/functions/delete-account/README.md`.

## Local development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your linked project (step 1
   above). `EXPO_PUBLIC_APP_ENV` defaults to `development`. These are
   validated at app startup by `src/config/env.ts` (zod) — the app throws a
   clear error listing what's missing if the `.env` isn't set up correctly.
3. **(Once linked) regenerate types from the live schema**, replacing the
   hand-written types in `src/lib/supabase/types.ts`:
   ```bash
   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
   ```
4. **Run the app**:
   ```bash
   npm start        # Expo dev server — scan the QR code with Expo Go
   npm run ios       # open in the iOS Simulator
   npm run android   # open in an Android emulator
   npm run web       # open in a browser (partial support — this is a mobile-first app)
   ```

## Available scripts

| Script | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Start the dev server and open on Android |
| `npm run ios` | Start the dev server and open on iOS |
| `npm run web` | Start the dev server for web |
| `npm run lint` | Run `expo lint` (ESLint) |
| `npm test` | Run the Jest unit test suite once |
| `npm run test:watch` | Run Jest in watch mode |

## Running tests

```bash
npm test
```

Unit tests live under `tests/unit/`, mirroring the `src/` feature
structure, and use the `jest-expo` preset with
`@testing-library/react-native`. Supabase calls are mocked per-test via
`jest.mock('@/lib/supabase/client')` against the manual mock in
`src/lib/supabase/__mocks__/client.ts`, backed by the chainable
query-builder helper in `tests/utils/supabase-mock.ts` — no test hits a
real network or database. Coverage includes: Zod schema validation (auth,
listing, profile, enquiry forms), price/quantity/distance formatting,
`ListingCard` rendering (title/price/condition/locality, favorite icon
state, status badges), the favorite-toggle mutation's optimistic-update
behavior, `updateListingStatus` for each status transition, `createListing`'s
server-derived `seller_id`, `createEnquiry`'s client-side self-enquiry
rejection, and the extracted `canEnquireOnListing` authorization helper.

`supabase/tests/rls-security-checklist.md` documents 8 RLS/storage security
scenarios (cross-user listing edit/delete, seller_id tampering, enquiry
access, favorites tampering, unauthenticated inserts, sold-listing
exclusion from search, storage upload/delete prefix enforcement) mapped to
the exact policy name and migration file that enforces each one, with a
manual SQL snippet to verify it once a live project exists — these have
**not** been executed against a real database (there isn't one connected to
this repo), so treat that document as a verification checklist, not a test
report.

## Known limitations / what's deferred post-MVP

The following are explicitly out of scope for this MVP and not implemented:

- Community feed / social posting
- Builder/contractor directory
- Payments (all transactions are arranged off-platform between buyer and
  seller; the app only facilitates discovery and the initial enquiry)
- Delivery booking/logistics
- Complex in-app chat (enquiries are one-shot messages with a status
  field, not a threaded conversation — see
  `supabase/migrations/20250101000006_enquiries.sql`, which also has no
  UPDATE/DELETE policy at all for MVP)

Additionally, a few implementation choices were simplified during earlier
phases and are worth knowing about before extending this app:

- **Password-reset deep links are handled best-effort across two Supabase
  Auth flow types** (PKCE `?code=` and legacy implicit `#access_token=`),
  parsed manually in `src/app/(auth)/reset-password.tsx` because
  `detectSessionInUrl` is a web-only Supabase feature and isn't handled
  automatically on native.
- **Image compression relies entirely on `expo-image-picker`'s own
  `quality` option** at capture/selection time — `expo-image-manipulator`
  is not installed, so there's no client-side resize/re-compression before
  upload (see the comment in
  `src/features/listings/services/listing-images-service.ts`).
- **Storage object filenames use a timestamp + random-suffix ID**, not a
  real UUID (`uuid` and `expo-crypto` aren't installed, and RN's global
  `crypto.randomUUID` isn't reliably available across engines/platforms) —
  fine for storage path uniqueness, not intended as a general-purpose ID
  generator.
- **The `listing-images` storage bucket is public** (no signed URLs) —
  intentional for MVP simplicity, since listing photos have no privacy
  expectation in a public marketplace; access control is only enforced on
  *who can upload/delete* under a given `{user_id}/` prefix, not on reads.
- **`nearby_listings` distance is only computed server-side via the
  PostGIS RPC** used by the "Nearby" feed; the listing detail screen does
  not parse the raw `location` column client-side, so it only shows a
  distance when reached from that feed (see the comment in
  `src/app/listing/[id].tsx`).
# home-app
