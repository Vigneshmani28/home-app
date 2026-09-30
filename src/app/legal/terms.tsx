// Placeholder legal copy. Generic marketplace terms language, not
// legally reviewed — replace with counsel-approved text before launch.
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme/spacing';

export default function TermsAndConditionsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Terms and Conditions" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary" type="small" style={styles.updated}>
          Last updated: a placeholder date — replace before launch.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          The marketplace
        </ThemedText>
        <ThemedText>
          Construction Marketplace is a listing platform that connects buyers and sellers of construction
          materials in Tamil Nadu. We are not a party to any transaction between buyers and sellers, and we
          do not guarantee the quality, safety, or legality of items listed.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Your listings
        </ThemedText>
        <ThemedText>
          You are responsible for the accuracy of any listing you post, including price, quantity, and
          condition of the materials. Listings must not be fraudulent, misleading, or for prohibited items.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Contact between buyers and sellers
        </ThemedText>
        <ThemedText>
          Buyers contact sellers directly by phone call or WhatsApp using the contact number the seller enters
          on their listing. That number is visible to everyone who views the listing, so only enter a number
          you are happy to share. We are not a party to any conversation or transaction between users.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Account suspension
        </ThemedText>
        <ThemedText>
          We may suspend or remove accounts and listings that violate these terms or applicable law.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Changes
        </ThemedText>
        <ThemedText>
          We may update these terms from time to time. Continued use of the app after changes constitutes
          acceptance of the updated terms.
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
