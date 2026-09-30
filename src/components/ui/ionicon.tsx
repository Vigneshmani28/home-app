import Ionicons from '@expo/vector-icons/Ionicons';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * react-native-paper resolves string icon names against MaterialCommunityIcons. Pass
 * `icon={ionicon('add')}` instead to draw an Ionicons glyph in Paper's Button, IconButton,
 * Menu.Item, Searchbar, etc.
 */
export function ionicon(name: IoniconName) {
  return function IonIcon({ size, color }: { size: number; color: string }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}
