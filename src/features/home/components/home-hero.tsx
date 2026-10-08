import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { useBanners } from '@/features/banners/hooks';
import type { BannerTheme, RemoteBanner } from '@/features/banners/types';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface HomeHeroProps {
  onExplore: () => void;
  onSell: () => void;
  onCategory: (categoryId: string) => void;
}

interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  action: 'explore' | 'sell';
  colors: { bg: string; circle: string; eyebrow: string; title: string; subtitle: string; cta: string; ctaText: string };
  /** Three pictures: top-right, middle, bottom-right. */
  art: [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];
}

const ART = {
  cement: require('../../../../assets/categories/cement.webp'),
  bricks: require('../../../../assets/categories/bricks.webp'),
  steel: require('../../../../assets/categories/steels.webp'),
  tiles: require('../../../../assets/categories/tiles.webp'),
  paint: require('../../../../assets/categories/painting.webp'),
  tools: require('../../../../assets/categories/tools.webp'),
  electrical: require('../../../../assets/categories/electrical.webp'),
  plumbing: require('../../../../assets/categories/plumbing.webp'),
  door: require('../../../../assets/categories/door.webp'),
  roofing: require('../../../../assets/categories/roofing.webp'),
} as const;

/** Built-in banners: shown while the admin has none active, when the request fails, or when offline. */
const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'explore',
    eyebrow: 'BUY • SELL • REUSE',
    title: 'Surplus Materials\nFind New Homes',
    subtitle: 'Save money • Reduce waste • Build a greener tomorrow',
    cta: 'Start Exploring',
    action: 'explore',
    colors: {
      bg: primary[50],
      circle: primary[100],
      eyebrow: primary[600],
      title: neutral[900],
      subtitle: neutral[600],
      cta: primary[800],
      ctaText: '#FFFFFF',
    },
    art: [ART.cement, ART.bricks, ART.steel],
  },
  {
    id: 'sell',
    eyebrow: 'GOT LEFTOVERS?',
    title: 'Turn Extra Materials\ninto Cash',
    subtitle: 'List what is left from your project in minutes, for free',
    cta: 'Post a Listing',
    action: 'sell',
    colors: {
      bg: '#FFF4E6',
      circle: '#FDE3C4',
      eyebrow: '#B45F18',
      title: neutral[900],
      subtitle: neutral[600],
      cta: '#C4661B',
      ctaText: '#FFFFFF',
    },
    art: [ART.tiles, ART.paint, ART.tools],
  },
  {
    id: 'nearby',
    eyebrow: 'IN YOUR DISTRICT',
    title: 'Find Materials\nClose to You',
    subtitle: 'Pick up nearby and skip the delivery wait',
    cta: 'Browse Listings',
    action: 'explore',
    colors: {
      bg: primary[800],
      circle: primary[700],
      eyebrow: primary[200],
      title: '#FFFFFF',
      subtitle: primary[100],
      cta: '#FFFFFF',
      ctaText: primary[800],
    },
    art: [ART.electrical, ART.plumbing, ART.door],
  },
  {
    id: 'reuse',
    eyebrow: 'GO GREEN',
    title: 'Reuse More,\nWaste Less',
    subtitle: 'Good materials deserve a second job site',
    cta: 'See What\'s New',
    action: 'explore',
    colors: {
      bg: '#E7F3F8',
      circle: '#CCE6F0',
      eyebrow: '#08678A',
      title: neutral[900],
      subtitle: neutral[600],
      cta: '#08678A',
      ctaText: '#FFFFFF',
    },
    art: [ART.roofing, ART.bricks, ART.cement],
  },
];

const AUTO_ADVANCE_MS = 5000;
const TOTAL_SLIDES = 4;
/** Every banner (built-in or admin-made) is exactly this tall, so the carousel never jumps between slides. */
const CARD_HEIGHT = 208;

