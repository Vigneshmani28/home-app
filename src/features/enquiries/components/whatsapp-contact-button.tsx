import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { normalizeIndianPhone } from '../utils/phone';

interface WhatsAppContactButtonProps {
  /** The listing's contact number, in any common Indian format. */
  phone: string | null | undefined;
  listingTitle: string;
}

/**
 * Green "WhatsApp" button that opens a chat with the seller, pre-filled with a message about the
 * listing. Renders nothing if the number doesn't normalize to a valid Indian mobile number.
 */
export function WhatsAppContactButton({ phone, listingTitle }: WhatsAppContactButtonProps) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return null;

  const onPress = async () => {
    const message = `Hi, I'm interested in your listing "${listingTitle}" on Construction Marketplace.`;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp not available', "We couldn't open WhatsApp on this device.");
    }
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Chat with the seller on WhatsApp"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
      <Text style={styles.label}>WhatsApp</Text>
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
    backgroundColor: '#25D366',
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
