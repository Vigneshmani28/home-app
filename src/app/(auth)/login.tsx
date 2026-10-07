import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';

import { TextField } from '@/components/forms';
import { AuthScreen } from '@/components/layout';
import { ActionButton } from '@/components/ui';
import { EmailNotConfirmedError, useLogin, useResendSignupCode } from '@/features/auth/hooks';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const { mutateAsync, isPending, error } = useLogin();
  const resendCode = useResendSignupCode();
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutateAsync(values);
    router.replace('/(tabs)');
  });

  // Right password, but the email was never verified: send a fresh code and let them enter it.
  const onVerifyNow = async () => {
    const email = getValues('email');
    try {
      await resendCode.mutateAsync(email);
    } catch {
      // Even if resending fails (e.g. too soon after the last code), the screen lets them use the code they already have.
    }
    router.push({ pathname: '/(auth)/verify-email', params: { email } });
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to continue buying and selling surplus materials" showBack>
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
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            ref={passwordRef}
            label="Password"
            placeholder="Enter your password"
            autoCapitalize="none"
            autoComplete="password"
            secureToggle
            leftIcon="lock-closed-outline"
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
        Forgot password?
      </Link>

      {error ? (
        <HelperText type="error" visible style={styles.formError}>
          {error.message}
        </HelperText>
      ) : null}
      {error instanceof EmailNotConfirmedError ? (
        <Button
          mode="outlined"
          onPress={() => void onVerifyNow()}
          loading={resendCode.isPending}
          disabled={resendCode.isPending}
          style={styles.verifyNow}>
          Enter verification code
        </Button>
      ) : null}

      <ActionButton label="Sign In" onPress={() => void onSubmit()} loading={isPending} />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <ActionButton
        label="Continue as guest"
        variant="secondary"
        icon="eye-outline"
        onPress={() => router.replace('/(tabs)')}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Rebix? </Text>
        <Link href="/(auth)/register" style={styles.linkText}>
          Create account
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: spacing.lg,
    fontSize: 14,
    fontWeight: '700',
    color: primary[500],
  },
  formError: {
    marginBottom: spacing.sm,
  },
  verifyNow: {
    marginBottom: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: secondary[500],
  },
  dividerText: {
    fontSize: 13,
    color: neutral[400],
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xl,
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
});
