import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { primary } from '@/theme/colors';

interface SignInToContactButtonProps {
  /** Runs just before navigating to the sign-in screen (e.g. to close a popup first). */
  onBeforeNavigate?: () => void;
}

/** Shown to guests instead of the seller's contact buttons: browsing is open, contact details are for members. */
export function SignInToContactButton({ onBeforeNavigate }: SignInToContactButtonProps) {
  return (
    <Pressable
      onPress={() => {
        onBeforeNavigate?.();
        router.push('/(auth)/login');
      }}
      accessibilityRole="button"
      accessibilityLabel="Sign in to view contact details"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
      <Text style={styles.label}>Sign in to view contact details</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: primary[500],
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
