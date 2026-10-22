import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

// logo.webp is 2172x724 (3:1) including a little transparent padding around the wordmark.
const LOGO_ASPECT_RATIO = 2172 / 724;

interface BrandLogoProps {
  /** Rendered height in dp; the width follows the logo's aspect ratio. */
  height?: number;
  /** `color` is the full-colour logo for light backgrounds; `white` is a single-colour version for dark ones. */
  variant?: 'color' | 'white';
  style?: StyleProp<ImageStyle>;
}

/** The Rebix wordmark. Use this everywhere the brand name is shown instead of plain text. */
export function BrandLogo({ height = 36, variant = 'color', style }: BrandLogoProps) {
  return (
    <Image
      source={require('../../../assets/home/logo.webp')}
      contentFit="contain"
      tintColor={variant === 'white' ? '#FFFFFF' : undefined}
      accessibilityLabel="Rebix"
      accessibilityRole="image"
      style={[{ height, width: height * LOGO_ASPECT_RATIO }, style]}
    />
  );
}
