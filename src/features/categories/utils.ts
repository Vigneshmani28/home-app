import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, IconName> = {
  'bricks-and-blocks': 'cube-outline',
  'cement-and-aggregates': 'layers-outline',
  'steel-and-metal': 'construct-outline',
  'tiles-and-flooring': 'grid-outline',
  plumbing: 'water-outline',
  electrical: 'flash-outline',
  'doors-and-windows': 'browsers-outline',
  'paint-and-finishing': 'color-palette-outline',
  roofing: 'home-outline',
  'tools-and-equipment': 'hammer-outline',
  'other-materials': 'apps-outline',
};

export function getCategoryIcon(slug: string): IconName {
  return CATEGORY_ICONS[slug] ?? 'apps-outline';
}

/**
 * Custom artwork for categories, used instead of an icon glyph where available.
 * Every current category has artwork; a new category without an entry here falls back to a line icon —
 * drop a PNG into assets/categories and add its slug below.
 */
const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  'bricks-and-blocks': require('../../../assets/categories/bricks.webp'),
  'cement-and-aggregates': require('../../../assets/categories/cement.webp'),
  'doors-and-windows': require('../../../assets/categories/door.webp'),
  electrical: require('../../../assets/categories/electrical.webp'),
  'paint-and-finishing': require('../../../assets/categories/painting.webp'),
  'steel-and-metal': require('../../../assets/categories/steels.webp'),
  'tiles-and-flooring': require('../../../assets/categories/tiles.webp'),
  'other-materials': require('../../../assets/categories/other.png'),
  plumbing: require('../../../assets/categories/plumbing.webp'),
  roofing: require('../../../assets/categories/roofing.webp'),
  'tools-and-equipment': require('../../../assets/categories/tools.webp'),
};

export function getCategoryImage(slug: string): ImageSourcePropType | undefined {
  return CATEGORY_IMAGES[slug];
}
