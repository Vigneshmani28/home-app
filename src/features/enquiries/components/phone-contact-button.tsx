import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { primary } from '@/theme/colors';

import { normalizeIndianPhone } from '../utils/phone';

interface PhoneContactButtonProps {
  /** The listing's contact number, in any common Indian format. */
  phone: string | null | undefined;
}

/**
 * "Call" button that opens the device dialer with the seller's number pre-filled. Renders nothing
 * if the number doesn't normalize to a valid Indian mobile number.
 */
export function PhoneContactButton({ phone }: PhoneContactButtonProps) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return null;

  const onPress = async () => {
    // Open the dialer directly. Linking.canOpenURL is unreliable for "tel:" (it returns false on iOS
    // unless the scheme is declared, and on Android 11+ without package visibility), so try and catch instead.
    try {
      await Linking.openURL(`tel:+${normalized}`);
    } catch {
      Alert.alert('Calling not available', `We couldn't open the dialer. Seller number: +${normalized}`);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Call the seller"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="call" size={20} color="#FFFFFF" />
      <Text style={styles.label}>Call</Text>
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
    borderRadius: 16,
    backgroundColor: primary[500],
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
