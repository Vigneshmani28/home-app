import { useMutation } from '@tanstack/react-query';

import type { ForgotPasswordFormValues } from '../schemas';
import { resetPasswordForEmail } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      const { error } = await resetPasswordForEmail(values.email);
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      return true;
    },
  });
}
