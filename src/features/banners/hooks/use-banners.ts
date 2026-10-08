import { useQuery } from '@tanstack/react-query';

import { fetchBanners } from '../services';

export const bannersQueryKey = ['banners'] as const;

/** Admin-managed Home banners. An error or an empty list means "show the built-in banners". */
export function useBanners() {
  return useQuery({
    queryKey: bannersQueryKey,
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
