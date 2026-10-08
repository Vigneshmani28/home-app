import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/theme/spacing';

import type { OnboardingSlideData } from '../slides';

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
  index: number;
  width: number;
  height: number;
  /** Space the screen's fixed header / footer take up, so the slide's content sits between them. */
  topInset: number;
  bottomInset: number;
  scrollX: Animated.Value;
}

/** One intro page: tinted background, headline, short copy, three highlights and the artwork. */
export function OnboardingSlide({ slide, index, width, height, topInset, bottomInset, scrollX }: OnboardingSlideProps) {
  const { theme } = slide;
  const compact = height < 700;

  // The artwork slides a little slower than the page, so it drifts in as you swipe.
  const artShift = scrollX.interpolate({
    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
    outputRange: [width * 0.22, 0, -width * 0.22],
    extrapolate: 'clamp',
  });
  const artOpacity = scrollX.interpolate({
    inputRange: [(index - 0.6) * width, index * width, (index + 0.6) * width],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  // overflow hidden: the corner circles of the NEXT page would otherwise bleed over this page's artwork.
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: theme.blob }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottom, { backgroundColor: theme.blob }]} />

      <View style={[styles.content, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <View style={styles.copy}>
          <Text
            style={[styles.title, compact && styles.titleCompact, { color: theme.title }]}
            accessibilityRole="header">
            {slide.title.map((part, i) => {
              // A highlighted phrase always starts its own line.
              const nextIsHighlight = slide.title[i + 1]?.highlight;
              return (
                <Text key={i} style={part.highlight ? { color: theme.accent } : undefined}>
                  {part.highlight && i > 0 ? '\n' : ''}
                  {nextIsHighlight ? part.text.trimEnd() : part.text}
                </Text>
              );
            })}
          </Text>
          <Text style={[styles.description, compact && styles.descriptionCompact, { color: theme.description }]}>
            {slide.description}
          </Text>

          <View style={styles.highlights}>
            {slide.highlights.map((item) => (
              <View key={item.label} style={styles.highlight}>
                <View style={[styles.chip, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name={item.icon} size={20} color={theme.chipIcon} />
                </View>
                <Text style={[styles.highlightLabel, { color: theme.title }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Animated.View
          style={[styles.art, { opacity: artOpacity, transform: [{ translateX: artShift }] }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Image source={slide.art} style={styles.artImage} contentFit="contain" contentPosition="bottom" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  blobTop: {
    width: 260,
    height: 260,
    right: -110,
    top: -70,
  },
  blobBottom: {
    width: 300,
    height: 300,
    left: -150,
    bottom: 120,
  },
  content: {
    flex: 1,
  },
  copy: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm + 2,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  titleCompact: {
    fontSize: 29,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
  art: {
    flex: 1,
    marginTop: spacing.md,
  },
  artImage: {
    flex: 1,
    width: '100%',
  },
});
