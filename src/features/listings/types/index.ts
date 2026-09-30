import type { Database, ListingCondition, ListingStatus } from '@/lib/supabase/types';

export type { ListingCondition, ListingStatus };

export type Listing = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];
export type ListingImage = Database['public']['Tables']['listing_images']['Row'];
export type ProfilePublic = Database['public']['Views']['profiles_public']['Row'];

/** A listing with its images and (optionally) a joined seller summary. */
export interface ListingWithImages extends Listing {
  listing_images: ListingImage[];
  seller?: ProfilePublic | null;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export interface SearchListingsParams {
  query?: string;
  categoryId?: string | null;
  district?: string | null;
  condition?: ListingCondition | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: SortOption;
  /** Where the previous page ended; omit for the first page. */
  cursor?: ListingCursor | null;
  pageSize?: number;
}

/**
 * Keyset-pagination bookmark: the sort value and id of the last listing on the previous page.
 * Unlike an offset, it stays correct when listings are added or removed between page loads.
 */
export interface ListingCursor {
  /** created_at (ISO string) for "newest", or price for the price sorts. */
  value: string | number;
  id: string;
}
