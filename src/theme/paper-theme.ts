import { MD3LightTheme } from 'react-native-paper';

import { accent, neutral, primary, secondary, semantic } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: primary[500],
    onPrimary: secondary[50],
    primaryContainer: primary[100],
    onPrimaryContainer: primary[800],
    secondary: accent[500],
    onSecondary: secondary[50],
    secondaryContainer: accent[100],
    onSecondaryContainer: accent[800],
    background: secondary[200],
    onBackground: neutral[600],
    surface: '#FFFFFF',
    onSurface: neutral[600],
    surfaceVariant: secondary[300],
    onSurfaceVariant: neutral[500],
    error: semantic.error,
    outline: neutral[300],
  },
} as const;

export type AppPaperTheme = typeof paperTheme;
