import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { neutral, primary } from '@/theme/colors';
import { ionicon } from '@/components/ui';
import { spacing } from '@/theme/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  icon?: IconName;
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  /** Main call to action (filled button). */
  primaryAction?: EmptyStateAction;
  /** Optional lower-emphasis action (outlined button). */
  secondaryAction?: EmptyStateAction;
}

/** Friendly empty/error placeholder: soft icon badge, title, short explanation and up to two actions. */
export function EmptyState({ icon, title, message, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badgeOuter}>
        <View style={styles.badgeInner}>
          <Ionicons name={icon} size={34} color={primary[500]} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {primaryAction || secondaryAction ? (
        <View style={styles.actions}>
          {primaryAction ? (
            <Button
              mode="contained"
              icon={primaryAction.icon ? ionicon(primaryAction.icon) : undefined}
              onPress={primaryAction.onPress}
              contentStyle={styles.buttonContent}
              style={styles.button}>
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              mode="outlined"
              icon={secondaryAction.icon ? ionicon(secondaryAction.icon) : undefined}
              onPress={secondaryAction.onPress}
              contentStyle={styles.buttonContent}
              style={styles.button}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  badgeOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: neutral[800],
  },
  message: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: neutral[400],
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 4,
  },
});
