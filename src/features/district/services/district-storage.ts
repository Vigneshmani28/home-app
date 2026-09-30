import * as SecureStore from 'expo-secure-store';

import { isTamilNaduDistrict, type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import type { DistrictSource } from '@/stores/slices/district-slice';

// SecureStore keys may only contain letters, digits, ".", "-" and "_" (no "@" or "/").
const STORAGE_KEY = 'myhome.selected-district';

function debug(message: string, error: unknown) {
  if (__DEV__) console.warn(`[district-storage] ${message}`, error);
}

export interface StoredDistrictSelection {
  /** null means "All Tamil Nadu". */
  district: TamilNaduDistrict | null;
  source: Exclude<DistrictSource, 'default'>;
}

const PERSISTABLE_SOURCES: readonly string[] = ['manual', 'all', 'device_location', 'profile'];

/**
 * The district the app was using when it was last closed — however it was chosen (picked by hand,
 * "All Tamil Nadu", detected from location, or taken from the profile). It is restored on the next
 * launch as-is, with no new location lookup. Only a `default` fallback (nothing could be worked out)
 * is not saved, so the app tries again next time.
 */
export async function loadStoredDistrict(): Promise<StoredDistrictSelection | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDistrictSelection;
    if (!PERSISTABLE_SOURCES.includes(parsed.source)) return null;
    // Guard against stale/corrupt storage (e.g. a district name no longer in the list).
    if (parsed.district !== null && !isTamilNaduDistrict(parsed.district)) return null;
    return parsed;
  } catch (error) {
    debug('could not read the saved district', error);
    return null;
  }
}

export async function saveStoredDistrict(selection: StoredDistrictSelection): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(selection));
  } catch (error) {
    // Non-fatal — worst case the district is worked out again next launch.
    debug('could not save the district', error);
  }
}

export async function clearStoredDistrict(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    debug('could not clear the saved district', error);
  }
}
