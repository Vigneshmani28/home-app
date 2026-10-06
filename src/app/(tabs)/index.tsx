import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/feedback';
import { TypingSearchbar } from '@/components/forms';
import { ScreenHeader } from '@/components/layout';
import { ionicon } from '@/components/ui';
import { useAuth } from '@/features/auth/services/auth-context';
import { CategoryGrid } from '@/features/categories/components';
import type { Category } from '@/features/categories/types';
import { DistrictSelector } from '@/features/district/components';
import { useDistrict } from '@/features/district/hooks';
import { FavoriteAuthRequiredError, useFavoriteIds, useToggleFavorite } from '@/features/favorites/hooks';
import { ListingCard } from '@/features/listings/components';
import { useSearchListings } from '@/features/listings/hooks';
import { neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Materials the search bar's placeholder types out one after another.
const SEARCH_SUGGESTIONS = [
  'cement',
  'bricks',
  'steel rods',
  'tiles',
  'paint',
  'plumbing pipes',
  'electrical wires',
  'roofing sheets',
  'doors & windows',
  'tools',
] as const;

// Home shows a taste of each section; "View all" opens Explore for the full list.
const HOME_CATEGORY_COUNT = 4;
const HOME_RECENT_COUNT = 10;

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const [searchText, setSearchText] = useState('');
  const { district, isResolving, selectDistrict } = useDistrict();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  // Wait for the district to resolve so the list doesn't flash all-Tamil-Nadu results first.
  const recent = useSearchListings({ sort: 'newest', district }, { enabled: !isResolving, pageSize: HOME_RECENT_COUNT });

  const greetingName = profile?.full_name || (user ? 'there' : 'Guest');

  const onSearchSubmit = () => {
    router.push({ pathname: '/(tabs)/explore', params: { q: searchText, ts: String(Date.now()) } });
  };

  const openExplore = (params: { expand?: string } = {}) => {
    router.push({ pathname: '/(tabs)/explore', params: { ...params, ts: String(Date.now()) } });
  };

  const onSelectCategory = (category: Category) => {
    router.push({ pathname: '/(tabs)/explore', params: { categoryId: category.id, ts: String(Date.now()) } });
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

  const recentItems = (recent.data?.pages.flatMap((page) => page.items) ?? []).slice(0, HOME_RECENT_COUNT);

  const isRefreshing = recent.isRefetching;
  const onRefresh = () => {
    void recent.refresh();
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
            <ScreenHeader
              title={`Hi, ${greetingName} 👋`}
              contentGap={12}
              right={
                <Image
                  source={require('../../../assets/home/home_top.webp')}
                  style={styles.headerArt}
                  contentFit="contain"
                  accessibilityLabel="Build. Recycle. Save more."
                />
              }>
              <DistrictSelector iconColor={primary[100]} />
              <Text style={styles.tagline}>Find surplus construction materials in your district</Text>
              <TypingSearchbar
                words={SEARCH_SUGGESTIONS}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={onSearchSubmit}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
                elevation={0}
                icon={ionicon('search-outline')}
                clearIcon={ionicon('close-circle')}
              />
            </ScreenHeader>

            <SectionHeader title="Categories" onViewAll={() => openExplore({ expand: '1' })} />
            <CategoryGrid onSelect={onSelectCategory} maxItems={HOME_CATEGORY_COUNT} />

            <SectionHeader
              title={district ? `Recently posted in ${district}` : 'Recently posted'}
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
                createdAt: item.created_at,
              }}
              isFavorited={!!favoriteIds.data?.includes(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
              onPress={() => router.push(`/listing/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          recent.isLoading || isResolving ? (
            <ActivityIndicator style={styles.loader} />
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
                onPress: () => router.push('/(tabs)/sell'),
              }}
              secondaryAction={
                district
                  ? { label: 'See all Tamil Nadu', icon: 'earth-outline', onPress: () => selectDistrict(null) }
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
        style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}>
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={15} color={primary[500]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent slogan artwork (white lettering + yellow swoosh) at the header's right edge.
  headerArt: {
    width: 118,
    height: 60,
    // The artwork is taller than the greeting; negative margins let it overhang so it doesn't stretch the row.
    marginVertical: -12,
  },
  safeArea: {
    flex: 1,
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
  tagline: {
    marginTop: 10,
    marginBottom: 14,
    fontSize: 12,
    color: primary[100],
  },
  searchbar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  searchInput: {
    minHeight: 0,
    color: neutral[800],
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
  loader: {
    marginVertical: spacing.lg,
  },
});
