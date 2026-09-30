import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  android: {
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    bold: 'sans-serif',
  },
  default: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
});

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} as const;

export type Typography = typeof typography;
