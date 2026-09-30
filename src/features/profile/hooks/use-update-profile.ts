import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { updateProfile, type UpdateProfileInput } from '../services';

/**
 * Updates the current user's profile. There's no separate TanStack Query
 * cache for "the profile" to invalidate — AuthProvider (auth-context.tsx)
 * owns that state via plain useState (see the note there on why session
 * state doesn't use TanStack Query). So on success we call
 * `useAuth().refreshProfile()` directly to re-hydrate the context, which is
 * what every screen reads the profile from (via `useAuth().profile`).
 */
export function useUpdateProfile() {
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: async () => {
      await refreshProfile();
    },
  });
}
