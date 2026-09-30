/**
 * Brand color tokens for Construction Marketplace.
 *
 * Primary: deep forest green
 * Secondary: warm off-white
 * Neutral: slate / charcoal
 * Accent: muted construction orange
 */

export const primary = {
  50: '#E6EDE9',
  100: '#C0D3C8',
  200: '#96B7A3',
  300: '#6B9A7D',
  400: '#4A8362',
  500: '#1B4332',
  600: '#173B2C',
  700: '#123024',
  800: '#0E261C',
  900: '#081912',
} as const;

export const secondary = {
  50: '#FFFFFF',
  100: '#FDFBF9',
  200: '#FAF7F2',
  300: '#F3EDE3',
  400: '#EBE2D2',
  500: '#DFD2BB',
} as const;

export const neutral = {
  50: '#F5F5F6',
  100: '#E4E4E6',
  200: '#C6C7CB',
  300: '#9A9CA3',
  400: '#6E7078',
  500: '#4A4C54',
  600: '#2B2D33',
  700: '#212228',
  800: '#17181C',
  900: '#0D0E10',
} as const;

export const accent = {
  50: '#FBEEE6',
  100: '#F3D2BC',
  200: '#E7AF8B',
  300: '#DB8B5A',
  400: '#CE7440',
  500: '#C1662F',
  600: '#A6541F',
  700: '#824118',
  800: '#5E2F12',
  900: '#3A1D0B',
} as const;

export const semantic = {
  success: '#2E7D4F',
  warning: '#C1662F',
  error: '#B3261E',
  info: '#1B4332',
} as const;

export const colors = {
  primary,
  secondary,
  neutral,
  accent,
  semantic,
} as const;

export type ColorPalette = typeof colors;
