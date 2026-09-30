import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { getEnquiriesForMyListings } from '../services';
import { enquiriesQueryKeys } from './query-keys';

/** Enquiries received on listings the current user sells — for the seller inbox. */
export function useSellerEnquiries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: enquiriesQueryKeys.forMyListings,
    queryFn: getEnquiriesForMyListings,
    enabled: !!user,
  });
}
