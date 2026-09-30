import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/services/auth-context';

/**
 * Splash/redirect gate: routes to (tabs) when a session exists, and to
 * (auth)/welcome otherwise. Guests can still browse (tabs) without signing
 * in — this only decides where to land initially.
 */
export default function IndexScreen() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={session ? '/(tabs)' : '/(auth)/welcome'} />;
}
