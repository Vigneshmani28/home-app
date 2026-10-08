import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { neutral, primary, secondary } from '@/theme/colors';

interface RollingSearchbarProps
  extends Pick<TextInputProps, 'value' | 'onChangeText' | 'onSubmitEditing' | 'returnKeyType' | 'autoFocus'> {
  /** Words that roll through the placeholder: Search "Cement" → Search "Bricks" … Keep this array stable. */
  words: readonly string[];
  /** Placeholder shown while the field is focused (the rolling hint pauses so it never fights with typing). */
  idlePlaceholder?: string;
  style?: StyleProp<ViewStyle>;
}

const LINE_HEIGHT = 22;
const HOLD_MS = 1000;
const ROLL_MS = 380;

/**
 * Search field whose placeholder rolls like a departures board: the current word slides up and fades
 * out while the next one rises in from below. Only transform and opacity are animated (native driver),
 * so it stays smooth on any phone. With "Reduce Motion" on, it shows a static hint instead.
 */
export function RollingSearchbar({
  words,
  idlePlaceholder = 'Search materials...',
  value,
  onChangeText,
  onSubmitEditing,
  returnKeyType = 'search',
  autoFocus,
  style,
}: RollingSearchbarProps) {
  const [focused, setFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Two text slots that take turns: while one rolls out, the other rolls in. `step` only ever counts up
  // (a roll is step → step + 1) and its parity says which slot is leaving, so nothing is reset or swapped
  // while a word is visible. That reset/swap was what made the next word stutter on Android.
  const [slotWords, setSlotWords] = useState<[string, string]>(() => [words[0], words[1 % words.length]]);
  const [step] = useState(() => new Animated.Value(0));
  const [rollCount, setRollCount] = useState(0);

  const rolling = !focused && !value && words.length > 1 && !reduceMotion;
  const showHint = !focused && !value;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!rolling) return;
    // After an interruption (the field was focused mid-roll) start again from a clean, settled state.
    step.setValue(rollCount);
    let animation: Animated.CompositeAnimation | undefined;
    const timer = setTimeout(() => {
      animation = Animated.timing(step, {
        toValue: rollCount + 1,
        duration: ROLL_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start(({ finished }) => {
        if (!finished) return;
        // The slot that just rolled out is invisible now: give it the word after the one on screen.
        const leaving = rollCount % 2; // 0 = slot A just left, 1 = slot B just left
        setSlotWords((previous) => {
          const updated: [string, string] = [previous[0], previous[1]];
          updated[leaving] = words[(rollCount + 2) % words.length];
          return updated;
        });
        setRollCount(rollCount + 1);
      });
    }, HOLD_MS);
    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [rolling, rollCount, step, words]);

  // 0..2 repeating: [0,1] slot A leaves / B arrives, [1,2] B leaves / A arrives. The 1 → 1.0001 jump
  // happens while the slot that jumps is fully transparent.
  const phase = Animated.modulo(step, 2);
  const slotA = {
    opacity: phase.interpolate({ inputRange: [0, 0.7, 1, 1.0001, 1.3, 2], outputRange: [1, 0, 0, 0, 0, 1] }),
    transform: [
      { translateY: phase.interpolate({ inputRange: [0, 1, 1.0001, 2], outputRange: [0, -LINE_HEIGHT, LINE_HEIGHT, 0] }) },
    ],
  };
  const slotB = {
    opacity: phase.interpolate({ inputRange: [0, 0.3, 1, 1.0001, 1.7, 2], outputRange: [0, 0, 1, 1, 0, 0] }),
    transform: [
      { translateY: phase.interpolate({ inputRange: [0, 1, 1.0001, 2], outputRange: [LINE_HEIGHT, 0, 0, -LINE_HEIGHT] }) },
    ],
  };

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={22} color={neutral[400]} />

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={showHint ? '' : idlePlaceholder}
          placeholderTextColor={neutral[400]}
          selectionColor={primary[500]}
          returnKeyType={returnKeyType}
          autoFocus={autoFocus}
          autoCorrect={false}
          accessibilityLabel="Search materials"
          style={styles.input}
        />

        {showHint ? (
          <View pointerEvents="none" style={styles.hint}>
            {rolling ? (
              <>
                <Text style={styles.hintText}>Search </Text>
                <View style={styles.clip}>
                  <Animated.Text numberOfLines={1} style={[styles.hintText, styles.word, slotA]}>
                    {`"${slotWords[0]}"`}
                  </Animated.Text>
                  <Animated.Text numberOfLines={1} style={[styles.hintText, styles.word, slotB]}>
                    {`"${slotWords[1]}"`}
                  </Animated.Text>
                </View>
              </>
            ) : (
              <Text style={styles.hintText}>{idlePlaceholder}</Text>
            )}
          </View>
        ) : null}
      </View>

      {value ? (
        <Pressable
          onPress={() => onChangeText?.('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={20} color={neutral[300]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
  },
  inputWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    height: '100%',
    padding: 0,
    fontSize: 16,
    color: neutral[800],
  },
  hint: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    color: neutral[400],
  },
  clip: {
    flex: 1,
    height: LINE_HEIGHT,
    overflow: 'hidden',
  },
  word: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
