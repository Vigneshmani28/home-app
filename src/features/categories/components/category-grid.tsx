import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { useCategories } from '../hooks';
import type { Category } from '../types';
import { getCategoryIcon, getCategoryImage } from '../utils';

interface CategoryGridProps {
  onSelect?: (category: Category) => void;
  selectedId?: string | null;
  /**
   * Show only this many categories. The catch-all "Other" category, when there is one, always keeps the
   * last slot; a selected category outside the range takes the slot before it.
   */
  maxItems?: number;
}

const OTHER_SLUG = 'other-materials';

/** Four-column grid of category cards (picture + label) for the home and explore screens. */
export function CategoryGrid({ onSelect, selectedId, maxItems }: CategoryGridProps) {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return <CategoryGridSkeleton count={maxItems ?? 8} />;
  }

  if (isError || !categories || categories.length === 0) {
    return null;
  }

  let visible = categories;
  if (maxItems !== undefined && categories.length > maxItems) {
    const other = categories.find((category) => category.slug === OTHER_SLUG);
    const regular = categories.filter((category) => category !== other);
    visible = other ? [...regular.slice(0, maxItems - 1), other] : regular.slice(0, maxItems);

    const selected = categories.find((category) => category.id === selectedId);
    if (selected && !visible.includes(selected)) {
      const lastRegular = other ? visible.length - 2 : visible.length - 1;
      visible = visible.map((category, index) => (index === lastRegular ? selected : category));
    }
  }

  return (
    <View style={styles.grid}>
      {visible.map((category) => {
        const selected = selectedId === category.id;
        const image = getCategoryImage(category.slug);
        return (
          <View key={category.id} style={styles.cell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={category.name}
              accessibilityState={{ selected }}
              onPress={() => onSelect?.(category)}
              style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && styles.pressed]}>
              <View style={styles.imageBox}>
                {image ? (
                  <Image source={image} style={styles.image} contentFit="contain" accessibilityIgnoresInvertColors />
                ) : (
                  <Ionicons name={getCategoryIcon(category.slug)} size={32} color={primary[500]} />
                )}
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
                {category.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** Placeholder tiles with the same layout as the real grid. */
export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.grid} accessibilityLabel="Loading categories" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.cell}>
          <View style={styles.tile}>
            <Skeleton width={52} height={52} radius={14} />
            <Skeleton width={48} height={10} style={styles.skeletonLabel} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md - 4,
  },
  cell: {
    width: '25%',
    padding: 4,
  },
  // Fixed height (and a fixed two-line label area below), so every card is the same size whether its
  // name takes one line or two.
  tile: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 116,
    paddingHorizontal: 4,
    paddingTop: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: secondary[400],
  },
  tileSelected: {
    backgroundColor: primary[50],
    borderColor: primary[200],
  },
  pressed: {
    opacity: 0.75,
  },
  imageBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    marginTop: 6,
    height: 28,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: neutral[700],
  },
  labelSelected: {
    fontWeight: '800',
    color: primary[800],
  },
  skeletonLabel: {
    marginTop: 12,
  },
});
