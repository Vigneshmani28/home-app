import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface PillProps {
  label: string;
  selected?: boolean;
  icon?: IconName;
  onPress?: () => void;
}

/** Rounded selectable pill (optionally with a leading icon) used for filters and categories. */
export function Pill({ label, selected, icon, onPress }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={16} color={selected ? '#FFFFFF' : primary[500]} /> : null}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[500],
  },
  pillSelected: {
    backgroundColor: primary[500],
    borderColor: primary[500],
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: neutral[600],
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
