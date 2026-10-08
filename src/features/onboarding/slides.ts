import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

import { primary } from '@/theme/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface OnboardingSlideData {
  id: string;
  /** Title in pieces so one phrase can be highlighted in the slide's accent colour. */
  title: { text: string; highlight?: boolean }[];
  description: string;
  highlights: { icon: IconName; label: string }[];
  art: ImageSourcePropType;
  theme: {
    /** Page background, top to bottom. */
    background: [string, string];
    /** Large soft circles in the corners. */
    blob: string;
    /** Title colour, and the colour of the highlighted phrase. */
    title: string;
    accent: string;
    description: string;
    /** Round background + icon colour of the three highlights. */
    chipBg: string;
    chipIcon: string;
    /** Next button and the active progress segment. */
    button: string;
    /** Inactive progress segments. */
    track: string;
  };
}

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'reuse',
    title: [{ text: 'Surplus materials find a ' }, { text: 'new destiny', highlight: true }],
    description: 'Leftover cement, bricks, steel and more from completed projects, sold to people who need them.',
    highlights: [
      { icon: 'leaf-outline', label: 'Reduce\nWaste' },
      { icon: 'wallet-outline', label: 'Save\nMoney' },
      { icon: 'earth-outline', label: 'Greener\nFuture' },
    ],
    art: require('../../../assets/welcome-screen/screen1.webp'),
    theme: {
      background: ['#EEF8F2', '#FBFDFB'],
      blob: primary[100],
      title: primary[800],
      accent: primary[400],
      description: '#5B6762',
      chipBg: primary[100],
      chipIcon: primary[600],
      button: primary[700],
      track: primary[100],
    },
  },
  {
    id: 'sell',
    title: [{ text: 'Turn extra materials ' }, { text: 'into cash', highlight: true }],
    description: 'List what is left from your project in minutes, for free, and let buyers contact you directly.',
    highlights: [
      { icon: 'camera-outline', label: 'Easy\nListing' },
      { icon: 'pricetag-outline', label: 'Reach Local\nBuyers' },
      { icon: 'refresh-outline', label: 'Second\nLife' },
    ],
    art: require('../../../assets/welcome-screen/screen2.webp'),
    theme: {
      background: ['#FFF1E2', '#FFFAF4'],
      blob: '#FDE3C4',
      title: primary[800],
      accent: '#E8761B',
      description: '#6B625A',
      chipBg: '#FDE3C4',
      chipIcon: '#E8761B',
      button: '#E8761B',
      track: '#FBDDBA',
    },
  },
  {
    id: 'nearby',
    title: [{ text: 'Find materials in your district' }],
    description: 'Browse listings in your district or across all of Tamil Nadu, and deal directly with the seller.',
    highlights: [
      { icon: 'location-outline', label: 'Your\nDistrict' },
      { icon: 'map-outline', label: 'All Tamil\nNadu' },
      { icon: 'call-outline', label: 'Direct\nContact' },
    ],
    art: require('../../../assets/welcome-screen/screen3.webp'),
    theme: {
      background: ['#E8F2F7', '#F8FBFD'],
      blob: '#CFE6EF',
      title: primary[800],
      accent: primary[800],
      description: '#58666E',
      chipBg: primary[100],
      chipIcon: primary[600],
      button: primary[700],
      track: '#D5E5EC',
    },
  },
];
