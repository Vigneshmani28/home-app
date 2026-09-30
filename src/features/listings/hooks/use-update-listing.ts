import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateListing, type CreateListingInput } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useUpdateListing(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateListingInput>) => updateListing(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.all });
    },
  });
}
