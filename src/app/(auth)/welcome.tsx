import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'pricetag-outline', label: 'Save on leftovers' },
  { icon: 'location-outline', label: 'Shop your district' },
  { icon: 'shield-checkmark-outline', label: 'Direct contact' },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={require('../../../assets/images/welcome.webp')} style={StyleSheet.absoluteFill} contentFit="cover" />

      {/* Overlay: light tint on top for the logo, deep brand green fading in from the middle for the text. */}
      <LinearGradient
        colors={['rgba(8,25,18,0.55)', 'rgba(8,25,18,0.15)', 'rgba(8,25,18,0.78)', 'rgba(8,25,18,0.96)']}
        locations={[0, 0.3, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <Ionicons name="business" size={22} color={primary[500]} />
          </View>
          <Text style={styles.brandName}>Rebix</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.pill}>
            <Ionicons name="location" size={13} color="#FFFFFF" />
            <Text style={styles.pillText}>Tamil Nadu</Text>
          </View>

          <Text style={styles.title}>Build more.{'\n'}Waste less.</Text>
          <Text style={styles.tagline}>
            Buy and sell leftover construction materials in your district, at prices that make sense.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.feature}>
                <Ionicons name={feature.icon} size={16} color={primary[100]} />
                <Text style={styles.featureText}>{feature.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              mode="contained"
              buttonColor="#FFFFFF"
              textColor={primary[500]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={styles.button}
              onPress={() => router.push('/(auth)/login')}>
              Sign In
            </Button>
            <Button
              mode="outlined"
              textColor="#FFFFFF"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={[styles.button, styles.outlined]}
              onPress={() => router.push('/(auth)/register')}>
              Create Account
            </Button>
            <Button mode="text" textColor="rgba(255,255,255,0.85)" onPress={() => router.replace('/(tabs)')}>
              Browse as Guest
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primary[900],
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottom: {
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.82)',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: primary[100],
  },
  actions: {
    gap: spacing.sm,
  },
  button: {
    borderRadius: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  outlined: {
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
