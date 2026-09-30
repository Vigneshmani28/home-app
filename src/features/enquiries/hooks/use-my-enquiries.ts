import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { getMyEnquiries } from '../services';
import { enquiriesQueryKeys } from './query-keys';

export function useMyEnquiries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: enquiriesQueryKeys.mine,
    queryFn: getMyEnquiries,
    enabled: !!user,
  });
}
