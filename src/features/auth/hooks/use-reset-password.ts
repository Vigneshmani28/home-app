import { useMutation } from '@tanstack/react-query';

import { updatePassword } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';
import type { ResetPasswordFormValues } from '../schemas';

export function useResetPassword() {
  return useMutation({
    mutationFn: async (values: ResetPasswordFormValues) => {
      const { error } = await updatePassword(values.password);
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      return true;
    },
  });
}
