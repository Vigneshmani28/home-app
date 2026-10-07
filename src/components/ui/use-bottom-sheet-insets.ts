import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme/spacing';

/**
 * React Native Paper's Modal keeps a margin equal to the bottom safe-area inset, which on iPhones leaves
 * a gap under a bottom sheet. Spread `overlay` onto the Modal's `style` to remove that margin, and add
 * `paddingBottom` to the sheet so its content still clears the home indicator.
 */
export function useBottomSheetInsets() {
  const { bottom } = useSafeAreaInsets();
  return {
    overlay: { marginBottom: 0 } as const,
    paddingBottom: Math.max(bottom, spacing.lg),
  };
}
