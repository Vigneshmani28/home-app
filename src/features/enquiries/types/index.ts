import type { Database } from '@/lib/supabase/types';

export type Enquiry = Database['public']['Tables']['enquiries']['Row'];
export type EnquiryInsert = Database['public']['Tables']['enquiries']['Insert'];
export type ProfilePublic = Database['public']['Views']['profiles_public']['Row'];

/** A buyer's own enquiry, joined with the listing it was made on. */
export interface EnquiryWithListing extends Enquiry {
  listing: {
    id: string;
    title: string;
    price: number;
  } | null;
}

/** An enquiry received on one of the current user's listings, for the seller inbox. */
export interface EnquiryWithBuyerAndListing extends Enquiry {
  listing: {
    id: string;
    title: string;
    price: number;
    seller_id: string;
  } | null;
  buyer: Pick<ProfilePublic, 'id' | 'full_name' | 'avatar_url'> | null;
}
