import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/services/auth-context';

import { getMyListingViewCounts, recordListingView } from '../services';
import { listingsQueryKeys } from './query-keys';

/** Counts a view once the listing has loaded. Skips the seller's own listing and non-active ones. */
export function useRecordListingView(listing: { id: string; seller_id: string; status: string } | null | undefined) {
  const { user, isLoading } = useAuth();
  const listingId = listing?.id;
  const isOwner = !!user && listing?.seller_id === user.id;
  const isActive = listing?.status === 'active';

  useEffect(() => {
    // Wait for auth so a signed-in user isn't first counted as an anonymous device.
    if (isLoading || !listingId || isOwner || !isActive) return;
    void recordListingView(listingId);
  }, [isLoading, listingId, isOwner, isActive]);
}

/** Unique-view counts for the signed-in user's listings, keyed by listing id. */
export function useMyListingViewCounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: listingsQueryKeys.myViews,
    queryFn: getMyListingViewCounts,
    enabled: !!user,
  });
}
