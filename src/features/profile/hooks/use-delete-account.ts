import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/services/auth-context';

import { requestAccountDeletion } from '../services';

/**
 * Deletes the current user's account (via the delete-account Edge
 * Function), then signs out locally and navigates to the welcome screen.
 * The account row + auth user are gone server-side by the time this
 * resolves, so signOut() here is just clearing the now-invalid local
 * session/cache.
 */
export function useDeleteAccount() {
  const { signOut } = useAuth();

  return useMutation({
    mutationFn: () => requestAccountDeletion(),
    onSuccess: async () => {
      await signOut();
      router.replace('/(auth)/welcome');
    },
  });
}
