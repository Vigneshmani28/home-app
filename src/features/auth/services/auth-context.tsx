import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { queryClient } from '@/lib/query/query-client';
import { supabase } from '@/lib/supabase/client';

import { fetchOwnProfile, signOut as signOutRequest } from './auth-service';
import type { Profile } from '../types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  /** True while the signed-in user's profile row is being fetched (isLoading is already false by then). */
  isProfileLoading: boolean;
  signOut: () => Promise<void>;
  /**
   * Re-fetches the current user's profile row and updates the context.
   * Feature code that mutates the profile (e.g. profile edits) should call
   * this after a successful mutation so the rest of the app (header,
   * listing forms defaulting to the user's district, etc.) reflects the
   * change immediately, instead of waiting for the next auth event.
   */
  refreshProfile: () => Promise<void>;
}

const defaultAuthContextValue: AuthContextValue = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isProfileLoading: false,
  signOut: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue);

// NOTE on state management choice: this context intentionally uses plain
// useState/useEffect rather than TanStack Query. Auth session state is a
// singleton, event-driven stream (supabase.auth.onAuthStateChange) rather
// than a request/response resource — there's nothing to "refetch" or cache
// in the TanStack Query sense, and wiring an external subscription into a
// query would just be a more roundabout useEffect. Feature-level data that
// *is* a good fit for TanStack Query (e.g. profile edits, listings) should
// use useQuery/useMutation in their own hooks, as the auth hooks in this
// feature already do for login/register/etc.
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setIsProfileLoading(true);
    const { data, error } = await fetchOwnProfile(userId);
    if (error) {
      // Not fatal — the user can still use the app without a hydrated
      // profile row (e.g. trigger hasn't finished, or transient network
      // error). Leave profile as null and let feature screens retry.
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }
    setProfile(data);
    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Makes "why was I signed out?" answerable while developing: SIGNED_OUT without the user tapping
      // Sign Out means the refresh token was rejected or removed.
      if (__DEV__ && (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')) console.warn(`[auth] ${event}`);
      setSession(nextSession);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await signOutRequest();
    // Purge any cached user-specific data (favorites, my-listings, etc.)
    // so a subsequent sign-in doesn't briefly show stale data.
    queryClient.clear();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isProfileLoading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
