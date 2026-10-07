import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { neutral, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SelectFieldProps {
  label: string;
  /** Currently selected text; the placeholder shows while empty. */
  value?: string | null;
  placeholder?: string;
  leftIcon?: IconName;
  error?: string;
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/** A tap-to-choose field that looks like TextField, for values picked from a list or sheet. */
export function SelectField({ label, value, placeholder = 'Select', leftIcon, error, onPress, containerStyle }: SelectFieldProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not selected'}. Tap to change`}
        style={({ pressed }) => [styles.box, !!error && styles.boxError, pressed && styles.pressed]}>
        {leftIcon ? <Ionicons name={leftIcon} size={20} color={neutral[400]} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={neutral[400]} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: neutral[700],
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 54,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: neutral[200],
  },
  boxError: {
    backgroundColor: '#FEF4F4',
    borderColor: semantic.error,
  },
  pressed: {
    opacity: 0.8,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: neutral[900],
  },
  placeholder: {
    color: neutral[400],
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: semantic.error,
  },
});
