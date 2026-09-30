import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createListing, type CreateListingInput } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateListingInput) => createListing(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.all });
    },
  });
}
