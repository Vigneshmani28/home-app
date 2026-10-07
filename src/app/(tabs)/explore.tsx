import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/feedback';
import { ScreenHeader } from '@/components/layout';
import { ionicon } from '@/components/ui';
import { CategoryChip, CategoryGrid } from '@/features/categories/components';
import { useCategories } from '@/features/categories/hooks';
import { DistrictSelector } from '@/features/district/components';
import { useDistrict } from '@/features/district/hooks';
import { FavoriteAuthRequiredError, useFavoriteIds, useToggleFavorite } from '@/features/favorites/hooks';
import { DEFAULT_LISTING_SORT, ListingCard, ListingGridSkeleton, SortSheet, type ListingSort } from '@/features/listings/components';
import { useSearchListings } from '@/features/listings/hooks';
import type { ListingCondition } from '@/features/listings/types';
import { accent, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Ionicons } from '@expo/vector-icons';

const CONDITIONS: { label: string; value: ListingCondition }[] = [
  { label: 'Unused', value: 'unused' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Used', value: 'used' },
];

// Categories shown while the grid is folded (one row).
const COLLAPSED_CATEGORY_COUNT = 4;

// Debounce delay for the search text input, in ms.
const SEARCH_DEBOUNCE_MS = 400;

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string; categoryId?: string; expand?: string; ts?: string }>();
  const { data: categories } = useCategories();
  // The district is app-wide state (same as Home) — not a local filter — so both tabs always agree.
  const { district, isResolving, selectDistrict } = useDistrict();
  const [categoriesExpanded, setCategoriesExpanded] = useState(params.expand === '1');
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const [searchInput, setSearchInput] = useState(params.q ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(params.q ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId ?? null);
  const [condition, setCondition] = useState<ListingCondition | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<ListingSort>(DEFAULT_LISTING_SORT);
  // Tab screens stay mounted, so re-apply params whenever navigation supplies new ones
  // (e.g. tapping a category or submitting a search on Home). `ts` changes on every push.
  const [appliedTs, setAppliedTs] = useState(params.ts);
  if (params.ts !== appliedTs) {
    setAppliedTs(params.ts);
    setCategoryId(params.categoryId ?? null);
    setSearchInput(params.q ?? '');
    setDebouncedSearch(params.q ?? '');
    // "View all" from Home's categories opens the full category grid.
    setCategoriesExpanded(params.expand === '1');
    setSort(DEFAULT_LISTING_SORT);
  }

  const listRef = useRef<FlatList>(null);
  const categoriesHeight = useRef(0);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // When a category is picked, bring the results into view below the category grid.
  useEffect(() => {
    if (categoryId) {
      listRef.current?.scrollToOffset({ offset: categoriesHeight.current, animated: true });
    }
  }, [categoryId]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const searchParams = useMemo(
    () => ({
      query: debouncedSearch || undefined,
      categoryId,
      district,
      condition,
      minPrice,
      maxPrice,
      sort,
    }),
    [debouncedSearch, categoryId, district, condition, minPrice, maxPrice, sort],
  );

  // Hold the query until the district is resolved so we never flash all-Tamil-Nadu results first.
  const activeQuery = useSearchListings(searchParams, { enabled: !isResolving });
  // Flatten the loaded pages. De-duplicated by id as a safeguard so a repeated row can never crash the list.
  const uniqueRows = new Map((activeQuery.data?.pages.flatMap((page) => page.items) ?? []).map((row) => [row.id, row]));
  const items = Array.from(uniqueRows.values()).map((item) => ({
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
    createdAt: item.created_at,
  }));
  const isLoading = activeQuery.isLoading || isResolving;

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

  const clearFilters = () => {
    setSearchInput('');
    setCategoryId(null);
    setCondition(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSort(DEFAULT_LISTING_SORT);
  };

  const sheetFilterCount = sort !== DEFAULT_LISTING_SORT ? 1 : 0;

  const hasActiveFilters =
    !!searchInput || !!categoryId || !!condition || minPrice !== null || maxPrice !== null || sort !== DEFAULT_LISTING_SORT;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Explore" subtitle="Browse materials in your area">
        <DistrictSelector iconColor={primary[100]} style={styles.districtPill} />
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search materials..."
            value={searchInput}
            onChangeText={setSearchInput}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            elevation={0}
            icon={ionicon('search-outline')}
            clearIcon={ionicon('close-circle')}
          />
          <Pressable
            onPress={() => setFilterSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Sort listings"
            style={styles.filterButton}>
            <Ionicons name="swap-vertical-outline" size={22} color={primary[500]} />
            {sheetFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{sheetFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </ScreenHeader>

      <FlatList
        ref={listRef}
        data={isLoading || activeQuery.isError ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            // isRefetching is also true while a next page loads; don't show the pull-to-refresh spinner for that.
            refreshing={activeQuery.isRefetching && !activeQuery.isFetchingNextPage}
            onRefresh={() => void activeQuery.refresh()}
          />
        }
        // Lazy loading: fetch the next page once the user scrolls near the end. The guards stop duplicate
        // requests while one is in flight or after a failed page (which shows a retry row instead).
        onEndReached={() => {
          if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage && !activeQuery.isFetchNextPageError) {
            void activeQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.6}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.filters}>
            <View
              style={styles.categories}
              onLayout={(event) => {
                categoriesHeight.current = event.nativeEvent.layout.height;
              }}>
              <CategoryGrid
                selectedId={categoryId}
                maxItems={categoriesExpanded ? undefined : COLLAPSED_CATEGORY_COUNT}
                onSelect={(category) => setCategoryId(categoryId === category.id ? null : category.id)}
              />
              {(categories?.length ?? 0) > COLLAPSED_CATEGORY_COUNT ? (
                <Pressable
                  onPress={() => setCategoriesExpanded((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: categoriesExpanded }}
                  style={styles.expandButton}>
                  <Text style={styles.expandText}>
                    {categoriesExpanded ? 'Show less' : `Show all ${categories?.length} categories`}
                  </Text>
                  <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={primary[500]} />
                </Pressable>
              ) : null}
            </View>
            <FlatList
              data={CONDITIONS}
              keyExtractor={(item) => item.value}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
              ListHeaderComponent={<Text style={styles.rowLabel}>Condition</Text>}
              renderItem={({ item }) => (
                <CategoryChip
                  label={item.label}
                  selected={condition === item.value}
                  onPress={() => setCondition(condition === item.value ? null : item.value)}
                />
              )}
            />
            <View style={styles.resultRow}>
              <Text style={styles.resultText}>
                {isLoading ? 'Searching…' : `${items.length}${activeQuery.hasNextPage ? '+' : ''} listings${district ? ` in ${district}` : ''}`}
              </Text>
              {hasActiveFilters ? (
                <Pressable onPress={clearFilters} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ListingCard
              listing={item}
              isFavorited={!!favoriteIds.data?.includes(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
              onPress={() => router.push(`/listing/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ListingGridSkeleton count={6} />
          ) : activeQuery.isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Couldn't load listings"
              message="Check your internet connection and try again."
              primaryAction={{ label: 'Try again', icon: 'refresh', onPress: () => void activeQuery.refetch() }}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No listings found"
              message={
                hasActiveFilters
                  ? `Nothing matches your search${district ? ` in ${district}` : ''}. Try removing a filter or searching for something else.`
                  : district
                    ? `There are no listings in ${district} yet.`
                    : 'There are no listings yet. Check back soon.'
              }
              primaryAction={
                hasActiveFilters
                  ? { label: 'Clear filters', icon: 'funnel-outline', onPress: clearFilters }
                  : undefined
              }
              secondaryAction={
                district
                  ? { label: 'See all Tamil Nadu', icon: 'earth-outline', onPress: () => selectDistrict(null) }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={
          activeQuery.isFetchingNextPage ? (
            <ListingGridSkeleton count={2} />
          ) : activeQuery.isFetchNextPageError ? (
            <Pressable onPress={() => void activeQuery.fetchNextPage()} style={styles.footerRow} accessibilityRole="button">
              <Text style={styles.footerRetry}>Couldn&apos;t load more. Tap to retry</Text>
            </Pressable>
          ) : items.length > 0 && !activeQuery.hasNextPage ? (
            <View style={styles.footerRow}>
              <Text style={styles.footerEnd}>You&apos;re all caught up</Text>
            </View>
          ) : null
        }
      />

      <SortSheet visible={filterSheetVisible} onDismiss={() => setFilterSheetVisible(false)} value={sort} onChange={setSort} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  districtPill: {
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  searchInput: {
    minHeight: 0,
    color: neutral[800],
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: accent[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filters: {
    gap: spacing.sm,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.sm,
  },
  categories: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[500],
  },
  pillRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  rowLabel: {
    marginRight: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  resultText: {
    fontSize: 13,
    color: neutral[400],
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[500],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  footerRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerEnd: {
    fontSize: 13,
    color: neutral[500],
  },
  footerRetry: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[500],
  },
});
