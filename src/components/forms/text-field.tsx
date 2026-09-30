import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { neutral, primary, secondary, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Error message; also turns the border red. */
  error?: string;
  hint?: string;
  leftIcon?: IconName;
  /** Password field with a show/hide toggle. */
  secureToggle?: boolean;
  /** Static text shown before the value, e.g. a currency symbol. */
  prefix?: string;
  /** Custom element at the right edge of the box. */
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Lightweight form field: static label above a rounded input.
 * No animated floating label, so it renders instantly.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, leftIcon, secureToggle, prefix, right, containerStyle, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          inputProps.multiline && styles.boxMultiline,
          focused && styles.boxFocused,
          !!error && styles.boxError,
        ]}>
        {leftIcon ? <Ionicons name={leftIcon} size={20} color={focused ? primary[500] : neutral[300]} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          style={[styles.input, inputProps.multiline && styles.inputMultiline]}
          placeholderTextColor={neutral[300]}
          selectionColor={primary[500]}
          accessibilityLabel={label}
          {...inputProps}
          secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {right}
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={neutral[400]} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: neutral[600],
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: secondary[500],
  },
  boxMultiline: {
    height: undefined,
    minHeight: 110,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  boxFocused: {
    borderColor: primary[500],
  },
  boxError: {
    borderColor: semantic.error,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: neutral[800],
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: neutral[500],
  },
  inputMultiline: {
    height: undefined,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: semantic.error,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: neutral[400],
  },
});
