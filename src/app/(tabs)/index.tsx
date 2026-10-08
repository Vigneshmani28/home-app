import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/feedback';
import { RollingSearchbar } from '@/components/forms';
import { SEARCH_SUGGESTIONS } from '@/constants/search-suggestions';
import { bannersQueryKey } from '@/features/banners/hooks';
import { CategoryGrid } from '@/features/categories/components';
import type { Category } from '@/features/categories/types';
import { useDistrict } from '@/features/district/hooks';
import {
  FavoriteAuthRequiredError,
  useFavoriteIds,
  useToggleFavorite,
} from '@/features/favorites/hooks';
import { HomeHeader, HomeHero } from '@/features/home/components';
import { ListingCard, ListingGridSkeleton } from '@/features/listings/components';
import { useSearchListings } from '@/features/listings/hooks';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Home shows a taste of each section; "View all" opens Explore for the full list.
const HOME_CATEGORY_COUNT = 4;
const HOME_RECENT_COUNT = 10;

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const { district, isResolving, selectDistrict } = useDistrict();
  const queryClient = useQueryClient();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  // Wait for the district to resolve so the list doesn't flash all-Tamil-Nadu results first.
  const recent = useSearchListings(
    { sort: 'newest', district },
    { enabled: !isResolving, pageSize: HOME_RECENT_COUNT },
  );

  const onSearchSubmit = () => {
    router.push({ pathname: '/(tabs)/explore', params: { q: searchText, ts: String(Date.now()) } });
  };

  const openExplore = (params: { expand?: string } = {}) => {
    router.push({ pathname: '/(tabs)/explore', params: { ...params, ts: String(Date.now()) } });
  };

  const onSelectCategory = (category: Category) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { categoryId: category.id, ts: String(Date.now()) },
    });
  };

  const onToggleFavorite = (listingId: string) => {
    const isFavorited = !!favoriteIds.data?.includes(listingId);
    toggleFavorite.mutate(
      { listingId, isFavorited },
      {
        onError: (error) => {
          if (error instanceof FavoriteAuthRequiredError) {
            router.push('/(auth)/login');
          }
        },
      },
    );
  };

  const recentItems = (recent.data?.pages.flatMap((page) => page.items) ?? []).slice(
    0,
    HOME_RECENT_COUNT,
  );

  const isRefreshing = recent.isRefetching;
  const onRefresh = () => {
    void recent.refresh();
    void queryClient.invalidateQueries({ queryKey: bannersQueryKey });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <FlatList
        data={recentItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={!!isRefreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <HomeHeader />
            <HomeHero
              onExplore={() => openExplore()}
              onSell={() => router.push('/new-listing')}
              onCategory={(categoryId) =>
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { categoryId, ts: String(Date.now()) },
                })
              }
            />

            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <RollingSearchbar
                  words={SEARCH_SUGGESTIONS}
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={onSearchSubmit}
                />
              </View>
            </View>

            <SectionHeader title="Categories" onViewAll={() => openExplore({ expand: '1' })} />
            <CategoryGrid onSelect={onSelectCategory} maxItems={HOME_CATEGORY_COUNT} />

            <SectionHeader
              title={district ? `Recently posted in ${district}` : 'Recently Posted'}
              onViewAll={() => openExplore()}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ListingCard
              listing={{
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                unit: item.unit,
                condition: item.condition,
                district: item.district,
                locality: item.locality,
                status: item.status,
                imagePath: item.listing_images?.[0]?.storage_path ?? null,
                imageCount: item.listing_images?.length ?? 0,
                createdAt: item.created_at,
              }}
              isFavorited={!!favoriteIds.data?.includes(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
              onPress={() => router.push(`/listing/${item.id}`)}
            />
          </View>
        )}
        ListFooterComponent={
          recentItems.length > 0 ? (
            <Pressable
              onPress={() => openExplore()}
              accessibilityRole="button"
              accessibilityLabel="Browse all listings in Explore"
              style={({ pressed }) => [styles.seeMore, pressed && styles.pressed]}
            >
              <View style={styles.seeMoreText}>
                <Text style={styles.seeMoreTitle}>Looking for more?</Text>
                <Text style={styles.seeMoreBody}>
                  {district
                    ? `Browse every listing in ${district} and filter by category, price and more.`
                    : 'Browse every listing and filter by category, price and more.'}
                </Text>
              </View>
              <View style={styles.seeMoreArrow}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          recent.isLoading || isResolving ? (
            <ListingGridSkeleton count={HOME_RECENT_COUNT} />
          ) : (
            <EmptyState
              icon="storefront-outline"
              title={district ? `No listings in ${district} yet` : 'No listings yet'}
              message={
                district
                  ? 'Be the first to post materials here, or look at what is available across Tamil Nadu.'
                  : 'Be the first to post materials for sale in your area.'
              }
              primaryAction={{
                label: 'Post a listing',
                icon: 'add',
                onPress: () => router.push('/new-listing'),
              }}
              secondaryAction={
                district
                  ? {
                      label: 'See all Tamil Nadu',
                      icon: 'earth-outline',
                      onPress: () => selectDistrict(null),
                    }
                  : undefined
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, onViewAll }: { title: string; onViewAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        onPress={onViewAll}
        accessibilityRole="button"
        accessibilityLabel={`View all: ${title}`}
        hitSlop={8}
        style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
      >
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={15} color={primary[500]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchWrap: {
    flex: 1,
  },
  filterButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[50],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: neutral[800],
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: primary[500],
  },
  pressed: {
    opacity: 0.6,
  },
  seeMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: primary[50],
    borderWidth: 1,
    borderColor: primary[100],
  },
  seeMoreText: {
    flex: 1,
  },
  seeMoreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: primary[600],
  },
  seeMoreBody: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: neutral[500],
  },
  seeMoreArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
