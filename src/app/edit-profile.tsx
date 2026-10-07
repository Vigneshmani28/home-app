import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/layout';
import { useAuth } from '@/features/auth/services/auth-context';
import { ProfileForm } from '@/features/profile/components';
import { useUpdateProfile } from '@/features/profile/hooks';
import type { ProfileFormValues } from '@/features/profile/schemas';
import { getErrorMessage } from '@/utils/errors';

export default function EditProfileScreen() {
  const { user, profile, isLoading } = useAuth();
  const updateProfile = useUpdateProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  const initials =
    (profile?.full_name || user.email || '?')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  const onSave = async (values: ProfileFormValues) => {
    setSubmitError(null);
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName,
        phone: values.phone,
        district: values.district,
        locality: values.locality,
        pincode: values.pincode,
        showPhonePublicly: values.showPhonePublicly,
      });
      goBack();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Could not update your profile. Please try again.'));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" subtitle="Keep your details up to date" showBack />
      <ProfileForm
        defaultValues={{
          fullName: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          district: profile?.district ?? '',
          locality: profile?.locality ?? '',
          pincode: profile?.pincode ?? '',
          showPhonePublicly: profile?.show_phone_publicly ?? false,
        }}
        initials={initials}
        email={user.email ?? undefined}
        onSubmit={onSave}
        onCancel={goBack}
        isSubmitting={updateProfile.isPending}
        submitError={submitError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
