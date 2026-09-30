import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';

import { ScreenHeader } from '@/components/layout';
import { TextField } from '@/components/forms';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResetPassword } from '@/features/auth/hooks';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schemas';
import { supabase } from '@/lib/supabase/client';
import { spacing } from '@/theme/spacing';

/**
 * ASSUMPTIONS / best-effort deep-link handling:
 *
 * Supabase's "reset password" email links back to the app via
 * `getResetPasswordRedirectUrl()` (constructionmarketplace://reset-password).
 * Depending on the project's Auth flow type, the recovery credentials arrive
 * one of two ways:
 *   - PKCE flow (current Supabase default): a `?code=...` query param that
 *     must be exchanged via `supabase.auth.exchangeCodeForSession(code)`.
 *   - Implicit flow (legacy): `access_token`/`refresh_token` in the URL
 *     *fragment* (`#access_token=...&refresh_token=...`), consumed via
 *     `supabase.auth.setSession(...)`.
 *
 * `detectSessionInUrl` is disabled on the client (see src/lib/supabase/client.ts,
 * it's a web-only feature), so neither is handled automatically on native —
 * we parse the incoming URL ourselves below. As a second line of defense we
 * also listen for the `PASSWORD_RECOVERY` auth event, which Supabase fires
 * once a recovery session has been established by either path.
 */
export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const { mutateAsync, isPending, error } = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    let isMounted = true;

    async function establishRecoverySession() {
      try {
        // 1. PKCE flow: ?code= query param (readable via expo-router params).
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) throw exchangeError;
          if (isMounted) setIsRecoveryReady(true);
          return;
        }

        // 2. Implicit flow: tokens may be in the URL fragment, which
        // expo-router's search params don't expose. Parse the raw URL
        // ourselves as a fallback.
        const url = await Linking.getInitialURL();
        if (url) {
          const fragment = url.split('#')[1];
          if (fragment) {
            const fragmentParams = new URLSearchParams(fragment);
            const accessToken = fragmentParams.get('access_token');
            const refreshToken = fragmentParams.get('refresh_token');
            if (accessToken && refreshToken) {
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (setSessionError) throw setSessionError;
              if (isMounted) setIsRecoveryReady(true);
              return;
            }
          }
        }

        // 3. If we already have query-param tokens (some redirect configs
        // put them there instead of the fragment), try those too.
        if (params.access_token && params.refresh_token) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (setSessionError) throw setSessionError;
          if (isMounted) setIsRecoveryReady(true);
        }
      } catch (err) {
        if (isMounted) {
          setLinkError(
            err instanceof Error
              ? err.message
              : 'This password reset link is invalid or has expired. Please request a new one.',
          );
        }
      }
    }

    void establishRecoverySession();

    // Fallback / confirmation: Supabase fires this once a recovery session
    // is active, however it was established.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && isMounted) {
        setIsRecoveryReady(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    await mutateAsync(values);
    router.replace('/(auth)/login');
  });

  if (linkError) {
    return (
      <ThemedView style={styles.container}>
      <ScreenHeader title="Link Expired" />
        <View style={styles.messageContainer}>
          <ThemedText>{linkError}</ThemedText>
          <Button
            mode="contained"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => router.replace('/(auth)/forgot-password')}
            style={styles.button}>
            Request a New Link
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (!isRecoveryReady) {
    return (
      <ThemedView style={styles.container}>
      <ScreenHeader title="Reset Password" subtitle="Choose a new password" />
        <View style={styles.messageContainer}>
          <ThemedText>Verifying your reset link...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Reset Password" subtitle="Choose a new password" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.description}>Enter a new password for your account.</ThemedText>

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

        <Button
          mode="contained"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          onPress={onSubmit}
          loading={isPending}
          disabled={isPending}>
          Update Password
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
});
