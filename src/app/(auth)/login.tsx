import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';

import { ScreenHeader } from '@/components/layout';
import { TextField } from '@/components/forms';
import { ThemedView } from '@/components/themed-view';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const { mutateAsync, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutateAsync(values);
    router.replace('/(tabs)');
  });

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Welcome back" subtitle="Sign in to continue buying and selling" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Password"
              placeholder="Enter your password"
              autoCapitalize="none"
              autoComplete="password"
              secureToggle
              leftIcon="lock-closed-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>Forgot password?</Link>

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
          Sign In
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" style={styles.linkText}>Create one</Link>
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
  field: {
    marginBottom: spacing.xs,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: primary[500],
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
