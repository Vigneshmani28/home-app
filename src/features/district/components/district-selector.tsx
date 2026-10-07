import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useDistrict } from '../hooks';
import { DistrictPickerModal } from './district-picker-modal';

interface DistrictSelectorProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  /**
   * Briefly draws the eye to the pill once the district is known: on every app launch, and again if the
   * district changes by itself (e.g. location detection) — never when the user picked it. Home only.
   */
  highlightOnLoad?: boolean;
}

// Wait for the splash and the first content to settle so the effect is actually seen, not missed.
const HIGHLIGHT_DELAY_MS = 900;

/** The district last highlighted this session ('' = none yet). Module-level so remounts don't replay it. */
let lastHighlightedKey: string | null = null;

/**
 * The app-wide district selector: shows the resolved district (or "All Tamil Nadu") and opens a
 * picker to change it. The value is shared app state, so every screen showing this stays in sync.
 */
export function DistrictSelector({ style, textStyle, iconColor = '#FFFFFF', highlightOnLoad }: DistrictSelectorProps) {
  const { district, source, status, isResolving, selectDistrict, detectFromLocation } = useDistrict();
  const [modalVisible, setModalVisible] = useState(false);
  // Only opacity and transform are animated, so it runs on the native thread and stays smooth on any phone.
  const [pulse] = useState(() => new Animated.Value(0));

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
      let animation: Animated.CompositeAnimation | undefined;

      void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
        if (cancelled || reduceMotion) return;
        timer = setTimeout(() => {
          // Only counts as shown once it actually starts, so leaving the screen early doesn't waste it.
          lastHighlightedKey = key;
          pulse.setValue(0);
          animation = Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.delay(150),
            Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]);
          animation.start();
        }, HIGHLIGHT_DELAY_MS);
      });

      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
        animation?.stop();
        pulse.setValue(0);
      };
    }, [highlightOnLoad, status, district, source, pulse]),
  );

  // 0 → 1 over one pulse: the pill grows slightly and settles back, while a soft ring spreads out and fades.
  const pillScale = pulse.interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [1, 1.07, 1, 1] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 0.5, 0] });

  const label = isResolving ? 'Locating…' : (district ?? 'All Tamil Nadu');

  return (
    <>
      <Animated.View style={[styles.pulseWrap, { transform: [{ scale: pillScale }] }]}>
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`District: ${label}. Tap to change`}
          style={[styles.pill, style]}>
          {highlightOnLoad ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
          ) : null}
          <Ionicons name="location" size={14} color={iconColor} />
          <Text style={[styles.label, { color: iconColor }, textStyle]} numberOfLines={1}>
            {label}
          </Text>
          <Ionicons name="chevron-down" size={14} color={iconColor} />
        </Pressable>
      </Animated.View>

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
  pulseWrap: {
    alignSelf: 'flex-start',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
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
