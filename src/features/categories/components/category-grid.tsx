import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { useCategories } from '../hooks';
import type { Category } from '../types';
import { getCategoryIcon, getCategoryImage } from '../utils';

interface CategoryGridProps {
  onSelect?: (category: Category) => void;
  selectedId?: string | null;
  /** Show only this many categories (a selected one outside the range takes the last slot). */
  maxItems?: number;
}

/** Grid of category shortcuts (icon + label) for the home/explore screens. */
export function CategoryGrid({ onSelect, selectedId, maxItems }: CategoryGridProps) {
  const { data: categories, isLoading, isError } = useCategories();

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (isError || !categories || categories.length === 0) {
    return null;
  }

  let visible = categories;
  if (maxItems !== undefined && categories.length > maxItems) {
    visible = categories.slice(0, maxItems);
    const selected = categories.find((c) => c.id === selectedId);
    if (selected && !visible.includes(selected)) {
      visible = [...visible.slice(0, maxItems - 1), selected];
    }
  }

  return (
    <View style={styles.grid}>
      {visible.map((category) => {
        const selected = selectedId === category.id;
        return (
          <Pressable
            key={category.id}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            onPress={() => onSelect?.(category)}>
            {({ pressed }) => (
              <>
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected, pressed && styles.pressed]}>
                  {getCategoryImage(category.slug) ? (
                    <Image
                      source={getCategoryImage(category.slug)}
                      style={styles.iconImage}
                      contentFit="contain"
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <Ionicons
                      name={getCategoryIcon(category.slug)}
                      size={28}
                      color={primary[500]}
                    />
                  )}
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {category.name}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  item: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    padding: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: secondary[400],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapSelected: {
    borderColor: primary[500],
    backgroundColor: primary[50],
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: neutral[600],
  },
});
