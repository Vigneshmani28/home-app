import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { neutral } from '@/theme/colors';

import { useDistrict } from '../hooks';
import { hasSeenLocationTip, markLocationTipSeen } from '../services';
import { DistrictPickerModal } from './district-picker-modal';

interface DistrictSelectorProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  /**
   * Draws the eye to the pill once the district is known: on every app launch, and again if the district
   * changes by itself (e.g. location detection) — never when the user picked it. The very first time ever
   * it is a dimmed spotlight with a tip (like onboarding); after that, a double pulse. Home only.
   */
  highlightOnLoad?: boolean;
  /** Colour of the spotlight glow and callout border; the default (white) suits any dim backdrop. */
  ringColor?: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Wait for the splash and the first content to settle so the effect is actually seen, not missed.
const HIGHLIGHT_DELAY_MS = 900;
// How long the spotlight stays before dismissing itself (a tap anywhere dismisses it sooner).
const SPOTLIGHT_VISIBLE_MS = 4500;

/** The district last highlighted this session ('' = none yet). Module-level so remounts don't replay it. */
let lastHighlightedKey: string | null = null;

/**
 * The app-wide district selector: shows the resolved district (or "All Tamil Nadu") and opens a
 * picker to change it. The value is shared app state, so every screen showing this stays in sync.
 */
export function DistrictSelector({ style, textStyle, iconColor = '#FFFFFF', highlightOnLoad, ringColor }: DistrictSelectorProps) {
  const { district, source, status, isResolving, selectDistrict, detectFromLocation } = useDistrict();
  const { width: windowWidth } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const pillRef = useRef<View>(null);
  // Only opacity and transform are animated, so it runs on the native thread and stays smooth on any phone.
  const [intro] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  // Drives the plain double pulse used on every launch after the first.
  const [ping] = useState(() => new Animated.Value(0));
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hideSpotlight = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(intro, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    // Unmount on a plain timer rather than the animation callback, so it can never get stuck on screen.
    setTimeout(() => setSpotlight(null), 240);
  }, [intro]);

  useFocusEffect(
    useCallback(() => {
      if (!highlightOnLoad || status !== 'resolved') return;
      const key = district ?? 'all';
      if (key === lastHighlightedKey) return;
      const isFirst = lastHighlightedKey === null;
      const chosenByUser = source === 'manual' || source === 'all';
      // The user's own picks need no highlighting; the first one of the session (even a restored pick) does.
      if (!isFirst && chosenByUser) {
        lastHighlightedKey = key;
        return;
      }

      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let loop: Animated.CompositeAnimation | undefined;
      let doublePulse: Animated.CompositeAnimation | undefined;

      void Promise.all([AccessibilityInfo.isReduceMotionEnabled(), hasSeenLocationTip()]).then(([reduceMotion, seenTip]) => {
        if (cancelled) return;
        timer = setTimeout(() => {
          if (seenTip) {
            // Only counts as shown once it actually starts, so leaving the screen early doesn't waste it.
            lastHighlightedKey = key;
            if (reduceMotion) return;
            ping.setValue(0);
            const once = Animated.timing(ping, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true });
            const reset = Animated.timing(ping, { toValue: 0, duration: 0, useNativeDriver: true });
            doublePulse = Animated.sequence([once, Animated.delay(150), reset, once]);
            doublePulse.start();
            return;
          }
          pillRef.current?.measureInWindow((x, y, width, height) => {
            if (cancelled || width === 0) return;
            // Only counts as shown once it actually appears, so leaving the screen early doesn't waste it.
            lastHighlightedKey = key;
            void markLocationTipSeen();
            intro.setValue(0);
            pulse.setValue(0);
            // On Android the window measures from below the status bar, but the overlay (statusBarTranslucent)
            // starts at the very top of the screen, so shift down by the status bar height to line up.
            const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
            setSpotlight({ x, y: y + statusBarOffset, width, height });
            Animated.timing(intro, {
              toValue: 1,
              duration: reduceMotion ? 0 : 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
            if (!reduceMotion) {
              loop = Animated.loop(
                Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              );
              loop.start();
            }
            dismissTimer.current = setTimeout(hideSpotlight, SPOTLIGHT_VISIBLE_MS);
          });
        }, HIGHLIGHT_DELAY_MS);
      });

      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        loop?.stop();
        doublePulse?.stop();
        ping.setValue(0);
        setSpotlight(null);
      };
    }, [highlightOnLoad, status, district, source, intro, pulse, ping, hideSpotlight]),
  );

  const label = isResolving ? 'Locating…' : (district ?? 'All Tamil Nadu');
  const glow = ringColor ?? '#FFFFFF';

  const pillContent = (
    <>
      <Ionicons name="location" size={14} color={iconColor} />
      <Text style={[styles.label, { color: iconColor }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-down" size={14} color={iconColor} />
    </>
  );

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.7, 0] });
  // One pulse: the pill grows slightly and settles back while a soft ring spreads out and fades.
  const pillScale = ping.interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [1, 1.07, 1, 1] });
  const pingScale = ping.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const pingOpacity = ping.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 0.5, 0] });
  const calloutShift = intro.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  const openPicker = () => {
    hideSpotlight();
    setTimeout(() => setModalVisible(true), 250);
  };

  return (
    <>
      <Animated.View ref={pillRef} collapsable={false} style={[styles.pillWrap, { transform: [{ scale: pillScale }] }]}>
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`District: ${label}. Tap to change`}
          style={[styles.pill, style]}>
          {highlightOnLoad ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.glow, { backgroundColor: glow, opacity: pingOpacity, transform: [{ scale: pingScale }] }]}
            />
          ) : null}
          {pillContent}
        </Pressable>
      </Animated.View>

      {spotlight ? (
        <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={hideSpotlight}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: intro }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={hideSpotlight}
              accessibilityRole="button"
              accessibilityLabel="Dismiss location tip"
            />
          </Animated.View>

          {/* A copy of the pill sitting exactly over the real one, so it appears lifted above the dimmed screen. */}
          <Animated.View
            style={[
              styles.spot,
              { left: spotlight.x, top: spotlight.y, width: spotlight.width, height: spotlight.height, opacity: intro },
            ]}>
            <Animated.View
              pointerEvents="none"
              style={[styles.glow, { backgroundColor: glow, opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
            <Pressable
              onPress={openPicker}
              accessibilityRole="button"
              accessibilityLabel={`District: ${label}. Tap to change`}
              style={[styles.pill, style, styles.spotPill, { shadowColor: glow }]}>
              {pillContent}
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.callout,
              {
                top: spotlight.y + spotlight.height + 12,
                right: Math.max(16, windowWidth - (spotlight.x + spotlight.width)),
                opacity: intro,
                transform: [{ translateY: calloutShift }],
              },
            ]}>
            <View style={[styles.arrow, { right: spotlight.width / 2 - 6 }]} />
            <Text style={styles.calloutText}>Tap to change your location</Text>
          </Animated.View>
        </Modal>
      ) : null}

      <DistrictPickerModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        selected={district}
        onSelect={selectDistrict}
        onDetectLocation={detectFromLocation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pillWrap: {
    alignSelf: 'flex-start',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  spot: {
    position: 'absolute',
  },
  spotPill: {
    alignSelf: 'auto',
    flex: 1,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
  },
  callout: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  arrow: {
    position: 'absolute',
    top: -5,
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  calloutText: {
    fontSize: 13,
    fontWeight: '600',
    color: neutral[800],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 180,
  },
});
