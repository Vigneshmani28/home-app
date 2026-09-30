import { supabase } from '@/lib/supabase/client';

import type { Profile, ProfileUpdate } from '../types';

export interface UpdateProfileInput {
  fullName: string;
  phone?: string | null;
  district?: string | null;
  locality?: string | null;
  pincode?: string | null;
  showPhonePublicly: boolean;
}

/** Fetches the current user's own profile row (owner-only per RLS). */
export async function getMyProfile(): Promise<Profile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to view your profile.');

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  return data;
}

/**
 * Updates the current user's own profile row. The row id is always derived
 * from the server-verified session (never trust a client-supplied id) —
 * RLS also restricts updates to `auth.uid() = id`, but we scope the query
 * here too so the request is correct up front.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to update your profile.');

  const update: ProfileUpdate = {
    full_name: input.fullName,
    phone: input.phone || null,
    district: input.district || null,
    locality: input.locality || null,
    pincode: input.pincode || null,
    show_phone_publicly: input.showPhonePublicly,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
