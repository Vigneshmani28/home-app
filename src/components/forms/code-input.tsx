import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { neutral, primary, semantic } from '@/theme/colors';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  autoFocus?: boolean;
}

/**
 * One-time-code entry: a row of digit boxes backed by a single hidden text input, so pasting the
 * whole code or using the keyboard's "code from Mail/SMS" suggestion fills every box at once.
 */
export function CodeInput({ value, onChange, length = 6, error, autoFocus }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View>
      <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="Verification code" style={styles.row}>
        {Array.from({ length }).map((_, index) => {
          const digit = value[index];
          const isActive = focused && index === activeIndex;
          return (
            <View
              key={index}
              style={[styles.box, isActive && styles.boxActive, !!error && styles.boxError]}>
              <Text style={styles.digit}>{digit ?? ''}</Text>
            </View>
          );
        })}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={length}
          autoFocus={autoFocus}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          caretHidden
          style={styles.hiddenInput}
        />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: neutral[200],
  },
  boxActive: {
    backgroundColor: '#FFFFFF',
    borderColor: primary[500],
  },
  boxError: {
    backgroundColor: '#FEF4F4',
    borderColor: semantic.error,
  },
  digit: {
    fontSize: 24,
    fontWeight: '800',
    color: neutral[800],
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    color: semantic.error,
  },
});
