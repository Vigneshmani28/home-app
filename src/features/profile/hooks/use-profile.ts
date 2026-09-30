import { useAuth } from '@/features/auth/services/auth-context';

/**
 * Thin re-export of the profile already hydrated by AuthProvider — avoids
 * duplicating the fetch that auth-context's loadProfile() already performs
 * on session load/change. Prefer this (or `useAuth()` directly) over
 * calling `getMyProfile()` from a new useQuery in screen code.
 */
export function useProfile() {
  const { profile, isLoading } = useAuth();
  return { data: profile, isLoading };
}
