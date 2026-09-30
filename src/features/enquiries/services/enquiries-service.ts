import { supabase } from '@/lib/supabase/client';

import type { Enquiry, EnquiryWithBuyerAndListing, EnquiryWithListing } from '../types';

export class SelfEnquiryError extends Error {
  constructor() {
    super("You can't enquire on your own listing.");
    this.name = 'SelfEnquiryError';
  }
}

export interface CreateEnquiryInput {
  listingId: string;
  message: string;
  /**
   * Optional — pass this when the caller already has the listing loaded
   * (e.g. the listing detail screen) to avoid an extra round trip. If
   * omitted, it's fetched here so we can still pre-check the self-enquiry
   * case client-side before hitting the DB.
   */
  sellerId?: string;
}

/**
 * Creates an enquiry for the currently authenticated buyer. buyer_id is
 * always derived from the server-verified session (never trust a
 * client-supplied buyer id) — RLS also enforces this via WITH CHECK, but we
 * pre-check the self-enquiry case client-side first so we can show a
 * friendly error instead of a raw RLS/Postgres error.
 */
export async function createEnquiry(input: CreateEnquiryInput): Promise<Enquiry> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to send an enquiry.');

  let sellerId = input.sellerId;
  if (!sellerId) {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', input.listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    sellerId = listing?.seller_id;
  }

  if (sellerId === user.id) {
    throw new SelfEnquiryError();
  }

  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      listing_id: input.listingId,
      buyer_id: user.id,
      message: input.message,
      contact_method: 'in_app',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/** Enquiries the current user sent, as a buyer, joined with the listing they're about. */
export async function getMyEnquiries(): Promise<EnquiryWithListing[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*, listing:listings(id, title, price)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as EnquiryWithListing[];
}

/**
 * Enquiries received on listings the current user sells. RLS already
 * restricts visible rows to enquiries on the caller's own listings, so a
 * straightforward select with joins is safe here.
 */
export async function getEnquiriesForMyListings(): Promise<EnquiryWithBuyerAndListing[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*, listing:listings(id, title, price, seller_id), buyer:profiles_public(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as EnquiryWithBuyerAndListing[];
}
