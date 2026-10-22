import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

import { ActionButton } from '@/components/ui';
import { neutral, primary, secondary } from '@/theme/colors';
import { useBottomSheetInsets } from '@/components/ui/use-bottom-sheet-insets';
import { spacing } from '@/theme/spacing';

export type ListingSort = 'newest' | 'price_asc' | 'price_desc';

export const DEFAULT_LISTING_SORT: ListingSort = 'newest';

const SORT_OPTIONS: { label: string; value: ListingSort; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Newest first', value: 'newest', icon: 'time-outline' },
  { label: 'Price: Low to High', value: 'price_asc', icon: 'arrow-up-outline' },
  { label: 'Price: High to Low', value: 'price_desc', icon: 'arrow-down-outline' },
];

interface SortSheetProps {
  visible: boolean;
  onDismiss: () => void;
  value: ListingSort;
  onChange: (value: ListingSort) => void;
}

/** Bottom sheet for choosing how Explore results are sorted. */
export function SortSheet({ visible, onDismiss, value, onChange }: SortSheetProps) {
  const sheetInsets = useBottomSheetInsets();
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { paddingBottom: sheetInsets.paddingBottom }]}
        style={[styles.overlay, sheetInsets.overlay]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>Sort by</Text>
          <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={neutral[600]} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {SORT_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onChange(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}>
                <View style={[styles.iconTile, selected && styles.iconTileSelected]}>
                  <Ionicons name={option.icon} size={18} color={selected ? '#FFFFFF' : neutral[500]} />
                </View>
                <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={22} color={primary[500]} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => onChange(DEFAULT_LISTING_SORT)}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.reset, pressed && styles.rowPressed]}>
            <Ionicons name="refresh" size={16} color={neutral[600]} />
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <View style={styles.apply}>
            <ActionButton label="Apply" onPress={onDismiss} />
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: secondary[500],
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: neutral[800],
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: secondary[400],
  },
  rowSelected: {
    backgroundColor: primary[50],
    borderColor: primary[200],
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: secondary[300],
  },
  iconTileSelected: {
    backgroundColor: primary[500],
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: neutral[600],
  },
  labelSelected: {
    fontWeight: '700',
    color: primary[700],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: neutral[600],
  },
  apply: {
    flex: 1,
  },
});
