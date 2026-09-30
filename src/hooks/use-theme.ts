/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

/**
 * The app has a single light brand theme and deliberately ignores the system dark-mode setting
 * (see also `userInterfaceStyle: "light"` in app.json), so this always returns the light palette.
 */
export function useTheme() {
  return Colors.light;
}
