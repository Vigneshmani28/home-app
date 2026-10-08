import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/services/auth-context';
import { hasSeenOnboarding } from '@/features/onboarding/services';

/**
 * Splash/redirect gate: routes to (tabs) when a session exists. Without one, a brand-new install sees the
 * intro screens once, and everyone else lands on the welcome screen. Guests can still browse (tabs)
 * without signing in — this only decides where to land initially.
 */
export default function IndexScreen() {
  const { isLoading, session } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void hasSeenOnboarding().then((seen) => {
      if (active) setSeenOnboarding(seen);
    });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || seenOnboarding === null) {
    return null;
  }

  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href={seenOnboarding ? '/(auth)/welcome' : '/(auth)/onboarding'} />;
}
