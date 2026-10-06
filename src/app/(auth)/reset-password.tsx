import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

import { CodeInput, PasswordStrength, TextField } from '@/components/forms';
import { AuthScreen } from '@/components/layout';
import { ActionButton } from '@/components/ui';
import { useForgotPassword, useResetPassword } from '@/features/auth/hooks';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schemas';
import { useCooldown } from '@/hooks/use-cooldown';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const RESEND_SECONDS = 30;

/** Second step of "forgot password": the emailed 6-digit code plus the new password, all on one screen. */
export default function ResetPasswordScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { mutateAsync, isPending, error } = useResetPassword();
  const resend = useForgotPassword();
  const { remaining, start } = useCooldown(RESEND_SECONDS);
  const [resent, setResent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });
  const passwordValue = useWatch({ control, name: 'password' });

  // The code was just emailed when we arrived here, so the resend timer starts straight away.
  useEffect(() => {
    start();
  }, [start]);

  const onSubmit = handleSubmit(async (values) => {
    await mutateAsync({ email, code: values.code, password: values.password });
    // The code check signs the user in, so go straight into the app.
    router.replace('/(tabs)');
  });

  const onResend = async () => {
    setResent(false);
    try {
      await resend.mutateAsync({ email });
      setResent(true);
      start();
    } catch {
      // The error is shown below.
    }
  };

  return (
    <AuthScreen
      title="Set a new password"
      subtitle="Enter the 6-digit code we emailed you, then choose a new password."
      icon="lock-open-outline"
      showBack
      compact>
        <Text style={styles.lead}>
          Code sent to <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.codeWrap}>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, value } }) => (
              <CodeInput value={value} onChange={onChange} autoFocus error={errors.code?.message} />
            )}
          />
        </View>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="New Password"
              placeholder="Enter a new password"
              autoCapitalize="none"
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
              label="Confirm New Password"
              placeholder="Re-enter the new password"
              autoCapitalize="none"
              secureToggle
              leftIcon="lock-closed-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {error ? (
          <HelperText type="error" visible style={styles.formError}>
            {error.message}
          </HelperText>
        ) : null}

        <ActionButton label="Update password" onPress={() => void onSubmit()} loading={isPending} />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn&apos;t get the code?</Text>
          {remaining > 0 ? (
            <Text style={styles.resendWait}>Resend in {remaining}s</Text>
          ) : (
            <Text style={styles.resendLink} onPress={() => void onResend()} accessibilityRole="button">
              {resend.isPending ? 'Sending…' : 'Resend code'}
            </Text>
          )}
        </View>
        {resent ? <Text style={styles.resentNote}>A new code is on its way. Check your inbox and spam folder.</Text> : null}
        {resend.error ? (
          <HelperText type="error" visible>
            {resend.error.message}
          </HelperText>
        ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: neutral[500],
  },
  email: {
    fontWeight: '700',
    color: neutral[800],
  },
  codeWrap: {
    marginVertical: spacing.lg,
  },
  formError: {
    marginBottom: spacing.sm,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  resendText: {
    fontSize: 14,
    color: neutral[500],
  },
  resendWait: {
    fontSize: 14,
    fontWeight: '700',
    color: neutral[300],
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: primary[500],
  },
  resentNote: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 13,
    color: primary[600],
  },
});
