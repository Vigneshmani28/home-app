import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '@/config/env';

import { secureStorage } from './secure-storage';
import type { Database } from './types';

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      // Keychain / Keystore, split into chunks so a full session always fits (see secure-storage.ts).
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// React Native has no "tab visibility", so tell supabase-js when the app is in the foreground: it refreshes
// the access token while the app is open, and stops the timer while it is in the background. On return it
// refreshes straight away if the token expired in the meantime, instead of the user finding out on the
// first request that fails.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
