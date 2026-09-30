import { useCallback } from 'react';

import { useAuth } from '@/features/auth/services/auth-context';

import { useUpdateProfile } from './use-update-profile';

/**
 * Returns a function that copies `phone` onto the signed-in user's profile — but only when the
 * profile doesn't have a phone number yet. Used by the sell form: a seller's first contact number
 * becomes their profile number, while a different number typed for a later listing stays on that
 * listing and never overwrites the saved profile number.
 *
 * Never throws: the listing is already saved by the time this runs, so a failure here is non-fatal.
 */
export function useSavePhoneIfMissing() {
  const { profile } = useAuth();
  const { mutateAsync } = useUpdateProfile();

  return useCallback(
    async (phone: string) => {
      if (!profile || profile.phone) return;
      try {
        await mutateAsync({
          fullName: profile.full_name,
          phone,
          district: profile.district,
          locality: profile.locality,
          pincode: profile.pincode,
          showPhonePublicly: profile.show_phone_publicly,
        });
      } catch {
        // Non-fatal — they can add it from Profile → Edit later.
      }
    },
    [profile, mutateAsync],
  );
}
