import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { addFavorite, removeFavorite } from '../services';
import { favoriteIdsQueryKey } from './use-favorite-ids';
import { favoritesQueryKey } from './use-favorites';

export class FavoriteAuthRequiredError extends Error {
  constructor() {
    super('Sign in to save favorites.');
    this.name = 'FavoriteAuthRequiredError';
  }
}

interface ToggleFavoriteVariables {
  listingId: string;
  isFavorited: boolean;
}

/**
 * Optimistically flips the cached favorited state for a listing. Requires
 * auth — if there's no signed-in user, the mutation throws
 * FavoriteAuthRequiredError immediately without calling Supabase; callers
 * should catch this and prompt the user to sign in.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: ToggleFavoriteVariables) => {
      if (!user) throw new FavoriteAuthRequiredError();
      if (isFavorited) {
        await removeFavorite(listingId);
      } else {
        await addFavorite(listingId);
      }
    },
    onMutate: async ({ listingId, isFavorited }) => {
      if (!user) return undefined;

      await queryClient.cancelQueries({ queryKey: favoriteIdsQueryKey });
      const previousIds = queryClient.getQueryData<string[]>(favoriteIdsQueryKey);

      queryClient.setQueryData<string[]>(favoriteIdsQueryKey, (current) => {
        const ids = current ?? [];
        return isFavorited ? ids.filter((id) => id !== listingId) : [...ids, listingId];
      });

      return { previousIds };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteIdsQueryKey, context.previousIds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteIdsQueryKey });
      queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    },
  });
}
