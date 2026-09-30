import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';
import type { ListingStatus } from '@/lib/supabase/types';

import { getMyListings } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useMyListings(status?: ListingStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: listingsQueryKeys.mine(status),
    queryFn: () => getMyListings(status),
    enabled: !!user,
  });
}