/**
 * Auto-advancing, swipeable promo banners at the top of Home. Shows the banners the admin manages
 * (Supabase), topped up with the built-in ones so there are always four, and only the built-in ones if the request fails. The auto-advance
 * waits while the finger is down, restarts its timer after every swipe or tap, pauses when Home isn't the
 * visible tab, and is off when the phone's "Reduce Motion" setting is on.
 */
export function HomeHero({ onExplore, onSell, onCategory }: HomeHeroProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const banners = useBanners();
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Home always shows TOTAL_SLIDES banners: the admin's first, then built-in ones fill the rest.
  const remote = (banners.data ?? []).slice(0, TOTAL_SLIDES);
  const defaults = DEFAULT_BANNERS.slice(0, TOTAL_SLIDES - remote.length);
  const slides: { id: string }[] = [...remote, ...defaults];
  const count = slides.length;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // The slide set can change under us (fallback -> live banners, or the admin removed one): start over.
  const slideKey = slides.map((slide) => slide.id).join('|');
  const [shownKey, setShownKey] = useState(slideKey);
  if (shownKey !== slideKey) {
    setShownKey(slideKey);
    setIndex(0);
  }
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slideKey]);

  // One timer per page: any index change (auto, swipe) restarts the countdown.
  useEffect(() => {
    if (count < 2 || dragging || !focused || reduceMotion) return;
    const timer = setTimeout(() => {
      const next = (index + 1) % count;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, count, dragging, focused, reduceMotion, width]);

  const onSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setDragging(false);
    const settled = Math.round(event.nativeEvent.contentOffset.x / width);
    if (settled >= 0 && settled < count) setIndex(settled);
  };

  // First load only: a placeholder the size of a banner, so Home doesn't flash the defaults and then swap.
  if (banners.isPending) {
    return (
      <View accessibilityLabel="Loading promotions">
        <View style={styles.placeholder} />
      </View>
    );
  }

  const openLink = (url: string) => {
    // Opens the phone's own browser. A bad or unsupported link does nothing instead of crashing.
    Linking.openURL(url).catch(() => undefined);
  };

  const onPressRemote = (banner: RemoteBanner) => {
    switch (banner.action.type) {
      case 'explore':
        return onExplore();
      case 'sell':
        return onSell();
      case 'category':
        return onCategory(banner.action.categoryId);
      case 'link':
        return openLink(banner.action.url);
      case 'none':
        return undefined;
    }
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        bounces={false}
        scrollEnabled={count > 1}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setDragging(true)}
        onScrollEndDrag={(event) => {
          // A drag that doesn't turn into a momentum scroll (released exactly on a page) ends here.
          if (event.nativeEvent.velocity?.x === 0) onSettled(event);
        }}
        onMomentumScrollEnd={onSettled}
        accessibilityRole="adjustable"
        accessibilityLabel="Promotions">
        {remote.map((banner) => (
          <View key={banner.id} style={{ width }}>
            <RemoteBannerCard banner={banner} onPress={() => onPressRemote(banner)} />
          </View>
        ))}
        {defaults.map((banner) => (
          <View key={banner.id} style={{ width }}>
            <BannerCard banner={banner} onPress={banner.action === 'sell' ? onSell : onExplore} />
          </View>
        ))}
      </ScrollView>

      {count > 1 && (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {slides.map((slide, i) => (
            <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const THEMES: Record<BannerTheme, Banner['colors']> = {
  green: {
    bg: primary[50],
    circle: primary[100],
    eyebrow: primary[600],
    title: neutral[900],
    subtitle: neutral[600],
    cta: primary[800],
    ctaText: '#FFFFFF',
  },
  orange: {
    bg: '#FFF4E6',
    circle: '#FDE3C4',
    eyebrow: '#B45F18',
    title: neutral[900],
    subtitle: neutral[600],
    cta: '#C4661B',
    ctaText: '#FFFFFF',
  },
  dark: {
    bg: primary[800],
    circle: primary[700],
    eyebrow: primary[200],
    title: '#FFFFFF',
    subtitle: primary[100],
    cta: '#FFFFFF',
    ctaText: primary[800],
  },
  blue: {
    bg: '#E7F3F8',
    circle: '#CCE6F0',
    eyebrow: '#08678A',
    title: neutral[900],
    subtitle: neutral[600],
    cta: '#08678A',
    ctaText: '#FFFFFF',
  },
};

/**
 * An admin-managed banner, drawn like the built-in ones: coloured card (admin picks the theme), title,
 * subtitle and button on the left, the uploaded transparent picture on the right. If the picture can't be
 * loaded the card simply shows without it.
 */
function RemoteBannerCard({ banner, onPress }: { banner: RemoteBanner; onPress: () => void }) {
  const colors = THEMES[banner.theme] ?? THEMES.green;
  const tappable = banner.action.type !== 'none';

  return (
    <Pressable
      disabled={!tappable}
      onPress={onPress}
      accessibilityRole={tappable ? 'button' : 'image'}
      accessibilityLabel={[banner.title, banner.subtitle].filter(Boolean).join('. ')}
      accessibilityHint={tappable ? banner.buttonText : undefined}
      style={[styles.card, { backgroundColor: colors.bg }]}>
      <View style={[styles.circle, { backgroundColor: colors.circle }]} pointerEvents="none" />

      <View style={styles.remoteArt} pointerEvents="none">
        <Image
          source={{ uri: banner.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          contentPosition="right center"
          transition={150}
          cachePolicy="disk"
        />
      </View>

      <View style={styles.text}>
        {banner.eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.eyebrow }]} numberOfLines={1}>
            {banner.eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.title }]} numberOfLines={2}>
          {banner.title}
        </Text>
        {banner.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.subtitle }]} numberOfLines={2}>
            {banner.subtitle}
          </Text>
        ) : null}
        {tappable ? (
          <View style={[styles.cta, { backgroundColor: colors.cta }]}>
            <Text style={[styles.ctaLabel, { color: colors.ctaText }]} numberOfLines={1}>
              {banner.buttonText}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.ctaText} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function BannerCard({ banner, onPress }: { banner: Banner; onPress: () => void }) {
  const { colors } = banner;
  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <View style={[styles.circle, { backgroundColor: colors.circle }]} pointerEvents="none" />

      <View style={styles.art} pointerEvents="none">
        <Image source={banner.art[0]} style={styles.artTop} contentFit="contain" />
        <Image source={banner.art[1]} style={styles.artMiddle} contentFit="contain" />
        <Image source={banner.art[2]} style={styles.artBottom} contentFit="contain" />
      </View>

      <View style={styles.text}>
        <Text style={[styles.eyebrow, { color: colors.eyebrow }]}>{banner.eyebrow}</Text>
        <Text style={[styles.title, { color: colors.title }]} numberOfLines={2}>
          {banner.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtitle }]} numberOfLines={2}>
          {banner.subtitle}
        </Text>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={banner.cta}
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.cta }, pressed && styles.pressed]}>
          <Text style={[styles.ctaLabel, { color: colors.ctaText }]}>{banner.cta}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.ctaText} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    marginHorizontal: spacing.md,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: neutral[100],
  },
  remoteArt: {
    position: 'absolute',
    right: 10,
    top: 12,
    bottom: 12,
    width: '40%',
  },
  card: {
    marginHorizontal: spacing.md,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.7,
  },
  art: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '46%',
  },
  artTop: {
    position: 'absolute',
    right: 4,
    top: 22,
    width: 78,
    height: 78,
  },
  artMiddle: {
    position: 'absolute',
    right: 52,
    top: 36,
    width: 92,
    height: 92,
  },
  artBottom: {
    position: 'absolute',
    right: 6,
    bottom: 12,
    width: 112,
    height: 76,
  },
  text: {
    // Leaves the right ~40% for the artwork.
    width: '62%',
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 999,
  },
  ctaLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: neutral[200],
  },
  dotActive: {
    width: 18,
    backgroundColor: primary[500],
  },
});
