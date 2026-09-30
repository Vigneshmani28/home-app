import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

import type { Database } from './types';

/**
 * SecureStore-backed storage adapter for supabase-js `Auth` persistence.
 *
 * NOTE: expo-secure-store enforces a 2048 byte limit per value on some
 * platforms (notably Android with the AES encryption backend). Supabase
 * session payloads (access token + refresh token + user metadata) are
 * normally well under this limit, so this is acceptable for MVP. If a
 * session ever exceeds the limit, SecureStore.setItemAsync will reject —
 * we intentionally do not implement chunking here; revisit if this
 * becomes a real issue in Phase 3+.
 */
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
