import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { getMyFavorites } from '../services';

export const favoritesQueryKey = ['favorites'] as const;

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: favoritesQueryKey,
    queryFn: getMyFavorites,
    enabled: !!user,
  });
}
