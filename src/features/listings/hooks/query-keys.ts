import type { SearchListingsParams } from '../types';

export const listingsQueryKeys = {
  all: ['listings'] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
  mine: (status?: string) => ['listings', 'mine', status ?? 'all'] as const,
  search: (params: Omit<SearchListingsParams, 'cursor'>) =>
    ['listings', 'search', params] as const,
};
