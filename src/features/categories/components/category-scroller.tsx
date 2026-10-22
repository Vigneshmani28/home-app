import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { useCategories } from '../hooks';
import type { Category } from '../types';
import { getCategoryIcon, getCategoryImage } from '../utils';

interface CategoryScrollerProps {
  onSelect?: (category: Category) => void;
  /** Called by the trailing "View all" tile. */
  onViewAll: () => void;
  /** How many categories to show before the "View all" tile. */
  maxItems?: number;
}

const TILE_WIDTH = 92;

/** Horizontally scrolling row of category cards that ends with a "View all" tile (home screen). */
export function CategoryScroller({ onSelect, onViewAll, maxItems = 8 }: CategoryScrollerProps) {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={styles.tile}>
            <Skeleton width={56} height={56} radius={14} />
            <Skeleton width={52} height={10} style={styles.skeletonLabel} />
          </View>
        ))}
      </ScrollView>
    );
  }

  if (isError || !categories || categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityLabel="Categories">
      {categories.slice(0, maxItems).map((category) => {
        const image = getCategoryImage(category.slug);
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            onPress={() => onSelect?.(category)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={styles.imageBox}>
              {image ? (
                <Image source={image} style={styles.image} contentFit="contain" accessibilityIgnoresInvertColors />
              ) : (
                <Ionicons name={getCategoryIcon(category.slug)} size={32} color={primary[500]} />
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {category.name}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View all categories"
        onPress={onViewAll}
        style={({ pressed }) => [styles.tile, styles.viewAllTile, pressed && styles.pressed]}>
        <View style={styles.viewAllCircle}>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.viewAllLabel}>View all</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  // Fixed size (and a fixed two-line label area), so every card matches whether its name takes one line or two.
  tile: {
    width: TILE_WIDTH,
    height: 118,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: secondary[400],
  },
  viewAllTile: {
    justifyContent: 'center',
    paddingTop: 0,
    backgroundColor: primary[50],
    borderColor: primary[100],
  },
  viewAllCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[500],
  },
  viewAllLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: primary[700],
  },
  pressed: {
    opacity: 0.75,
  },
  imageBox: {
    width: 58,
    height: 58,
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
  skeletonLabel: {
    marginTop: 12,
  },
});
