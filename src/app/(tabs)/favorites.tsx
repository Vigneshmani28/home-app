import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/feedback';
import { ScreenHeader } from '@/components/layout';
import { useAuth } from '@/features/auth/services/auth-context';
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks';
import { ListingCard } from '@/features/listings/components';
import { spacing } from '@/theme/spacing';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { data: favorites, isLoading, isRefetching, refetch } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScreenHeader title="Favorites" subtitle="Listings you have saved" />
        <View style={styles.signedOut}>
          <EmptyState
            icon="heart-outline"
            title="Sign in to save favorites"
            message="Keep track of the materials you like and find them again in one tap."
            primaryAction={{ label: 'Sign In', icon: 'log-in-outline', onPress: () => router.push('/(auth)/login') }}
            secondaryAction={{ label: 'Create account', onPress: () => router.push('/(auth)/register') }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const items = (favorites ?? []).filter((favorite) => favorite.listing);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title="Favorites" subtitle="Listings you have saved" />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const listing = item.listing!;
            return (
              <View style={styles.gridItem}>
                <ListingCard
                  listing={{
                    id: listing.id,
                    title: listing.title,
                    price: listing.price,
                    quantity: listing.quantity,
                    unit: listing.unit,
                    condition: listing.condition,
                    district: listing.district,
                    locality: listing.locality,
                    status: listing.status,
                    imagePath: listing.listing_images?.[0]?.storage_path ?? null,
                    createdAt: listing.created_at,
                  }}
                  isFavorited
                  onToggleFavorite={() => toggleFavorite.mutate({ listingId: listing.id, isFavorited: true })}
                  onPress={() => router.push(`/listing/${listing.id}`)}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No favorites yet"
              message="Tap the heart on any listing to save it here."
              primaryAction={{ label: 'Explore listings', icon: 'compass-outline', onPress: () => router.push('/(tabs)/explore') }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  signedOut: {
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  columnWrapper: {
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
