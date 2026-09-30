import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { getMyFavoriteListingIds } from '../services';

export const favoriteIdsQueryKey = ['favorites', 'ids'] as const;

/** Cheap set of the current user's favorited listing ids, for isFavorited checks. */
export function useFavoriteIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: favoriteIdsQueryKey,
    queryFn: getMyFavoriteListingIds,
    enabled: !!user,
  });
}
