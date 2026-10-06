import * as SecureStore from 'expo-secure-store';

import { supabase } from '@/lib/supabase/client';

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const DEVICE_ID_KEY = 'myhome.device-id';

let cachedDeviceId: string | null = null;
/** Listings already reported this session, so reopening one doesn't even hit the network. */
const reportedThisSession = new Set<string>();

function randomId(): string {
  const bytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16));
  return bytes.join('');
}

/** A random id for this install, used to de-duplicate views from guests. Stable across launches. */
async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
    const created = randomId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
    cachedDeviceId = created;
    return created;
  } catch {
    // Storage unavailable: use an id for this session only (the server still de-duplicates by it).
    cachedDeviceId = cachedDeviceId ?? randomId();
    return cachedDeviceId;
  }
}

/**
 * Reports that the current viewer opened a listing. The server decides whether it counts: only the
 * first view per viewer (user id when signed in, device id for guests) is stored, and the seller's
 * own views are ignored. Fire-and-forget: never throws, since a failed view must not break the screen.
 */
export async function recordListingView(listingId: string): Promise<void> {
  if (reportedThisSession.has(listingId)) return;
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.rpc('record_listing_view', {
      p_listing_id: listingId,
      p_device_id: deviceId,
    });
    // Only remember on success so a network blip is retried the next time the listing is opened.
    if (!error) reportedThisSession.add(listingId);
  } catch {
    // Offline etc. — try again on a later open.
  }
}

/** Unique-view counts for the signed-in seller's listings, keyed by listing id. */
export async function getMyListingViewCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('my_listing_view_counts');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.listing_id, Number(row.view_count)]));
}
