/**
 * Brand color tokens for Construction Marketplace.
 *
 * Primary: deep forest construction green
 * Secondary: warm green-tinted off-white
 * Neutral: charcoal / slate
 * Accent: earthy construction orange
 */

export const primary = {
  50: '#EAF6F0',
  100: '#D0EBDD',
  200: '#A6D7BF',
  300: '#76BE9E',
  400: '#3FA47D',
  500: '#087F5B',
  600: '#06704F',
  700: '#055F43',
  800: '#044D37',
  900: '#033B2A',
} as const;

export const secondary = {
  50: '#FFFFFF',
  100: '#FAFCFB',
  200: '#F3F7F5',
  300: '#EAF1ED',
  400: '#DCE8E2',
  500: '#CBDDD4',
} as const;

export const neutral = {
  50: '#F7F9F8',
  100: '#EFF2F0',
  200: '#DEE4E1',
  300: '#C4CDC8',
  400: '#929D97',
  500: '#65716B',
  600: '#47534D',
  700: '#343D38',
  800: '#222925',
  900: '#111613',
} as const;

export const accent = {
  50: '#FFF7ED',
  100: '#FEEBD7',
  200: '#F9D2AD',
  300: '#F2B477',
  400: '#E8964F',
  500: '#D87932',
  600: '#C46325',
  700: '#A84F1D',
  800: '#883F19',
  900: '#6D3215',
} as const;

export const semantic = {
  success: '#087F5B',
  warning: '#D87932',
  error: '#DC4545',
  info: '#087EA4',
} as const;

export const colors = {
  primary,
  secondary,
  neutral,
  accent,
  semantic,
} as const;

export type ColorPalette = typeof colors;