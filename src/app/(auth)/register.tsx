import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

import { PasswordStrength, TextField } from '@/components/forms';
import { AuthScreen } from '@/components/layout';
import { ActionButton } from '@/components/ui';
import { useRegister } from '@/features/auth/hooks';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas';
import { DistrictPickerModal } from '@/features/district/components';
import { useDistrict } from '@/features/district/hooks';
import { detectDistrictFromDevice } from '@/features/district/services';
import { isTamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function RegisterScreen() {
  const { mutateAsync, isPending, error } = useRegister();
  const { district: detectedDistrict } = useDistrict();
  const [districtPickerVisible, setDistrictPickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      district: detectedDistrict ?? '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });
  const passwordValue = useWatch({ control, name: 'password' });

  // The app resolves the user's district from their location in the background; if that finishes
  // after this screen opened, pre-fill it — unless they've already chosen one themselves.
  useEffect(() => {
    if (detectedDistrict && !dirtyFields.district) {
      setValue('district', detectedDistrict);
    }
  }, [detectedDistrict, dirtyFields.district, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const data = await mutateAsync(values);
    if (data.session) {
      // Email confirmation disabled on this project: user is signed in
      // immediately, so head straight into the app.
      router.replace('/(tabs)');
    } else {
      // Email confirmation required: no session yet. A 6-digit code was emailed — enter it on the next screen.
      router.replace({ pathname: '/(auth)/verify-email', params: { email: values.email } });
    }
  });

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Join to buy and sell surplus construction materials in your district."
      showBack
      compact>
      <Text style={styles.sectionLabel}>Your details</Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Full Name"
              placeholder="Enter your full name"
              autoComplete="name"
              leftIcon="person-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              leftIcon="mail-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Phone (optional)"
              placeholder="10-digit mobile number"
              autoComplete="tel"
              keyboardType="phone-pad"
              leftIcon="call-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <Text style={styles.sectionLabel}>Your area</Text>
        <Controller
          control={control}
          name="district"
          render={({ field: { value, onChange } }) => (
            <>
              <Pressable onPress={() => setDistrictPickerVisible(true)} accessibilityRole="button">
                <View pointerEvents="none">
                  <TextField
                    label="District"
                    placeholder="Select your district"
                    hint="Used to show you listings in your area"
                    leftIcon="location-outline"
                    editable={false}
                    value={value ?? ''}
                    error={errors.district?.message}
                    right={<Ionicons name="chevron-down" size={20} color={neutral[400]} />}
                  />
                </View>
              </Pressable>
              <DistrictPickerModal
                visible={districtPickerVisible}
                onDismiss={() => setDistrictPickerVisible(false)}
                selected={isTamilNaduDistrict(value) ? value : null}
                title="Your district"
                allowAll={false}
                onSelect={(next) => setValue('district', next ?? '', { shouldDirty: true, shouldValidate: true })}
                onDetectLocation={async () => {
                  const result = await detectDistrictFromDevice();
                  if (result.ok) onChange(result.district);
                  return result;
                }}
              />
            </>
          )}
        />

        <Text style={styles.sectionLabel}>Secure your account</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Password"
              placeholder="Enter your password"
              autoCapitalize="none"
              autoComplete="password-new"
              secureToggle
              leftIcon="lock-closed-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <PasswordStrength password={passwordValue ?? ''} />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Confirm Password"
              placeholder="Re-enter your password"
              autoCapitalize="none"
              autoComplete="password-new"
              secureToggle
              leftIcon="lock-closed-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field: { onChange, value } }) => (
            <Pressable
              style={styles.termsRow}
              onPress={() => onChange(!value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: value }}>
              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Link href="/legal/terms" style={styles.linkText}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy" style={styles.linkText}>
                  Privacy Policy
                </Link>
              </Text>
            </Pressable>
          )}
        />
        <HelperText type="error" visible={!!errors.acceptTerms}>
          {errors.acceptTerms?.message}
        </HelperText>

        {error ? (
          <HelperText type="error" visible style={styles.formError}>
            {error.message}
          </HelperText>
        ) : null}

        <ActionButton label="Create Account" onPress={() => void onSubmit()} loading={isPending} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.linkText}>Sign in</Link>
        </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  footerText: {
    fontSize: 15,
    color: neutral[500],
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: primary[500],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: neutral[300],
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: primary[500],
    borderColor: primary[500],
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: neutral[500],
  },
  formError: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
