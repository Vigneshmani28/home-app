import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteListing } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.all });
    },
  });
}
