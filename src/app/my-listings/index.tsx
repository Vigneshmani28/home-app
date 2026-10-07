import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog, EmptyState } from '@/components/feedback';
import { ScreenHeader } from '@/components/layout';
import { ListingActionSheet, type ListingAction } from '@/features/listings/components';
import { useDeleteListing, useMyListings, useMyListingViewCounts, useUpdateListingStatus } from '@/features/listings/hooks';
import { getPublicImageUrl } from '@/features/listings/services';
import type { ListingStatus, ListingWithImages } from '@/features/listings/types';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatPrice, formatQuantity } from '@/utils/format';

const TABS: { label: string; value: ListingStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Sold', value: 'sold' },
  { label: 'Inactive', value: 'inactive' },
];

const EMPTY_COPY: Record<ListingStatus, { title: string; message: string }> = {
  active: { title: 'No active listings', message: 'Post your surplus materials and reach buyers in your district.' },
  reserved: { title: 'Nothing reserved', message: 'Listings you mark as reserved for a buyer will appear here.' },
  sold: { title: 'Nothing sold yet', message: 'Listings you mark as sold will appear here.' },
  inactive: { title: 'No inactive listings', message: 'Listings you deactivate will appear here.' },
  expired: { title: 'No expired listings', message: 'Listings that have passed their expiry will appear here.' },
  draft: { title: 'No drafts', message: 'Unfinished listings will appear here.' },
  deleted: { title: 'Nothing here', message: 'Deleted listings are not shown.' },
};

