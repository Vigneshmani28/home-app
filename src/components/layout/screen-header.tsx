import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back button (calls router.back, or `onBack` when given). */
  showBack?: boolean;
  onBack?: () => void;
  /** Element rendered at the right of the title row. */
  right?: ReactNode;
  /** Extra content under the title (search bar, tabs, filters...). */
  children?: ReactNode;
  /** Space between the title row and `children`. Defaults to `spacing.md`. */
  contentGap?: number;
}

/** Shared plain white header (matches Home) used by every screen, with a hairline divider. Handles the top safe-area inset itself. */
export function ScreenHeader({ title, subtitle, showBack, onBack, right, children, contentGap = spacing.md }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[primary[100], primary[100], '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      {/* <View pointerEvents="none" style={styles.circleLarge} />
      <View pointerEvents="none" style={styles.circleSmall} /> */}
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={neutral[800]} />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children ? <View style={{ marginTop: contentGap }}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: primary[100],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: neutral[100],
  },
  circleLarge: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: primary[200],
    opacity: 0.35,
  },
  circleSmall: {
    position: 'absolute',
    top: 30,
    right: 70,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: primary[300],
    opacity: 0.2,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: primary[700],
  },
  subtitle: {
    marginTop: 1,
    fontSize: 13,
    color: neutral[500],
  },
});
