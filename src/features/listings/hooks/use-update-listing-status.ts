import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ListingStatus } from '@/lib/supabase/types';

import { updateListingStatus } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) => updateListingStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.all });
    },
  });
}
