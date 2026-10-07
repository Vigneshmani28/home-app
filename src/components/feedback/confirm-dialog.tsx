import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Portal } from 'react-native-paper';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { neutral, primary, secondary, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ConfirmDialogProps {
  visible: boolean;
  onDismiss: () => void;
  icon: IconName;
  /** `danger` uses red for the icon and the confirm button; `default` uses the brand green. */
  tone?: 'default' | 'danger';
  title: string;
  message?: string;
  /** Extra content between the message and the buttons (lists, notes...). */
  children?: ReactNode;
  /** Inline error shown above the buttons, e.g. when the action failed. */
  error?: string | null;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Shows a spinner in the confirm button and locks the dialog. */
  loading?: boolean;
  /**
   * For irreversible actions: the user must type this phrase (case-insensitive) before the confirm
   * button becomes active, which makes the action deliberate.
   */
  confirmPhrase?: string;
}

const normalizePhrase = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

/** Modern confirmation dialog: icon badge, title, message and two full-width buttons. */
export function ConfirmDialog({
  visible,
  onDismiss,
  icon,
  tone = 'default',
  title,
  message,
  children,
  error,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  loading,
  confirmPhrase,
}: ConfirmDialogProps) {
  const danger = tone === 'danger';
  const [typed, setTyped] = useState('');
  const phraseMatches = !confirmPhrase || normalizePhrase(typed) === normalizePhrase(confirmPhrase);

  // Start empty every time the dialog is closed and reopened.
  const handleDismiss = () => {
    setTyped('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={loading ? undefined : handleDismiss}
        dismissable={!loading}
        contentContainerStyle={styles.card}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.badge, danger && styles.badgeDanger]}>
          <Ionicons name={icon} size={30} color={danger ? semantic.error : primary[500]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {children}

        {confirmPhrase ? (
          <View style={styles.phraseWrap}>
            <Text style={styles.phraseLabel}>
              Type <Text style={styles.phraseStrong}>{confirmPhrase}</Text> to confirm
            </Text>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              editable={!loading}
              placeholder={confirmPhrase}
              placeholderTextColor={neutral[300]}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              accessibilityLabel={`Type ${confirmPhrase} to confirm`}
              style={[styles.phraseInput, phraseMatches && typed.length > 0 && styles.phraseInputMatch]}
            />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={onConfirm}
            disabled={loading || !phraseMatches}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading || !phraseMatches }}
            style={({ pressed }) => [
              styles.button,
              danger ? styles.confirmDanger : styles.confirmDefault,
              !phraseMatches && styles.confirmDisabled,
              (pressed || loading) && styles.pressed,
            ]}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            )}
          </Pressable>
          <Pressable
            onPress={handleDismiss}
            disabled={loading}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
  },
  badge: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[50],
  },
  badgeDanger: {
    backgroundColor: '#FBE4E4',
  },
  title: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '800',
    color: neutral[800],
  },
  message: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: neutral[500],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: '#FBE4E4',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: semantic.error,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDefault: {
    backgroundColor: primary[500],
  },
  confirmDanger: {
    backgroundColor: semantic.error,
  },
  confirmDisabled: {
    opacity: 0.35,
  },
  phraseWrap: {
    marginTop: spacing.md,
  },
  phraseLabel: {
    marginBottom: 8,
    fontSize: 13,
    color: neutral[600],
  },
  phraseStrong: {
    fontWeight: '800',
    color: neutral[900],
  },
  phraseInput: {
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: neutral[200],
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: neutral[900],
  },
  phraseInputMatch: {
    borderColor: semantic.error,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancel: {
    backgroundColor: secondary[300],
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: neutral[600],
  },
  pressed: {
    opacity: 0.8,
  },
});
