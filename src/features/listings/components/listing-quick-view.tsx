import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';

import { useAuth } from '@/features/auth/services/auth-context';
import { PhoneContactButton, SignInToContactButton, WhatsAppContactButton } from '@/features/enquiries/components';
import { neutral, primary, secondary, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatPostedDate, formatPrice, formatQuantity } from '@/utils/format';

import { useListing } from '../hooks';
import { getPublicImageUrl } from '../services';
import type { ListingCondition } from '../types';
import type { ListingCardData } from './listing-card';

const CONDITION_LABELS: Record<ListingCondition, string> = {
  unused: 'Unused',
  like_new: 'Like New',
  good: 'Good',
  used: 'Used',
};

interface ListingQuickViewProps {
  visible: boolean;
  listing: ListingCardData;
  onClose: () => void;
  /** Called after the popup closes when the user taps "View full details". */
  onOpenDetails?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  showFavoriteButton?: boolean;
}

/**
 * Long-press preview of a listing: swipeable photos, the key facts, and one-tap contact —
 * everything needed to decide without leaving the list. Full details load in the background;
 * the card's own data is shown instantly meanwhile.
 */
export function ListingQuickView({
  visible,
  listing,
  onClose,
  onOpenDetails,
  isFavorited,
  onToggleFavorite,
  showFavoriteButton = true,
}: ListingQuickViewProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.lg * 2, 440);
  const { user } = useAuth();
  const { data: full } = useListing(listing.id);
  const [index, setIndex] = useState(0);

  const images = useMemo(() => {
    const fromDetails = (full?.listing_images ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => image.storage_path);
    if (fromDetails.length > 0) return fromDetails;
    return listing.imagePath ? [listing.imagePath] : [];
  }, [full, listing.imagePath]);

  const isOwner = !!user && !!full && user.id === full.seller_id;
  const contactPhone = full?.contact_phone ?? full?.seller?.phone ?? null;
  // With contact buttons above, this is the secondary action; otherwise it's the main one.
  const showsContact = !isOwner && !!user && !!contactPhone;
  // Guests get a sign-in prompt in place of the contact buttons.
  const showsSignIn = !user;
  const description = full?.description?.trim();
  const postedLabel = formatPostedDate(listing.createdAt ?? full?.created_at);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / cardWidth));
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        style={styles.overlay}
        contentContainerStyle={[styles.card, { width: cardWidth }]}>
        <View>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(path) => path}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: getPublicImageUrl(item) }}
                  style={{ width: cardWidth, height: cardWidth * 0.78 }}
                  contentFit="cover"
                  transition={120}
                />
              )}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { width: cardWidth, height: cardWidth * 0.78 }]}>
              <Ionicons name="image-outline" size={44} color={neutral[300]} />
              <Text style={styles.placeholderText}>No photos added</Text>
            </View>
          )}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          {showFavoriteButton ? (
            <Pressable
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              style={styles.favoriteButton}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorited ? semantic.error : '#FFFFFF'}
              />
            </Pressable>
          ) : null}

          {images.length > 1 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1}/{images.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            <Text style={styles.unit}>for {formatQuantity(listing.quantity, listing.unit)}</Text>
          </View>

          <View style={styles.chips}>
            <View style={styles.chip}>
              <Ionicons name="sparkles-outline" size={13} color={primary[600]} />
              <Text style={styles.chipText}>{CONDITION_LABELS[listing.condition]}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="cube-outline" size={13} color={primary[600]} />
              <Text style={styles.chipText}>{formatQuantity(listing.quantity, listing.unit)}</Text>
            </View>
            {full?.brand ? (
              <View style={styles.chip}>
                <Ionicons name="ribbon-outline" size={13} color={primary[600]} />
                <Text style={styles.chipText}>{full.brand}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={14} color={primary[500]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {listing.locality}, {listing.district}
            </Text>
          </View>
          {postedLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={neutral[400]} />
              <Text style={styles.metaTextMuted}>Posted {postedLabel}</Text>
            </View>
          ) : null}

          {description ? (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          ) : null}

          {showsSignIn ? (
            <View style={styles.contactRow}>
              <SignInToContactButton onBeforeNavigate={onClose} />
            </View>
          ) : null}

          {showsContact ? (
            <View style={styles.contactRow}>
              <WhatsAppContactButton phone={contactPhone} listingTitle={listing.title} />
              <PhoneContactButton phone={contactPhone} />
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              onClose();
              onOpenDetails?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="View full details"
            style={({ pressed }) => [
              styles.detailsButton,
              showsContact || showsSignIn ? styles.detailsButtonSoft : styles.detailsButtonSolid,
              pressed && styles.detailsPressed,
            ]}>
            <Text style={[styles.detailsLabel, showsContact || showsSignIn ? styles.detailsLabelSoft : styles.detailsLabelSolid]}>
              View full details
            </Text>
            <View style={[styles.detailsArrow, showsContact || showsSignIn ? styles.detailsArrowSoft : styles.detailsArrowSolid]}>
              <Ionicons name="arrow-forward" size={16} color={showsContact || showsSignIn ? '#FFFFFF' : primary[500]} />
            </View>
          </Pressable>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    backgroundColor: secondary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: neutral[400],
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  counter: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    padding: spacing.md,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: neutral[800],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: primary[500],
  },
  unit: {
    fontSize: 14,
    color: neutral[400],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: primary[50],
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: primary[600],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: neutral[600],
  },
  metaTextMuted: {
    fontSize: 13,
    color: neutral[400],
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 19,
    color: neutral[500],
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailsButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: 8,
    borderRadius: 5,
  },
  detailsButtonSolid: {
    backgroundColor: primary[500],
  },
  detailsButtonSoft: {
    backgroundColor: primary[50],
    borderWidth: 1,
    borderColor: primary[100],
  },
  detailsPressed: {
    opacity: 0.85,
  },
  detailsLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailsLabelSolid: {
    color: '#FFFFFF',
  },
  detailsLabelSoft: {
    color: primary[600],
  },
  detailsArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsArrowSolid: {
    backgroundColor: '#FFFFFF',
  },
  detailsArrowSoft: {
    backgroundColor: primary[500],
  },
});
