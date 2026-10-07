import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** An open (card-less) group of fields with a heading, separated from the next group by whitespace. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: neutral[900],
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: neutral[500],
  },
  body: {
    marginTop: spacing.md,
  },
});
