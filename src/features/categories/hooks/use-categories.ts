import { useQuery } from '@tanstack/react-query';

import { fetchCategories } from '../services';

export const categoriesQueryKey = ['categories'] as const;

/** Categories rarely change, so cache them for a long time. */
export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}
