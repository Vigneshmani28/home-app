import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { primary } from '@/theme/colors';
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
}

/** Shared green, rounded-bottom header used by every screen. Handles the top safe-area inset itself. */
export function ScreenHeader({ title, subtitle, showBack, onBack, right, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
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
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: primary[500],
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: primary[100],
  },
  children: {
    marginTop: spacing.md,
  },
});
