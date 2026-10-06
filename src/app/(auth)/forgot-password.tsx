import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

import { TextField } from '@/components/forms';
import { AuthScreen } from '@/components/layout';
import { ActionButton } from '@/components/ui';
import { useForgotPassword } from '@/features/auth/hooks';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ForgotPasswordScreen() {
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
    // Only move on if the code was actually sent — never claim success on error.
    await mutateAsync(values);
    router.push({ pathname: '/(auth)/reset-password', params: { email: values.email } });
  });

  return (
    <AuthScreen
      title="Forgot password?"
      subtitle="No problem. We'll email you a code to set a new one."
      icon="key-outline"
      showBack
      compact>
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
            returnKeyType="send"
            onSubmitEditing={() => void onSubmit()}
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

      <ActionButton label="Send code" icon="paper-plane-outline" onPress={() => void onSubmit()} loading={isPending} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Remembered it? </Text>
        <Link href="/(auth)/login" style={styles.linkText}>
          Back to sign in
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  formError: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
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
