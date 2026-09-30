import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconButton } from 'react-native-paper';

import { ionicon } from '@/components/ui';
import { neutral, primary, secondary, semantic } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatDistance, formatPrice, formatQuantity, formatTimeAgo } from '@/utils/format';

import { getPublicImageUrl } from '../services';
import type { ListingCondition, ListingStatus } from '../types';
import { ListingQuickView } from './listing-quick-view';

const CONDITION_LABELS: Record<ListingCondition, string> = {
  unused: 'Unused',
  like_new: 'Like New',
  good: 'Good',
  used: 'Used',
};

const STATUS_LABELS: Partial<Record<ListingStatus, string>> = {
  reserved: 'Reserved',
  sold: 'Sold',
  inactive: 'Inactive',
  expired: 'Expired',
  draft: 'Draft',
};

export interface ListingCardData {
  id: string;
  title: string;
  price: number;
  quantity: number;
  unit: string;
  condition: ListingCondition;
  district: string;
  locality: string;
  status: ListingStatus;
  distanceKm?: number | null;
  imagePath?: string | null;
  /** ISO timestamp the listing was posted; shown as "Posted 2 hours ago". */
  createdAt?: string | null;
}

interface ListingCardProps {
  listing: ListingCardData;
  onPress?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  showFavoriteButton?: boolean;
  /** Long-press opens a quick-view popup. On by default. */
  quickPreview?: boolean;
}

export function ListingCard({
  listing,
  onPress,
  isFavorited,
  onToggleFavorite,
  showFavoriteButton = true,
  quickPreview = true,
}: ListingCardProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const imageUrl = listing.imagePath ? getPublicImageUrl(listing.imagePath) : null;
  const statusLabel = listing.status !== 'active' ? STATUS_LABELS[listing.status] : null;
  const distanceLabel = formatDistance(listing.distanceKm ?? null);
  const postedLabel = formatTimeAgo(listing.createdAt);
  const quantityLabel = formatQuantity(listing.quantity, listing.unit);

  const openPreview = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPreviewVisible(true);
  };

  return (
    <>
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={quickPreview ? openPreview : undefined}
      delayLongPress={350}
      activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={30} color={neutral[300]} />
          </View>
        )}
        {statusLabel ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        ) : null}
        {showFavoriteButton ? (
          <IconButton
            icon={ionicon(isFavorited ? 'heart' : 'heart-outline')}
            iconColor={isFavorited ? semantic.error : '#FFFFFF'}
            size={20}
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
            testID={isFavorited ? 'favorite-icon-filled' : 'favorite-icon-outline'}
          />
        ) : null}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionBadgeText}>{CONDITION_LABELS[listing.condition]}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Two lines are always reserved so every card in a row lines up. */}
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price} numberOfLines={1}>
            {formatPrice(listing.price)}
          </Text>
          {listing.unit ? (
            <Text style={styles.unit} numberOfLines={1}>
              / {listing.unit}
            </Text>
          ) : null}
        </View>

        <View style={styles.stockRow}>
          <Ionicons name="cube-outline" size={13} color={neutral[400]} />
          <Text style={styles.stockText} numberOfLines={1}>
            {quantityLabel} available
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="location" size={13} color={primary[500]} style={styles.infoIcon} />
          <Text style={styles.locality} numberOfLines={2}>
            {distanceLabel ? `${distanceLabel} · ` : ''}
            {listing.locality}, {listing.district}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={13} color={neutral[400]} style={styles.infoIcon} />
          <Text style={styles.posted} numberOfLines={1}>
            {postedLabel ? `Posted ${postedLabel}` : ' '}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
    {/* Mounted only while open, so idle cards carry no extra hooks or queries. */}
    {previewVisible ? (
      <ListingQuickView
        visible
        listing={listing}
        onClose={() => setPreviewVisible(false)}
        onOpenDetails={onPress}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
        showFavoriteButton={showFavoriteButton}
      />
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.15,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: secondary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    margin: spacing.xs,
  },
  conditionBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  conditionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: primary[600],
  },
  content: {
    padding: 10,
  },
  title: {
    height: 36,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: neutral[800],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  price: {
    flexShrink: 0,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: primary[500],
  },
  unit: {
    flexShrink: 1,
    fontSize: 12,
    color: neutral[400],
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stockText: {
    flex: 1,
    fontSize: 12,
    color: neutral[500],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: secondary[500],
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 3,
  },
  infoIcon: {
    marginTop: 1.5,
  },
  locality: {
    flex: 1,
    // Two lines reserved (like the title) so long place names never push a card taller than its neighbour.
    minHeight: 32,
    fontSize: 12,
    lineHeight: 16,
    color: neutral[600],
  },
  posted: {
    flex: 1,
    fontSize: 12,
    color: neutral[400],
  },
});
