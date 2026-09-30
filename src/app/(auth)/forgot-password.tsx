import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';

import { ScreenHeader } from '@/components/layout';
import { TextField } from '@/components/forms';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useForgotPassword } from '@/features/auth/hooks';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ForgotPasswordScreen() {
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const { mutateAsync, isPending, error } = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Only flip to the success state if the call actually succeeded — never
    // claim success on error.
    await mutateAsync(values);
    setSubmittedSuccessfully(true);
  });

  if (submittedSuccessfully) {
    return (
      <ThemedView style={styles.container}>
      <ScreenHeader title="Check your email" showBack />
        <View style={styles.successContainer}>
          <ThemedText>
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </ThemedText>
          <Button
            mode="contained"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => router.replace('/(auth)/login')}
            style={styles.backButton}>
            Back to Sign In
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Forgot Password" subtitle="We will email you a reset link" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.description}>
          Enter the email associated with your account and we&apos;ll send you a link to reset your
          password.
        </ThemedText>

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

        {error ? (
          <HelperText type="error" visible style={styles.formError}>
            {error.message}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          onPress={onSubmit}
          loading={isPending}
          disabled={isPending}>
          Send Reset Link
        </Button>

        <View style={styles.footer}>
          <Link href="/(auth)/login" style={styles.linkText}>Back to Sign In</Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 15,
    color: neutral[500],
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: primary[500],
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  description: {
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.xs,
  },
  formError: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
