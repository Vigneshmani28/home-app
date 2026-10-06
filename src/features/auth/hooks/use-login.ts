import { useMutation } from '@tanstack/react-query';

import { signInWithPassword } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';
import type { LoginFormValues } from '../schemas';

/** Thrown when the credentials are right but the email hasn't been verified yet — the screen offers to enter the code. */
export class EmailNotConfirmedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailNotConfirmedError';
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { data, error } = await signInWithPassword(values);
      if (error) {
        const message = toFriendlyAuthErrorMessage(error);
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          throw new EmailNotConfirmedError(message);
        }
        throw new Error(message);
      }
      return data;
    },
  });
}
