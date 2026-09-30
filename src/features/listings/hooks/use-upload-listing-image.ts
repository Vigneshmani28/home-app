import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteListingImage, uploadListingImage } from '../services';
import { listingsQueryKeys } from './query-keys';

export function useUploadListingImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      listingId,
      localUri,
      displayOrder,
    }: {
      userId: string;
      listingId: string;
      localUri: string;
      displayOrder?: number;
    }) => uploadListingImage(userId, listingId, localUri, { displayOrder }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.detail(variables.listingId) });
    },
  });
}

export function useDeleteListingImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, storagePath }: { imageId: string; storagePath: string; listingId: string }) =>
      deleteListingImage(imageId, storagePath),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: listingsQueryKeys.detail(variables.listingId) });
    },
  });
}
