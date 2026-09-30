import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/auth-context';

import { createEnquiry, type CreateEnquiryInput } from '../services';
import { enquiriesQueryKeys } from './query-keys';

export class EnquiryAuthRequiredError extends Error {
  constructor() {
    super('Sign in to enquire about this listing.');
    this.name = 'EnquiryAuthRequiredError';
  }
}

/**
 * Sends a buyer enquiry. Requires auth — if there's no signed-in user, the
 * mutation throws EnquiryAuthRequiredError immediately without calling
 * Supabase; callers should catch this and prompt the user to sign in.
 */
export function useCreateEnquiry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEnquiryInput) => {
      if (!user) throw new EnquiryAuthRequiredError();
      return createEnquiry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiriesQueryKeys.mine });
    },
  });
}