export default function MyListingsScreen() {
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  // Tabs that have been shown at least once stay mounted, so swiping back doesn't reload them.
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  // While a tab tap is animating the pager, ignore the scroll events so tabs it passes aren't loaded.
  const animatingToTab = useRef(false);
  const { data: viewCounts, refetch: refetchViews } = useMyListingViewCounts();
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();

  const [menuFor, setMenuFor] = useState<ListingWithImages | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListingWithImages | null>(null);

  const markVisited = (i: number) => setVisited((previous) => (previous.has(i) ? previous : new Set(previous).add(i)));

  const goToTab = (i: number) => {
    if (i === index) return;
    animatingToTab.current = true;
    setIndex(i);
    markVisited(i);
    pagerRef.current?.scrollTo({ x: i * width, animated: true });
    // Fallback in case the momentum-end event doesn't fire for a programmatic scroll.
    setTimeout(() => {
      animatingToTab.current = false;
    }, 450);
  };

  const onPagerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (animatingToTab.current) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index && next >= 0 && next < TABS.length) {
      setIndex(next);
      markVisited(next);
    }
  };

  const onPagerSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    animatingToTab.current = false;
    const settled = Math.round(event.nativeEvent.contentOffset.x / width);
    if (settled >= 0 && settled < TABS.length) {
      setIndex(settled);
      markVisited(settled);
    }
  };

  const onAction = (listing: ListingWithImages, action: ListingAction) => {
    setMenuFor(null);
    switch (action) {
      case 'sold':
        updateStatus.mutate({ id: listing.id, status: 'sold' });
        break;
      case 'reserved':
        updateStatus.mutate({ id: listing.id, status: 'reserved' });
        break;
      case 'reactivate':
        updateStatus.mutate({ id: listing.id, status: 'active' });
        break;
      case 'deactivate':
        updateStatus.mutate({ id: listing.id, status: 'inactive' });
        break;
      case 'delete':
        setDeleteTarget(listing);
        break;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteListing.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="My Listings" subtitle="Manage what you are selling" showBack />
      <View style={styles.tabBar} accessibilityRole="tablist">
        {TABS.map((tab, i) => {
          const selected = index === i;
          return (
            <Pressable
              key={tab.value}
              onPress={() => goToTab(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.tabPressed]}>
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        bounces={false}
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onPagerScroll}
        onMomentumScrollEnd={onPagerSettled}
        style={styles.pager}>
        {TABS.map((tab, i) => (
          <View key={tab.value} style={{ width }}>
            {Math.abs(i - index) <= 1 || visited.has(i) ? (
              <StatusPage
                status={tab.value}
                viewCounts={viewCounts}
                onRefreshViews={() => void refetchViews()}
                onOpenMenu={setMenuFor}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>

      <ListingActionSheet listing={menuFor} onClose={() => setMenuFor(null)} onAction={onAction} />

      <ConfirmDialog
        visible={!!deleteTarget}
        onDismiss={() => setDeleteTarget(null)}
        tone="danger"
        icon="trash-outline"
        title="Delete this listing?"
        message={`"${deleteTarget?.title ?? ''}" will be removed and no longer shown to anyone. This cannot be undone.`}
        confirmLabel="Delete listing"
        onConfirm={confirmDelete}
        loading={deleteListing.isPending}
      />
    </SafeAreaView>
  );
}

/** One tab's listings. Mounted lazily by the pager, so each status is only fetched once it is near. */
function StatusPage({
  status,
  viewCounts,
  onRefreshViews,
  onOpenMenu,
}: {
  status: ListingStatus;
  viewCounts?: Record<string, number>;
  onRefreshViews: () => void;
  onOpenMenu: (listing: ListingWithImages) => void;
}) {
  const { data: listings, isLoading, refetch, isRefetching } = useMyListings(status);

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <FlatList
      data={listings ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
        onRefreshViews();
      }}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Pressable style={styles.rowMain} onPress={() => router.push(`/listing/${item.id}`)}>
            {item.listing_images?.[0]?.storage_path ? (
              <Image
                source={{ uri: getPublicImageUrl(item.listing_images[0].storage_path) }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="image-outline" size={28} color={neutral[300]} />
              </View>
            )}
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {formatQuantity(item.quantity, item.unit)} · {item.locality}, {item.district}
              </Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={item.status} />
                <View style={styles.viewsWrap}>
                  <Ionicons name="eye-outline" size={14} color={neutral[400]} />
                  <Text style={styles.viewsText}>
                    {viewCounts?.[item.id] ?? 0} {(viewCounts?.[item.id] ?? 0) === 1 ? 'view' : 'views'}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon="pencil"
              compact
              onPress={() => router.push(`/edit-listing/${item.id}`)}
              style={styles.editAction}>
              Edit
            </Button>
            <Pressable
              onPress={() => onOpenMenu(item)}
              accessibilityRole="button"
              accessibilityLabel="More actions"
              style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={neutral[600]} />
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="pricetags-outline"
          title={EMPTY_COPY[status].title}
          message={EMPTY_COPY[status].message}
          primaryAction={
            status === 'active'
              ? { label: 'Post a listing', icon: 'add', onPress: () => router.push('/new-listing') }
              : undefined
          }
        />
      }
    />
  );
}

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: 'Active', bg: primary[50], fg: primary[600] },
  reserved: { label: 'Reserved', bg: '#FDF1D8', fg: '#8A5A00' },
  sold: { label: 'Sold', bg: secondary[400], fg: neutral[600] },
  inactive: { label: 'Inactive', bg: secondary[400], fg: neutral[500] },
  expired: { label: 'Expired', bg: '#FBE4E4', fg: '#9B2C2C' },
  draft: { label: 'Draft', bg: secondary[400], fg: neutral[500] },
};

function StatusBadge({ status }: { status: ListingStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: neutral[400],
  },
  safeArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: secondary[500],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabSelected: {
    borderBottomColor: primary[500],
  },
  tabPressed: {
    backgroundColor: secondary[200],
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: neutral[400],
  },
  tabLabelSelected: {
    fontWeight: '800',
    color: primary[600],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: secondary[400],
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  rowMain: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumb: {
    width: 104,
    height: 104,
    borderRadius: 14,
  },
  thumbPlaceholder: {
    backgroundColor: secondary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: neutral[800],
  },
  rowPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: primary[500],
  },
  rowMeta: {
    fontSize: 12,
    color: neutral[400],
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: secondary[500],
  },
  editAction: {
    flex: 1,
    borderRadius: 12,
  },
  moreButton: {
    width: 44,
    height: 40,
    borderRadius: 12,
    backgroundColor: secondary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: spacing.xl,
  },
  pager: {
    flex: 1,
  },
});
