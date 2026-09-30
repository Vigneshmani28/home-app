// Placeholder legal copy. Generic marketplace privacy language, not
// legally reviewed — replace with counsel-approved text before launch.
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme/spacing';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Privacy Policy" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary" type="small" style={styles.updated}>
          Last updated: a placeholder date — replace before launch.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          What we collect
        </ThemedText>
        <ThemedText>
          We collect the information you give us when you create an account and list materials — your name,
          approximate location (district/locality), and the details of any listings you create, including
          the contact phone number you enter for each listing. We also store the photos you upload for your
          listings. The contact number on a listing is visible to anyone who views that listing.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          How we use it
        </ThemedText>
        <ThemedText>
          Your information is used to operate the marketplace: showing your listings to buyers in your district,
          letting buyers contact sellers by phone or WhatsApp, and helping you find materials in your district. We do not sell
          your personal information to third parties.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Your phone number
        </ThemedText>
        <ThemedText>
          Your phone number is private by default and is never shown to other users unless you explicitly
          turn on &quot;Show phone number to buyers&quot; in your profile settings. You can turn this off at any
          time.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Account deletion
        </ThemedText>
        <ThemedText>
          You can permanently delete your account and associated data at any time from your profile. This
          action is irreversible.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Contact
        </ThemedText>
        <ThemedText>
          Questions about this policy can be directed to the app&apos;s support contact listed in the app
          store listing.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  updated: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
