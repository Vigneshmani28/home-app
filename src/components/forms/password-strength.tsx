import { StyleSheet, Text, View } from 'react-native';

import { neutral, secondary, semantic } from '@/theme/colors';

const LEVELS = [
  { label: 'Too weak', color: semantic.error },
  { label: 'Weak', color: '#E07B39' },
  { label: 'Fair', color: '#E0B400' },
  { label: 'Good', color: '#5BA06A' },
  { label: 'Strong', color: '#2E7D4F' },
] as const;

/** 0 (empty/very weak) to 4 (strong): length, mixed case, digits and symbols each add a point. */
export function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;
  return score;
}

/** Four-segment strength meter shown under a new-password field. Hidden while the field is empty. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const level = LEVELS[score];

  return (
    <View style={styles.wrap} accessibilityLabel={`Password strength: ${level.label}`}>
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[styles.bar, { backgroundColor: index < Math.max(score, 1) ? level.color : secondary[500] }]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: level.color }]}>{level.label}</Text>
      {score < 3 ? <Text style={styles.tip}>Use 8+ characters with upper and lower case letters and a number.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -6,
    marginBottom: 16,
  },
  bars: {
    flexDirection: 'row',
    gap: 6,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
  },
  tip: {
    marginTop: 2,
    fontSize: 12,
    color: neutral[400],
  },
});
