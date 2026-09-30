import { useQuery } from '@tanstack/react-query';

import { getListingById } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingsQueryKeys.detail(id ?? ''),
    queryFn: () => getListingById(id as string),
    enabled: !!id,
  });
}
