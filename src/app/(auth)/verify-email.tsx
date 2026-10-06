import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

import { CodeInput } from '@/components/forms';
import { AuthScreen } from '@/components/layout';
import { ActionButton } from '@/components/ui';
import { useResendSignupCode, useVerifyEmail } from '@/features/auth/hooks';
import { useCooldown } from '@/hooks/use-cooldown';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const RESEND_SECONDS = 30;

/** Second step of sign-up: enter the 6-digit code emailed to the new account. */
export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const verify = useVerifyEmail();
  const resend = useResendSignupCode();
  const { remaining, start } = useCooldown(RESEND_SECONDS);
  const [resent, setResent] = useState(false);

  // A code was just emailed when we arrived here (sign-up), so the resend timer starts straight away.
  useEffect(() => {
    start();
  }, [start]);

  const onVerify = async (value: string) => {
    if (value.length !== 6 || verify.isPending) return;
    try {
      await verify.mutateAsync({ email, code: value });
      router.replace('/(tabs)');
    } catch {
      // The error is shown under the code boxes.
    }
  };

  const onChange = (value: string) => {
    setCode(value);
    verify.reset();
    // Verify automatically as soon as the last digit is in.
    if (value.length === 6) void onVerify(value);
  };

  const onResend = async () => {
    setResent(false);
    try {
      await resend.mutateAsync(email);
      setResent(true);
      start();
    } catch {
      // The error is shown below.
    }
  };

  return (
    <AuthScreen
      title="Check your email"
      subtitle="Enter the 6-digit code to finish creating your account."
      icon="mail-unread-outline"
      showBack
      compact>
      <Text style={styles.lead}>
        We sent a code to <Text style={styles.email}>{email}</Text>
      </Text>

      <View style={styles.codeWrap}>
        <CodeInput value={code} onChange={onChange} autoFocus error={verify.error?.message} />
      </View>

      <ActionButton
        label="Verify and continue"
        onPress={() => void onVerify(code)}
        loading={verify.isPending}
        disabled={code.length !== 6}
      />

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn&apos;t get it?</Text>
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

      <Text style={styles.wrongEmail} onPress={() => router.back()} accessibilityRole="button">
        Wrong email? Go back
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 15,
    color: neutral[500],
  },
  email: {
    fontWeight: '700',
    color: neutral[800],
  },
  codeWrap: {
    marginVertical: spacing.lg,
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
  wrongEmail: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: neutral[400],
  },
});
