import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { neutral, primary } from '@/theme/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  /** `primary` = solid green, `secondary` = outlined. */
  variant?: 'primary' | 'secondary';
}

/** Full-width, 54px call-to-action button used on the auth screens. */
export function Button({ label, onPress, loading, disabled, icon, variant = 'primary' }: ButtonProps) {
  const inactive = disabled || loading;
  const solid = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        solid ? styles.solid : styles.outline,
        solid && disabled && !loading && styles.solidDisabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={solid ? '#FFFFFF' : primary[500]} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={solid ? '#FFFFFF' : primary[500]} /> : null}
          <Text style={[styles.label, solid ? styles.labelSolid : styles.labelOutline]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
  },
  solid: {
    backgroundColor: primary[500],
    shadowColor: primary[700],
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  solidDisabled: {
    backgroundColor: neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: primary[200],
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelSolid: {
    color: '#FFFFFF',
  },
  labelOutline: {
    color: primary[600],
  },
});
