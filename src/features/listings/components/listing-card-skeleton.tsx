import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { secondary } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

/** Placeholder with the same shape as ListingCard, so the grid doesn't jump when listings arrive. */
export function ListingCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height="100%" radius={0} style={styles.image} />
      <View style={styles.content}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="60%" height={14} style={styles.gapXs} />
        <Skeleton width="45%" height={20} style={styles.gapSm} />
        <Skeleton width="35%" height={12} style={styles.gapXs} />
        <View style={styles.divider} />
        <Skeleton width="80%" height={12} />
        <Skeleton width="50%" height={12} style={styles.gapXs} />
      </View>
    </View>
  );
}

/** Two-column grid of card skeletons, for the lists' loading state. */
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid} accessibilityLabel="Loading listings" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.cell}>
          <ListingCardSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cell: {
    // Two per row with the grid's gap between them.
    width: '48.5%',
    flexGrow: 1,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
    overflow: 'hidden',
  },
  image: {
    // Same 1.15 ratio as the real card's photo.
    aspectRatio: 1.15,
    height: undefined,
  },
  content: {
    padding: 10,
  },
  gapXs: {
    marginTop: 6,
  },
  gapSm: {
    marginTop: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: secondary[500],
    marginVertical: 10,
  },
});
