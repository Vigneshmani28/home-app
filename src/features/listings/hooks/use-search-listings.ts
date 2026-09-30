import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { searchListings } from '../services';
import type { SearchListingsParams } from '../types';
import { listingsQueryKeys } from './query-keys';

interface UseSearchListingsOptions {
  /** `enabled: false` holds the query back (e.g. until the district has been resolved). */
  enabled?: boolean;
  /** Listings per page. Defaults to the service default (20). */
  pageSize?: number;
}

/**
 * Infinite, cursor-paged listing search: `fetchNextPage()` loads the next page when the list
 * reaches its end. Use `refresh()` for pull-to-refresh — it drops back to the first page and
 * reloads only that, instead of re-fetching every page the user had scrolled through.
 */
export function useSearchListings(
  params: Omit<SearchListingsParams, 'cursor' | 'pageSize'>,
  { enabled = true, pageSize }: UseSearchListingsOptions = {},
) {
  const queryClient = useQueryClient();
  const queryKey = listingsQueryKeys.search({ ...params, pageSize });

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => searchListings({ ...params, pageSize, cursor: pageParam }),
    initialPageParam: null as SearchListingsParams['cursor'],
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });

  // Keep the latest key in a ref so `refresh` stays stable without listing a fresh array in its deps.
  const keyRef = useRef(queryKey);
  useEffect(() => {
    keyRef.current = queryKey;
  });

  const { refetch } = query;
  const refresh = useCallback(async () => {
    queryClient.setQueryData<{ pages: unknown[]; pageParams: unknown[] }>(keyRef.current, (data) =>
      data ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) } : data,
    );
    await refetch();
  }, [queryClient, refetch]);

  return { ...query, refresh };
}
