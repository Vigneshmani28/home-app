import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Modal, Portal } from 'react-native-paper';

import { neutral, primary, secondary, semantic } from '@/theme/colors';
import { useBottomSheetInsets } from '@/components/ui/use-bottom-sheet-insets';
import { spacing } from '@/theme/spacing';

import { useReportListing } from '../hooks';
import {
  REPORT_DETAILS_MAX,
  REPORT_OTHER_MIN,
  REPORT_REASONS,
  type ReportReason,
  type ReportResult,
} from '../types';

interface ReportListingSheetProps {
  visible: boolean;
  listingId: string;
  onClose: () => void;
}

const RESULT_MESSAGES: Partial<Record<ReportResult, string>> = {
  own_listing: "You can't report your own listing.",
  not_found: 'This listing is no longer available.',
  rate_limited: "You've sent several reports today. Please try again tomorrow.",
  invalid: 'Please check your report and try again.',
};

/** Bottom sheet for reporting a listing: pick a reason, optionally add details, submit. */
export function ReportListingSheet({ visible, listingId, onClose }: ReportListingSheetProps) {
  const report = useReportListing();
  const sheetInsets = useBottomSheetInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const detailsLength = details.trim().length;
  const needsDetails = reason === 'other';
  const canSubmit = !!reason && (!needsDetails || detailsLength >= REPORT_OTHER_MIN) && !report.isPending;

  const close = () => {
    onClose();
    // Reset after the sheet has animated away.
    setTimeout(() => {
      setReason(null);
      setDetails('');
      setError(null);
      setDone(false);
      report.reset();
    }, 250);
  };

  const submit = async () => {
    if (!reason || !canSubmit) return;
    setError(null);
    try {
      const result = await report.mutateAsync({ listingId, reason, details });
      if (result === 'ok' || result === 'already_reported') {
        setDone(true);
      } else {
        setError(RESULT_MESSAGES[result] ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError("We couldn't send your report. Check your connection and try again.");
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={close} style={[styles.overlay, sheetInsets.overlay]}
        contentContainerStyle={[styles.sheet, { paddingBottom: sheetInsets.paddingBottom, maxHeight: windowHeight * 0.88 }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoider}>
          <View style={styles.handle} />

          {done ? (
            <View style={styles.doneWrap}>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.doneTitle}>Thanks for letting us know</Text>
              <Text style={styles.doneBody}>
                Our team will review this listing. We keep your report confidential, and the seller won&apos;t see who
                sent it.
              </Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Report this listing</Text>
                <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                  <Ionicons name="close" size={24} color={neutral[600]} />
                </Pressable>
              </View>
              <Text style={styles.subtitle}>What&apos;s wrong with it? Your report is anonymous to the seller.</Text>

              <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {REPORT_REASONS.map((item) => {
                  const selected = reason === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => {
                        setReason(item.value);
                        setError(null);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={({ pressed }) => [styles.reasonRow, selected && styles.reasonRowSelected, pressed && styles.pressed]}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.reasonText}>
                        <Text style={styles.reasonLabel}>{item.label}</Text>
                        <Text style={styles.reasonHint}>{item.hint}</Text>
                      </View>
                    </Pressable>
                  );
                })}

                {reason ? (
                  <View style={styles.detailsWrap}>
                    <Text style={styles.detailsLabel}>
                      {needsDetails ? 'Describe the problem' : 'Add more details (optional)'}
                    </Text>
                    <TextInput
                      value={details}
                      onChangeText={(text) => setDetails(text.slice(0, REPORT_DETAILS_MAX))}
                      placeholder="What should we look into?"
                      placeholderTextColor={neutral[300]}
                      selectionColor={primary[500]}
                      multiline
                      textAlignVertical="top"
                      maxLength={REPORT_DETAILS_MAX}
                      accessibilityLabel="Report details"
                      style={styles.detailsInput}
                    />
                    <Text style={styles.counter}>
                      {needsDetails && detailsLength < REPORT_OTHER_MIN
                        ? `At least ${REPORT_OTHER_MIN} characters · `
                        : ''}
                      {detailsLength}/{REPORT_DETAILS_MAX}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
                style={({ pressed }) => [styles.primaryButton, !canSubmit && styles.primaryButtonDisabled, pressed && styles.pressed]}>
                {report.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit report</Text>
                )}
              </Pressable>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    // Paper centres the sheet's content, so anything taller than the sheet would be clipped at BOTH ends.
    // Start from the top and let the reasons list shrink and scroll instead (see keyboardAvoider / scroll).
    justifyContent: 'flex-start',
  },
  keyboardAvoider: {
    flexShrink: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: secondary[500],
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: neutral[800],
  },
  subtitle: {
    marginTop: 4,
    marginBottom: spacing.sm,
    fontSize: 13,
    color: neutral[500],
  },
  scroll: {
    flexShrink: 1,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
  },
  reasonRowSelected: {
    backgroundColor: primary[50],
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: primary[500],
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: primary[500],
  },
  reasonText: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: neutral[800],
  },
  reasonHint: {
    marginTop: 1,
    fontSize: 12,
    color: neutral[400],
  },
  detailsWrap: {
    marginTop: spacing.md,
  },
  detailsLabel: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: neutral[700],
  },
  detailsInput: {
    minHeight: 88,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: secondary[200],
    fontSize: 15,
    color: neutral[800],
  },
  counter: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 11,
    color: neutral[400],
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: semantic.error,
  },
  primaryButton: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: 10,
    backgroundColor: primary[500],

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  primaryButtonDisabled: {
    backgroundColor: neutral[300],
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  pressed: {
    opacity: 0.75,
  },
  doneWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  doneIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '800',
    color: neutral[800],
  },
  doneBody: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: neutral[500],
  },
});
