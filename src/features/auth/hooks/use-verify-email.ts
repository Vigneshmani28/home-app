import { useMutation } from '@tanstack/react-query';

import { resendSignupCode, verifySignupCode } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';

/** Verifies the 6-digit sign-up code. On success Supabase returns a session, so the user is signed in. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (values: { email: string; code: string }) => {
      const { data, error } = await verifySignupCode({ email: values.email, token: values.code });
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      return data;
    },
  });
}

export function useResendSignupCode() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await resendSignupCode(email);
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      return true;
    },
  });
}
