import { useMutation } from '@tanstack/react-query';

import { signInWithPassword } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';
import type { LoginFormValues } from '../schemas';

export function useLogin() {
  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { data, error } = await signInWithPassword(values);
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      return data;
    },
  });
}
