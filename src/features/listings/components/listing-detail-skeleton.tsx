import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/feedback';
import { secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Loading placeholder that mirrors the listing detail layout, so the screen doesn't jump when data arrives. */
export function ListingDetailSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} accessibilityLabel="Loading listing" accessibilityRole="progressbar">
      <View>
        <Skeleton width={SCREEN_WIDTH} height={SCREEN_WIDTH} radius={0} />
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <Skeleton width={40} height={40} radius={20} style={styles.onImage} />
          <Skeleton width={40} height={40} radius={20} style={styles.onImage} />
        </View>
      </View>

      <View style={styles.sheet}>
        <Skeleton width={96} height={24} radius={999} />
        <Skeleton width="85%" height={26} style={styles.gapLg} />
        <Skeleton width="55%" height={26} style={styles.gapSm} />
        <Skeleton width={150} height={32} style={styles.gapLg} />
        <Skeleton width={190} height={14} style={styles.gapSm} />
        <Skeleton width={170} height={16} style={styles.gapLg} />

        <View style={styles.chips}>
          <Skeleton width={140} height={34} radius={999} />
          <Skeleton width={140} height={34} radius={999} />
        </View>

        <Skeleton width={90} height={18} style={styles.gapXl} />
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="48%" height={58} radius={14} />
          ))}
        </View>

        <Skeleton width={110} height={18} style={styles.gapXl} />
        <Skeleton height={14} style={styles.gapSm} />
        <Skeleton height={14} style={styles.gapSm} />
        <Skeleton width="70%" height={14} style={styles.gapSm} />
      </View>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Skeleton height={52} radius={14} style={styles.action} />
        <Skeleton width={52} height={52} radius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: secondary[200],
  },
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onImage: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: secondary[200],
    padding: spacing.lg,
  },
  gapSm: { marginTop: spacing.sm },
  gapLg: { marginTop: spacing.md },
  gapXl: { marginTop: spacing.lg },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  action: {
    flex: 1,
  },
});
