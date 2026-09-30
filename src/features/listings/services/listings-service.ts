import { supabase } from '@/lib/supabase/client';
import type { ListingCondition, ListingStatus } from '@/lib/supabase/types';

import type {
  Listing,
  ListingInsert,
  ListingUpdate,
  ListingCursor,
  ListingWithImages,
  SearchListingsParams,
} from '../types';

const LISTING_WITH_IMAGES_SELECT = '*, listing_images(*)';
const LISTING_WITH_SELLER_SELECT = '*, listing_images(*), seller:profiles_public(*)';

const DEFAULT_PAGE_SIZE = 20;

export interface CreateListingInput {
  categoryId: string;
  materialName: string;
  title: string;
  description?: string | null;
  quantity: number;
  unit: string;
  price: number;
  originalPrice?: number | null;
  condition: ListingCondition;
  brand?: string | null;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  district: string;
  locality: string;
  pincode?: string | null;
  /** Number shown to buyers for calling / WhatsApp on this listing. */
  contactPhone: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
}

function toListingInsert(input: CreateListingInput, sellerId: string): ListingInsert {
  return {
    seller_id: sellerId,
    category_id: input.categoryId,
    material_name: input.materialName,
    title: input.title,
    description: input.description || null,
    quantity: input.quantity,
    unit: input.unit,
    price: input.price,
    original_price: input.originalPrice ?? null,
    condition: input.condition,
    brand: input.brand || null,
    manufacture_date: input.manufactureDate || null,
    expiry_date: input.expiryDate || null,
    district: input.district,
    locality: input.locality,
    pincode: input.pincode || null,
    contact_phone: input.contactPhone,
    pickup_available: input.pickupAvailable,
    delivery_available: input.deliveryAvailable,
  };
}

/**
 * Creates a listing for the currently authenticated user. The seller_id is
 * always derived from the server-verified session (never trust a
 * client-supplied seller_id) — RLS also enforces this, but we fetch it here
 * so the insert payload is correct up front.
 */
export async function createListing(input: CreateListingInput): Promise<Listing> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to create a listing.');

  const { data, error } = await supabase
    .from('listings')
    .insert(toListingInsert(input, user.id))
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateListing(id: string, input: Partial<CreateListingInput>): Promise<Listing> {
  const update: ListingUpdate = {};
  if (input.categoryId !== undefined) update.category_id = input.categoryId;
  if (input.materialName !== undefined) update.material_name = input.materialName;
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description || null;
  if (input.quantity !== undefined) update.quantity = input.quantity;
  if (input.unit !== undefined) update.unit = input.unit;
  if (input.price !== undefined) update.price = input.price;
  if (input.originalPrice !== undefined) update.original_price = input.originalPrice ?? null;
  if (input.condition !== undefined) update.condition = input.condition;
  if (input.brand !== undefined) update.brand = input.brand || null;
  if (input.manufactureDate !== undefined) update.manufacture_date = input.manufactureDate || null;
  if (input.expiryDate !== undefined) update.expiry_date = input.expiryDate || null;
  if (input.district !== undefined) update.district = input.district;
  if (input.locality !== undefined) update.locality = input.locality;
  if (input.pincode !== undefined) update.pincode = input.pincode || null;
  if (input.contactPhone !== undefined) update.contact_phone = input.contactPhone;
  if (input.pickupAvailable !== undefined) update.pickup_available = input.pickupAvailable;
  if (input.deliveryAvailable !== undefined) update.delivery_available = input.deliveryAvailable;

  const { data, error } = await supabase.from('listings').update(update).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

export async function updateListingStatus(id: string, status: ListingStatus): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetches a single listing with its images and a joined public seller
 * summary. Uses the `profiles_public` view (not `profiles`) since RLS
 * restricts the base `profiles` table to owner-only reads.
 */
export async function getListingById(id: string): Promise<ListingWithImages | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_WITH_SELLER_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ListingWithImages | null;
}

export async function getMyListings(status?: ListingStatus): Promise<ListingWithImages[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to view your listings.');

  let request = supabase
    .from('listings')
    .select(LISTING_WITH_IMAGES_SELECT)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (status) {
    request = request.eq('status', status);
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as ListingWithImages[];
}

export interface SearchListingsResult {
  items: ListingWithImages[];
  /** Pass as `cursor` to load the next page; null when this was the last page. */
  nextCursor: ListingCursor | null;
}

/**
 * Text/filter browsing over the listings table (server-side filtering), paged with a keyset
 * cursor. Rows are ordered by (sort column, id) so the order is total and stable: no duplicates or
 * skipped rows when new listings arrive mid-scroll, and every page costs the same however deep
 * the user has scrolled (an offset page gets slower the further you go).
 */
export async function searchListings(params: SearchListingsParams): Promise<SearchListingsResult> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? 'newest';
  const column = sort === 'newest' ? 'created_at' : 'price';
  const ascending = sort === 'price_asc';

  let request = supabase
    .from('listings')
    .select(LISTING_WITH_IMAGES_SELECT)
    .eq('status', 'active');

  if (params.query) {
    const like = `%${params.query}%`;
    request = request.or(`title.ilike.${like},material_name.ilike.${like},description.ilike.${like}`);
  }
  if (params.categoryId) {
    request = request.eq('category_id', params.categoryId);
  }
  if (params.district) {
    request = request.eq('district', params.district);
  }
  if (params.condition) {
    request = request.eq('condition', params.condition);
  }
  if (params.minPrice !== undefined && params.minPrice !== null) {
    request = request.gte('price', params.minPrice);
  }
  if (params.maxPrice !== undefined && params.maxPrice !== null) {
    request = request.lte('price', params.maxPrice);
  }

  // Continue strictly after the cursor row: (column, id) compared as a pair in the sort direction.
  if (params.cursor) {
    const op = ascending ? 'gt' : 'lt';
    const { value, id } = params.cursor;
    request = request.or(`${column}.${op}.${value},and(${column}.eq.${value},id.${op}.${id})`);
  }

  // One extra row tells us whether another page exists, so the last page needs no empty follow-up request.
  const { data, error } = await request
    .order(column, { ascending })
    .order('id', { ascending })
    .limit(pageSize + 1);
  if (error) throw error;

  const rows = (data ?? []) as ListingWithImages[];
  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? { value: column === 'created_at' ? last.created_at : last.price, id: last.id } : null,
  };
}
