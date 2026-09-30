import type { Database } from '@/lib/supabase/types';
import type { ListingWithImages } from '@/features/listings/types';

export type Favorite = Database['public']['Tables']['favorites']['Row'];

/** A favorite row joined with its listing (and the listing's images). */
export interface FavoriteWithListing extends Favorite {
  listing: ListingWithImages | null;
}
