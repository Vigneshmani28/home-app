// Supabase Edge Function: delete-account
//
// Permanently deletes the calling user's account. This MUST run as an Edge
// Function (Deno runtime) rather than in the mobile app, because deleting an
// auth.users row requires the Supabase service-role key, which must never
// ship inside the app bundle (spec section 10G/18). The service-role key
// lives only in this function's server-side environment.
//
// Deploy: supabase functions deploy delete-account
// Required secrets (set via `supabase secrets set`, never committed):
//   SUPABASE_URL               - your project's API URL
//   SUPABASE_SERVICE_ROLE_KEY  - the project's service_role key (Project Settings > API)
// See README.md in this directory for full setup steps.
//
// @ts-nocheck -- this file runs on Deno, not the app's Node/RN toolchain.
// `Deno.serve` and `Deno.env` are Deno globals with no types available under
// the app's tsconfig; see the root tsconfig.json `exclude` entry for
// `supabase/functions/**` which keeps `tsc --noEmit` from trying to type
// this file against the wrong lib set.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Mobile clients (and any browser-based preflight) send an OPTIONS
  // request first; respond with CORS headers and no body.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Admin client: only ever constructed here, server-side, with the
  // service-role key. Used both to verify the caller's JWT and to perform
  // the privileged delete.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(jwt);

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Deletes the auth.users row. `profiles`, `listings`, `favorites`, and
  // `enquiries` all reference the user (directly or transitively) with
  // `on delete cascade` foreign keys, so this cascades through the schema
  // without any further manual cleanup.
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
