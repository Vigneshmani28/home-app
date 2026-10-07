import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  /** Show the glass back button in the hero. */
  showBack?: boolean;
  /** Large icon badge in the hero (code / key screens). Without it the app's logo tile is shown. */
  icon?: IconName;
  /** Shorter hero, for long forms. */
  compact?: boolean;
  children: ReactNode;
}

/**
 * Shared frame for every sign-in / sign-up screen: a photo hero with the screen's title, and a rounded
 * sheet that slides up over it holding the form. Scrolls as one piece so the form stays reachable with
 * the keyboard open.
 */
export function AuthScreen({ title, subtitle, showBack, icon, compact, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const heroHeight = (compact ? 200 : 250) + insets.top;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={[styles.hero, { minHeight: heroHeight, paddingTop: insets.top + spacing.sm }]}>
          <Image
            source={require('../../../assets/images/welcome.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
          />
          <LinearGradient
            colors={['rgba(8,25,18,0.55)', 'rgba(8,25,18,0.78)', 'rgba(14,38,28,0.96)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topRow}>
            {showBack ? (
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}
            <View style={styles.brand}>
              <View style={styles.brandTile}>
                <Ionicons name="business" size={16} color={primary[500]} />
              </View>
              <Text style={styles.brandName}>Rebix</Text>
            </View>
          </View>

          <View style={styles.heroText}>
            {icon ? (
              <View style={styles.iconBadge}>
                <Ionicons name={icon} size={26} color="#FFFFFF" />
              </View>
            ) : null}
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.sheet}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: primary[900],
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    // The sheet overlaps the hero by 32px, so keep the text clear of it with room to spare.
    paddingBottom: 60,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  backSpacer: {
    width: 40,
    height: 40,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTile: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  heroText: {
    gap: 6,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: primary[100],
  },
  sheet: {
    flexGrow: 1,
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
