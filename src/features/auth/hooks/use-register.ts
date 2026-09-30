import { useMutation } from '@tanstack/react-query';

import { signUp } from '../services/auth-service';
import { toFriendlyAuthErrorMessage } from './error-messages';
import type { RegisterFormValues } from '../schemas';

export function useRegister() {
  return useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const { data, error } = await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        district: values.district,
      });
      if (error) {
        throw new Error(toFriendlyAuthErrorMessage(error));
      }
      // `data.session` is present when email confirmation is disabled
      // (user is signed in immediately); it's null when confirmation is
      // required (user must verify their email before a session exists).
      return data;
    },
  });
}
