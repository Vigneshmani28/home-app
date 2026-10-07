import type { SearchListingsParams } from '../types';

export const listingsQueryKeys = {
  all: ['listings'] as const,
  // `signedIn` is part of the key because guests and members receive different columns (contact details).
  detail: (id: string, signedIn?: boolean) =>
    signedIn === undefined ? (['listings', 'detail', id] as const) : (['listings', 'detail', id, signedIn] as const),
  reported: (id: string) => ['listings', 'reported', id] as const,
  myViews: ['listings', 'my-views'] as const,
  mine: (status?: string) => ['listings', 'mine', status ?? 'all'] as const,
  search: (params: Omit<SearchListingsParams, 'cursor'> & { signedIn?: boolean }) =>
    ['listings', 'search', params] as const,
};
