import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Modal, Portal } from 'react-native-paper';

import { useBottomSheetInsets } from '@/components/ui/use-bottom-sheet-insets';
import { useCategories } from '@/features/categories/hooks';
import type { Category } from '@/features/categories/types';
import { getCategoryIcon, getCategoryImage } from '@/features/categories/utils';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface CategoryPickerSheetProps {
  visible: boolean;
  selectedId: string | null;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

/** Bottom sheet listing every category, so the form needs only one compact row to choose from. */
export function CategoryPickerSheet({ visible, selectedId, onSelect, onClose }: CategoryPickerSheetProps) {
  const { data: categories, isLoading } = useCategories();
  const sheetInsets = useBottomSheetInsets();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        style={[styles.overlay, sheetInsets.overlay]}
        contentContainerStyle={[styles.sheet, { paddingBottom: sheetInsets.paddingBottom }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>Choose a category</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={neutral[600]} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <FlatList
            data={categories ?? []}
            keyExtractor={(category) => category.id}
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              const image = getCategoryImage(item.slug);
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
                  <View style={styles.iconWrap}>
                    {image ? (
                      <Image source={image} style={styles.iconImage} contentFit="contain" />
                    ) : (
                      <Ionicons name={getCategoryIcon(item.slug)} size={22} color={primary[500]} />
                    )}
                  </View>
                  <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>{item.name}</Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={primary[500]} /> : null}
                </Pressable>
              );
            }}
          />
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '80%',
    justifyContent: 'flex-start',
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
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: neutral[800],
  },
  loader: {
    marginVertical: spacing.lg,
  },
  list: {
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
  },
  rowSelected: {
    backgroundColor: primary[50],
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: secondary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 30,
    height: 30,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: neutral[700],
  },
  rowLabelSelected: {
    color: primary[600],
    fontWeight: '800',
  },
});
