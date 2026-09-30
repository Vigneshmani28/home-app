import { supabase } from '@/lib/supabase/client';

import type { FavoriteWithListing } from '../types';

export async function addFavorite(listingId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to save favorites.');

  const { error } = await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
  if (error) throw error;
}

export async function removeFavorite(listingId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to manage favorites.');

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId);
  if (error) throw error;
}

/** Lightweight favorite listing ids only, for cheap "is this favorited" checks. */
export async function getMyFavoriteListingIds(): Promise<string[]> {
  const { data, error } = await supabase.from('favorites').select('listing_id');
  if (error) throw error;
  return (data ?? []).map((row) => row.listing_id);
}

export async function getMyFavorites(): Promise<FavoriteWithListing[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, listing:listings(*, listing_images(*))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as FavoriteWithListing[];
}
