import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ionicon } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { ScreenHeader } from '@/components/layout';
import { useDeleteAccount } from '@/features/profile/hooks';
import { neutral, secondary, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const DELETED_ITEMS = ['Your profile and contact details', 'All of your listings and photos', 'Your favorites and saved data'];

export default function AccountSettingsScreen() {
  const deleteAccount = useDeleteAccount();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDismiss = () => {
    setDialogVisible(false);
    setConfirmStep(false);
    setError(null);
  };

  const onConfirm = async () => {
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }
    setError(null);
    try {
      await deleteAccount.mutateAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Account Settings" subtitle="Manage your account data" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <View style={styles.dangerIcon}>
              <Ionicons name="trash-outline" size={22} color={semantic.error} />
            </View>
            <View style={styles.dangerHeaderText}>
              <Text style={styles.dangerTitle}>Delete account</Text>
              <Text style={styles.dangerSub}>This action is permanent and cannot be undone.</Text>
            </View>
          </View>

          <View style={styles.list}>
            {DELETED_ITEMS.map((item) => (
              <View key={item} style={styles.listRow}>
                <Ionicons name="close-circle" size={16} color={semantic.error} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <Button
            mode="outlined"
            icon={ionicon('trash-outline')}
            textColor={semantic.error}
            onPress={() => setDialogVisible(true)}
            contentStyle={styles.buttonContent}
            style={styles.deleteButton}>
            Delete My Account
          </Button>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={dialogVisible}
        onDismiss={onDismiss}
        tone="danger"
        icon={confirmStep ? 'warning' : 'trash-outline'}
        title={confirmStep ? 'Last chance' : 'Delete your account?'}
        message={
          confirmStep
            ? 'Once you confirm, everything is erased right away and cannot be brought back.'
            : 'This permanently removes your account and everything linked to it.'
        }
        error={error}
        confirmLabel={confirmStep ? 'Yes, delete forever' : 'Continue'}
        cancelLabel={confirmStep ? 'Keep my account' : 'Cancel'}
        onConfirm={onConfirm}
        loading={deleteAccount.isPending}>
        {confirmStep ? null : (
          <View style={styles.dialogList}>
            {DELETED_ITEMS.map((item) => (
              <View key={item} style={styles.dialogListRow}>
                <Ionicons name="close-circle" size={16} color={semantic.error} />
                <Text style={styles.dialogListText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </ConfirmDialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1C7C4',
    padding: spacing.md,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dangerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FBE4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerHeaderText: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: neutral[800],
  },
  dangerSub: {
    marginTop: 2,
    fontSize: 13,
    color: neutral[400],
  },
  list: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: secondary[200],
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: neutral[600],
  },
  deleteButton: {
    marginTop: spacing.md,
    borderRadius: 14,
    borderColor: semantic.error,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  dialogList: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: secondary[200],
  },
  dialogListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dialogListText: {
    flex: 1,
    fontSize: 14,
    color: neutral[600],
  },
});
