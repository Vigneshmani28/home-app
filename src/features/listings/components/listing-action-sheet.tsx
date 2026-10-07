import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

import { neutral, primary, secondary, semantic } from '@/theme/colors';
import { useBottomSheetInsets } from '@/components/ui/use-bottom-sheet-insets';
import { spacing } from '@/theme/spacing';
import { formatPrice } from '@/utils/format';

import { getPublicImageUrl } from '../services';
import type { ListingStatus, ListingWithImages } from '../types';

export type ListingAction = 'sold' | 'reserved' | 'reactivate' | 'deactivate' | 'delete';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ActionConfig {
  action: ListingAction;
  title: string;
  hint: string;
  icon: IconName;
  /** Icon tile colours. */
  tint: string;
  background: string;
  destructive?: boolean;
}

const ACTIONS: ActionConfig[] = [
  {
    action: 'reserved',
    title: 'Mark as reserved',
    hint: 'Hold it for a buyer who is interested',
    icon: 'bookmark-outline',
    tint: '#8A5A00',
    background: '#FDF1D8',
  },
  {
    action: 'sold',
    title: 'Mark as sold',
    hint: 'This item has found a buyer',
    icon: 'checkmark-circle-outline',
    tint: primary[600],
    background: primary[50],
  },
  {
    action: 'reactivate',
    title: 'Make active again',
    hint: 'Show it to buyers again',
    icon: 'refresh',
    tint: primary[600],
    background: primary[50],
  },
  {
    action: 'deactivate',
    title: 'Hide from buyers',
    hint: 'Keep it saved but not visible',
    icon: 'eye-off-outline',
    tint: neutral[500],
    background: secondary[300],
  },
  {
    action: 'delete',
    title: 'Delete listing',
    hint: 'Remove it permanently',
    icon: 'trash-outline',
    tint: semantic.error,
    background: '#FBE4E4',
    destructive: true,
  },
];

/** Which actions make sense for a listing in the given status. */
function actionsFor(status: ListingStatus): ActionConfig[] {
  return ACTIONS.filter((config) => {
    switch (config.action) {
      case 'sold':
        return status !== 'sold';
      case 'reserved':
        return status !== 'reserved';
      case 'reactivate':
        return status !== 'active';
      case 'deactivate':
        return status === 'active';
      default:
        return true;
    }
  });
}

interface ListingActionSheetProps {
  /** The listing being managed; the sheet is hidden while this is null. */
  listing: ListingWithImages | null;
  onClose: () => void;
  onAction: (listing: ListingWithImages, action: ListingAction) => void;
}

/** Bottom sheet of status/delete actions for one of the seller's own listings. */
export function ListingActionSheet({ listing, onClose, onAction }: ListingActionSheetProps) {
  const sheetInsets = useBottomSheetInsets();
  const imagePath = listing?.listing_images?.[0]?.storage_path;
  const actions = listing ? actionsFor(listing.status) : [];
  const safeActions = actions.filter((config) => !config.destructive);
  const destructive = actions.filter((config) => config.destructive);

  const renderRow = (config: ActionConfig) => (
    <Pressable
      key={config.action}
      onPress={() => listing && onAction(listing, config.action)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.rowIcon, { backgroundColor: config.background }]}>
        <Ionicons name={config.icon} size={22} color={config.tint} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, config.destructive && styles.rowTitleDestructive]}>{config.title}</Text>
        <Text style={styles.rowHint}>{config.hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={neutral[300]} />
    </Pressable>
  );

  return (
    <Portal>
      <Modal
        visible={!!listing}
        onDismiss={onClose}
        style={[styles.overlay, sheetInsets.overlay]}
        contentContainerStyle={[styles.sheet, { paddingBottom: sheetInsets.paddingBottom }]}>
        <View style={styles.handle} />

        {listing ? (
          <View style={styles.summary}>
            {imagePath ? (
              <Image source={{ uri: getPublicImageUrl(imagePath) }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="image-outline" size={20} color={neutral[300]} />
              </View>
            )}
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.summaryPrice}>{formatPrice(listing.price)}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={24} color={neutral[600]} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.group}>{safeActions.map(renderRow)}</View>
        {destructive.length > 0 ? <View style={[styles.group, styles.dangerGroup]}>{destructive.map(renderRow)}</View> : null}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: secondary[500],
    marginBottom: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  thumbPlaceholder: {
    backgroundColor: secondary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: neutral[800],
  },
  summaryPrice: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: primary[500],
  },
  group: {
    borderRadius: 18,
    backgroundColor: secondary[200],
    paddingVertical: 4,
  },
  dangerGroup: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: neutral[800],
  },
  rowTitleDestructive: {
    color: semantic.error,
  },
  rowHint: {
    marginTop: 1,
    fontSize: 12,
    color: neutral[400],
  },
});
