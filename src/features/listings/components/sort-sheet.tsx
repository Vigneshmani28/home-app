import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Modal, Portal } from 'react-native-paper';

import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type ListingSort = 'newest' | 'price_asc' | 'price_desc';

export const DEFAULT_LISTING_SORT: ListingSort = 'newest';

const SORT_OPTIONS: { label: string; value: ListingSort }[] = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

interface SortSheetProps {
  visible: boolean;
  onDismiss: () => void;
  value: ListingSort;
  onChange: (value: ListingSort) => void;
}

/** Bottom sheet for choosing how Explore results are sorted. */
export function SortSheet({ visible, onDismiss, value, onChange }: SortSheetProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal} style={styles.overlay}>
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
                style={styles.row}>
                <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? primary[500] : neutral[300]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button mode="outlined" style={styles.footerButton} onPress={() => onChange(DEFAULT_LISTING_SORT)}>
            Reset
          </Button>
          <Button mode="contained" style={styles.footerButton} onPress={onDismiss}>
            Apply
          </Button>
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
    borderRadius: 16,
    backgroundColor: secondary[200],
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  label: {
    fontSize: 15,
    color: neutral[600],
  },
  labelSelected: {
    fontWeight: '700',
    color: primary[500],
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
