import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface FormSectionProps {
  title: string;
  description?: string;
  /** Optional Ionicons name shown in a soft badge before the title. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
}

/** An open (card-less) group of fields with a heading, separated from the next group by whitespace. */
export function FormSection({ title, description, icon, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        {icon ? (
          <View style={styles.iconBadge}>
            <Ionicons name={icon} size={18} color={primary[600]} />
          </View>
        ) : null}
        <View style={styles.headingText}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  headingText: {
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[50],
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
