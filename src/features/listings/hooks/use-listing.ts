import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { getListingById } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useListing(id: string | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: listingsQueryKeys.detail(id ?? '', !!session),
    queryFn: () => getListingById(id as string),
    enabled: !!id,
  });
}
