import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog, EmptyState } from '@/components/feedback';
import { ScreenHeader } from '@/components/layout';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/features/auth/services/auth-context';
import { clearStoredDistrict } from '@/features/district/services';
import { accent, neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatDate } from '@/utils/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ProfileScreen() {
  const { user, profile, isLoading, signOut } = useAuth();

  const [signOutDialogVisible, setSignOutDialogVisible] = useState(false);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScreenHeader title="Profile" />
        <View style={styles.signedOut}>
          <EmptyState
            icon="person-outline"
            title="Sign in to manage your profile"
            message="Post listings, save favorites and let buyers reach you directly."
            primaryAction={{ label: 'Sign In', icon: 'log-in-outline', onPress: () => router.push('/(auth)/login') }}
            secondaryAction={{ label: 'Create account', onPress: () => router.push('/(auth)/register') }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const initials =
    (profile?.full_name ?? user.email ?? '?')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  const onConfirmSignOut = async () => {
    setSignOutDialogVisible(false);
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const onClearLocalStorage = async () => {
    await clearStoredDistrict();
    Alert.alert('Local storage cleared', 'Fully close and reopen the app to run district detection from scratch.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Profile" subtitle="Manage your account and listings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.full_name || 'Your name'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/edit-profile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={({ pressed }) => [styles.editChip, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="pencil" size={14} color={primary[500]} />
            </Pressable>
          </View>

          <View style={styles.infoList}>
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={profile?.phone}
              placeholder="Not added"
              badge={profile?.phone ? (profile.show_phone_publicly ? 'Visible to buyers' : 'Hidden') : undefined}
            />
            <InfoRow
              icon="location-outline"
              label="Location"
              value={[profile?.locality, profile?.district].filter(Boolean).join(', ')}
              placeholder="Not added"
            />
            <InfoRow
              icon="calendar-outline"
              label="Member since"
              value={profile?.created_at ? formatDate(profile.created_at) : undefined}
              last
            />
          </View>
        </View>

        {!profile?.district || !profile?.phone ? (
          <Pressable
            onPress={() => router.push('/edit-profile')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nudge, pressed && styles.pressed]}>
            <View style={styles.nudgeIcon}>
              <Ionicons name="sparkles-outline" size={18} color={accent[600]} />
            </View>
            <View style={styles.nudgeText}>
              <Text style={styles.nudgeTitle}>Complete your profile</Text>
              <Text style={styles.nudgeBody}>
                {!profile?.district
                  ? 'Add your district so we show you listings in your area.'
                  : 'Add a phone number so buyers can reach you.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={accent[600]} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel}>My activity</Text>
        <View style={styles.menuCard}>
          <ProfileLink icon="pricetags-outline" label="My Listings" onPress={() => router.push('/my-listings')} />
          <ProfileLink
            icon="heart-outline"
            label="Favorites"
            onPress={() => router.push('/(tabs)/favorites')}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.menuCard}>
          <ProfileLink
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
          <ProfileLink
            icon="document-text-outline"
            label="Terms and Conditions"
            onPress={() => router.push('/legal/terms')}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          <ProfileLink icon="log-out-outline" label="Sign Out" onPress={() => setSignOutDialogVisible(true)} />
          <ProfileLink
            icon="settings-outline"
            label="Account Settings"
            onPress={() => router.push('/account-settings')}
            last
          />
        </View>

        {__DEV__ ? (
          <>
            <Text style={styles.sectionLabel}>Developer</Text>
            <View style={styles.menuCard}>
              <ProfileLink icon="trash-outline" label="Clear local storage (dev only)" onPress={onClearLocalStorage} last />
            </View>
          </>
        ) : null}

        <Text style={styles.version}>Rebix · v{Constants.expoConfig?.version ?? '—'}</Text>
      </ScrollView>

      <ConfirmDialog
        visible={signOutDialogVisible}
        onDismiss={() => setSignOutDialogVisible(false)}
        icon="log-out-outline"
        title="Sign out?"
        message="You can sign back in anytime with your email and password."
        confirmLabel="Sign Out"
        onConfirm={onConfirmSignOut}
      />
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  placeholder,
  badge,
  last,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
  placeholder?: string;
  badge?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={primary[500]} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, !value && styles.infoPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      </View>
      {badge ? (
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProfileLink({
  icon,
  label,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.linkRow, !last && styles.linkDivider, pressed && styles.linkPressed]}>
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={20} color={primary[500]} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={neutral[300]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  signedOut: {
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: secondary[400],
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: neutral[800],
  },
  email: {
    marginTop: 2,
    fontSize: 13,
    color: neutral[400],
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: primary[50],
  },
  editChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[500],
  },
  pressed: {
    opacity: 0.7,
  },
  infoList: {
    marginTop: spacing.md,
    borderRadius: 14,
    backgroundColor: secondary[200],
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
  },
  infoDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: secondary[500],
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: neutral[400],
  },
  infoValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: '600',
    color: neutral[700],
  },
  infoPlaceholder: {
    fontWeight: '400',
    color: neutral[300],
  },
  infoBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: primary[50],
  },
  infoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: primary[600],
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: accent[50],
    borderWidth: 1,
    borderColor: accent[100],
  },
  nudgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeText: {
    flex: 1,
  },
  nudgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: accent[700],
  },
  nudgeBody: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: neutral[500],
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: secondary[400],
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  linkDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: secondary[500],
  },
  linkPressed: {
    backgroundColor: secondary[200],
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: neutral[700],
  },
  version: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 12,
    color: neutral[500],
  },
});
