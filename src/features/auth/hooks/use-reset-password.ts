import { useMutation } from '@tanstack/react-query';

import { updatePassword, verifyRecoveryCode } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';

/**
 * Resets the password in two steps: the 6-digit code from the reset email is verified (which opens a
 * recovery session), then the new password is saved. The user ends up signed in.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (values: { email: string; code: string; password: string }) => {
      const verified = await verifyRecoveryCode({ email: values.email, token: values.code });
      if (verified.error) {
        throw new Error(toFriendlyAuthErrorMessage(verified.error));
      }
      const { error } = await updatePassword(values.password);
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      return true;
    },
  });
}
