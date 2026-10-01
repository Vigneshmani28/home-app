import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/layout';
import { useAuth } from '@/features/auth/services/auth-context';
import { PhoneContactButton, SignInToContactButton, WhatsAppContactButton } from '@/features/enquiries/components';
import { FavoriteAuthRequiredError, useFavoriteIds, useToggleFavorite } from '@/features/favorites/hooks';
import { ListingImageGallery } from '@/features/listings/components';
import { useListing } from '@/features/listings/hooks';
import type { ListingCondition } from '@/features/listings/types';
import { accent, neutral, primary, secondary, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatDate, formatPostedDate, formatPrice, formatQuantity } from '@/utils/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Sharing is switched off for now: it needs web links (universal links / app links) so a shared listing
// can open the app or send people to the store. Flip this on once that is set up.
const SHARE_ENABLED = false;

const CONDITION_LABELS: Record<ListingCondition, string> = {
  unused: 'Unused',
  like_new: 'Like New',
  good: 'Good',
  used: 'Used',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: listing, isLoading, isError } = useListing(id);
  const { user } = useAuth();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const isOwner = !!user && !!listing && user.id === listing.seller_id;
  const isFavorited = !!listing && !!favoriteIds.data?.includes(listing.id);

  const onToggleFavorite = () => {
    if (!listing) return;
    toggleFavorite.mutate(
      { listingId: listing.id, isFavorited },
      {
        onError: (error) => {
          if (error instanceof FavoriteAuthRequiredError) {
            router.push('/(auth)/login');
          }
        },
      },
    );
  };

  const onShare = () => {
    if (!listing) return;
    Share.share({
      message: `${listing.title} — ${formatPrice(listing.price)} in ${listing.locality}, ${listing.district} on Construction Marketplace`,
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Listing" showBack />
        <ActivityIndicator style={styles.loader} />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Listing" showBack />
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={44} color={neutral[300]} />
          <Text style={styles.notFoundTitle}>Listing not found</Text>
          <Text style={styles.notFoundText}>It may have been removed by the seller.</Text>
          <Button mode="contained" onPress={() => router.replace('/(tabs)')} style={styles.notFoundButton}>
            Back to Home
          </Button>
        </View>
      </View>
    );
  }

  const images = (listing.listing_images ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => img.storage_path);

  const hasDiscount = !!listing.original_price && listing.original_price > listing.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - listing.price / (listing.original_price as number)) * 100)
    : 0;
  const isAvailable = listing.status === 'active';
  // The number entered on the listing itself; older listings fall back to the seller's public profile number.
  const contactPhone = listing.contact_phone ?? listing.seller?.phone ?? null;
  const sellerName = listing.seller?.full_name ?? 'Seller';
  const sellerInitial = sellerName.trim().charAt(0).toUpperCase() || '?';

  const specs: { icon: IconName; label: string; value: string }[] = [
    { icon: 'cube-outline', label: 'Quantity', value: formatQuantity(listing.quantity, listing.unit) },
    { icon: 'sparkles-outline', label: 'Condition', value: CONDITION_LABELS[listing.condition] },
  ];
  if (listing.brand) specs.push({ icon: 'ribbon-outline', label: 'Brand', value: listing.brand });
  if (listing.manufacture_date) {
    specs.push({ icon: 'construct-outline', label: 'Manufactured', value: formatDate(listing.manufacture_date) ?? '' });
  }
  if (listing.expiry_date) {
    specs.push({ icon: 'hourglass-outline', label: 'Expires', value: formatDate(listing.expiry_date) ?? '' });
  }
  specs.push({ icon: 'calendar-outline', label: 'Posted', value: formatPostedDate(listing.created_at) ?? '' });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
          <ListingImageGallery storagePaths={images} />
          <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
            <RoundButton
              icon="chevron-back"
              label="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            />
            <View style={styles.topBarRight}>
              {SHARE_ENABLED ? (
                <RoundButton icon="share-social-outline" label="Share listing" onPress={onShare} />
              ) : null}
              <RoundButton
                icon={isFavorited ? 'heart' : 'heart-outline'}
                label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                color={isFavorited ? semantic.error : '#FFFFFF'}
                onPress={onToggleFavorite}
              />
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.badgeRow}>
            {!isAvailable ? (
              <View style={[styles.statusBadge, styles.statusBadgeInactive]}>
                <Text style={styles.statusBadgeText}>{listing.status.toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>AVAILABLE</Text>
              </View>
            )}
            {isOwner ? (
              <View style={[styles.statusBadge, styles.ownerBadge]}>
                <Text style={[styles.statusBadgeText, styles.ownerBadgeText]}>YOUR LISTING</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            {hasDiscount ? (
              <>
                <Text style={styles.originalPrice}>{formatPrice(listing.original_price as number)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              </>
            ) : null}
          </View>
          <Text style={styles.priceNote}>Total price for {formatQuantity(listing.quantity, listing.unit)}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={accent[500]} />
            <Text style={styles.locationText}>
              {listing.locality}, {listing.district}
            </Text>
          </View>

          <View style={styles.optionRow}>
            <OptionChip icon="bicycle-outline" label="Pickup" enabled={listing.pickup_available} />
            <OptionChip icon="cube-outline" label="Delivery" enabled={listing.delivery_available} />
          </View>

          <Section title="Details">
            <View style={styles.specGrid}>
              {specs.map((spec) => (
                <View key={spec.label} style={styles.specTile}>
                  <View style={styles.specIcon}>
                    <Ionicons name={spec.icon} size={18} color={primary[500]} />
                  </View>
                  <View style={styles.specText}>
                    <Text style={styles.specLabel}>{spec.label}</Text>
                    <Text style={styles.specValue} numberOfLines={1}>
                      {spec.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>

          {listing.description ? (
            <Section title="Description">
              <Text style={styles.description}>{listing.description}</Text>
            </Section>
          ) : null}

          {listing.seller ? (
            <Section title="Seller">
              <View style={styles.sellerCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{sellerInitial}</Text>
                </View>
                <View style={styles.sellerText}>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {sellerName}
                  </Text>
                  <Text style={styles.sellerMeta} numberOfLines={1}>
                    {[listing.seller.locality, listing.seller.district].filter(Boolean).join(', ') || 'Tamil Nadu'}
                  </Text>
                  {user && contactPhone ? (
                    <View style={styles.sellerPhoneRow}>
                      <Ionicons name="call" size={13} color={primary[500]} />
                      <Text style={styles.sellerPhone}>{contactPhone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky action bar: the primary action is always one tap away. */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {isOwner ? (
          <Button
            mode="contained"
            icon='pencil'
            onPress={() => router.push(`/edit-listing/${listing.id}`)}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.actionLabel}
            style={styles.primaryAction}>
            Edit Listing
          </Button>
        ) : !user ? (
          <SignInToContactButton />
        ) : contactPhone ? (
          <>
            <WhatsAppContactButton phone={contactPhone} listingTitle={listing.title} />
            <PhoneContactButton phone={contactPhone} />
          </>
        ) : (
          <View style={styles.noContact}>
            <Ionicons name="call-outline" size={18} color={neutral[300]} />
            <Text style={styles.noContactText}>The seller hasn&apos;t shared a contact number yet.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  color = '#FFFFFF',
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={color} />
    </Pressable>
  );
}

function OptionChip({ icon, label, enabled }: { icon: IconName; label: string; enabled: boolean }) {
  return (
    <View style={[styles.optionChip, !enabled && styles.optionChipOff]}>
      <Ionicons name={enabled ? 'checkmark-circle' : 'close-circle-outline'} size={16} color={enabled ? primary[500] : neutral[300]} />
      <Ionicons name={icon} size={16} color={enabled ? primary[500] : neutral[300]} />
      <Text style={[styles.optionText, !enabled && styles.optionTextOff]}>
        {label} {enabled ? 'available' : 'not offered'}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: secondary[200],
  },
  loader: {
    marginTop: spacing.xl,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: neutral[700],
  },
  notFoundText: {
    fontSize: 14,
    color: neutral[400],
  },
  notFoundButton: {
    marginTop: spacing.md,
    borderRadius: 14,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  pressed: {
    opacity: 0.7,
  },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: secondary[200],
    padding: spacing.lg,
    paddingTop: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: primary[50],
  },
  statusBadgeInactive: {
    backgroundColor: secondary[500],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.success,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: primary[600],
  },
  ownerBadge: {
    backgroundColor: accent[50],
  },
  ownerBadgeText: {
    color: accent[600],
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: neutral[800],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  price: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: primary[500],
  },
  priceNote: {
    marginTop: 2,
    fontSize: 13,
    color: neutral[400],
  },
  originalPrice: {
    fontSize: 16,
    color: neutral[300],
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: accent[50],
  },
  discountText: {
    fontSize: 12,
    fontWeight: '800',
    color: accent[600],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: neutral[500],
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: primary[50],
  },
  optionChipOff: {
    backgroundColor: secondary[300],
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: primary[600],
  },
  optionTextOff: {
    color: neutral[400],
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
  },
  specIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[50],
  },
  specText: {
    flex: 1,
  },
  specLabel: {
    fontSize: 11,
    color: neutral[400],
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: neutral[700],
  },
  description: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
    fontSize: 15,
    lineHeight: 23,
    color: neutral[600],
    overflow: 'hidden',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[500],
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sellerText: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: neutral[800],
  },
  sellerMeta: {
    marginTop: 2,
    fontSize: 13,
    color: neutral[400],
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: secondary[400],
  },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
  },
  actionButtonContent: {
    height: 52,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  noContact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 16,
    backgroundColor: secondary[200],
  },
  noContactText: {
    fontSize: 13,
    color: neutral[400],
  },
  sellerPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  sellerPhone: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[600],
  },
});
