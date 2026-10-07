import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';
import { listingsQueryKeys } from '@/features/listings/hooks';

import { hasReportedListing, reportListing } from '../services';

/** Whether the current user already reported this listing. Disabled for guests and the listing's owner. */
export function useHasReported(listingId: string | undefined, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...listingsQueryKeys.reported(listingId ?? ''), user?.id],
    queryFn: () => hasReportedListing(listingId as string),
    enabled: !!listingId && !!user && enabled,
  });
}

export function useReportListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: reportListing,
    onSuccess: (result, { listingId }) => {
      // Both a fresh report and "already reported" mean this user has a report on file.
      if (result === 'ok' || result === 'already_reported') {
        queryClient.setQueryData([...listingsQueryKeys.reported(listingId), user?.id], true);
      }
    },
  });
}
