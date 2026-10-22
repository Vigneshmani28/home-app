import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui';
import { DistrictSelector } from '@/features/district/components';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/** Home's top bar on a plain background: the brand wordmark with its tagline, and the district pill. */
export function HomeHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.brand}>
        <BrandLogo height={40} style={styles.logo} />
        <Text style={styles.tagline} numberOfLines={1}>
          Construction Materials Marketplace
        </Text>
      </View>
      <DistrictSelector
        highlightOnLoad
        iconColor={primary[700]}
        ringColor={primary[300]}
        style={styles.pill}
        textStyle={styles.pillText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  brand: {
    flexShrink: 1,
  },
  logo: {
    marginLeft: -4,
  },
  tagline: {
    marginTop: -2,
    fontSize: 11,
    color: neutral[500],
  },
  pill: {
    backgroundColor: primary[50],
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[800],
    maxWidth: 120,
  },
});
