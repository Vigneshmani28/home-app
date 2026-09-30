// Global Jest setup, run after the test framework is installed.

// `src/config/env.ts` validates these with zod at import time — anything
// that transitively imports the Supabase client (directly or via a mocked
// module) needs them defined before that import happens.
process.env.EXPO_PUBLIC_SUPABASE_URL ||= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= 'test-publishable-key';
process.env.EXPO_PUBLIC_APP_ENV ||= 'development';
