import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingSlide } from '@/features/onboarding/components';
import { markOnboardingSeen } from '@/features/onboarding/services';
import { ONBOARDING_SLIDES, type OnboardingSlideData } from '@/features/onboarding/slides';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 96;
const COUNT = ONBOARDING_SLIDES.length;

const pad = (n: number) => String(n).padStart(2, '0');

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<Animated.FlatList<OnboardingSlideData>>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [index, setIndex] = useState(0);
  const isLast = index === COUNT - 1;

  // 0 = arrow, 1 = tick. The button calmly turns into a tick on the last page, then gives one soft pulse.
  const [done] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const duration = reduceMotion ? 0 : 650;
    const morph = Animated.timing(done, {
      toValue: isLast ? 1 : 0,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    if (!isLast) {
      pulse.setValue(0);
      morph.start();
      return () => morph.stop();
    }
    const sequence = Animated.sequence([
      morph,
      Animated.timing(pulse, {
        toValue: 1,
        duration: reduceMotion ? 0 : 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    pulse.setValue(0);
    sequence.start();
    return () => sequence.stop();
  }, [isLast, reduceMotion, done, pulse]);

  const arrowStyle = {
    opacity: done.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' }),
    transform: [
      { translateX: done.interpolate({ inputRange: [0, 0.6], outputRange: [0, 14], extrapolate: 'clamp' }) },
      { scale: done.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0.5], extrapolate: 'clamp' }) },
    ],
  };
  const tickStyle = {
    opacity: done.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      { scale: done.interpolate({ inputRange: [0.4, 1], outputRange: [0.3, 1], extrapolate: 'clamp' }) },
      { rotate: done.interpolate({ inputRange: [0.4, 1], outputRange: ['-90deg', '0deg'], extrapolate: 'clamp' }) },
    ],
  };
  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
  };
  const theme = ONBOARDING_SLIDES[index].theme;

  // Follow the swipe so the button / progress change colour as the next page takes over, not after it lands.
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const page = Math.min(COUNT - 1, Math.max(0, Math.round(value / width)));
      setIndex((current) => (current === page ? current : page));
    });
    return () => scrollX.removeListener(id);
  }, [scrollX, width]);

  const finish = async () => {
    // Saved before leaving so it can never be shown twice; a failed save is harmless (see the storage file).
    await markOnboardingSeen();
    router.replace('/(auth)/welcome');
  };

  const onBack = () => {
    if (index > 0) listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  };

  const onNext = () => {
    if (isLast) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(slide) => slide.id}
        renderItem={({ item, index: i }) => (
          <OnboardingSlide
            slide={item}
            index={i}
            width={width}
            height={height}
            topInset={insets.top + HEADER_HEIGHT}
            bottomInset={insets.bottom + FOOTER_HEIGHT}
            scrollX={scrollX}
          />
        )}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={StyleSheet.absoluteFill}
      />

      {/* Fixed header: brand + skip */}
      <View style={[styles.header, { top: insets.top }]} pointerEvents="box-none">
        <View accessible accessibilityRole="header" accessibilityLabel="Rebix, buy sell reuse">
          <Text style={styles.logo}>Rebix</Text>
          <Text style={styles.tagline}>BUY • SELL • REUSE</Text>
        </View>
        <Pressable
          onPress={() => void finish()}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          hitSlop={14}
          style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Fixed footer: page count, progress, next */}
      <View style={[styles.footer, { bottom: insets.bottom + spacing.md }]} pointerEvents="box-none">
        <Text style={styles.counter} numberOfLines={1} accessibilityLabel={`Page ${index + 1} of ${COUNT}`}>
          {pad(index + 1)} / {pad(COUNT)}
        </Text>

        <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {ONBOARDING_SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[styles.segment, { backgroundColor: i === index ? theme.button : theme.track }]}
            />
          ))}
        </View>

        {/* Back sits right beside Next (not on the far left), so both are reachable with the thumb. */}
        {index > 0 && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Previous"
            style={({ pressed }) => [styles.back, { borderColor: theme.button }, pressed && styles.nextPressed]}>
            <Ionicons name="arrow-back" size={24} color={theme.button} />
          </Pressable>
        )}

        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next'}
          style={({ pressed }) => [
            styles.next,
            { backgroundColor: theme.button, shadowColor: theme.button },
            pressed && styles.nextPressed,
          ]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, { backgroundColor: theme.button }, ringStyle]}
          />
          <Animated.View style={[styles.icon, arrowStyle]}>
            <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
          </Animated.View>
          <Animated.View style={[styles.icon, tickStyle]}>
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  logo: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: primary[700],
  },
  tagline: {
    marginTop: -2,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: neutral[500],
  },
  skip: {
    paddingTop: 14,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: neutral[700],
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: FOOTER_HEIGHT - spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  counter: {
    // Never wraps or shrinks: "01 / 03" always stays on one line.
    flexShrink: 0,
    minWidth: 58,
    fontSize: 14,
    fontWeight: '500',
    color: neutral[500],
    fontVariant: ['tabular-nums'],
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  icon: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  back: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.xs,
  },
  next: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nextPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
