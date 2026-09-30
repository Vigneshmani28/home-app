import { type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import {
  getCurrentPosition,
  getForegroundPermissionStatus,
  requestForegroundPermission,
  reverseGeocode,
  reverseGeocodeOnDevice,
} from '@/features/location/services';
import type { Coordinates } from '@/features/location/types';

import { matchTamilNaduDistrict } from '../utils/match-district';

export type DistrictDetectionResult =
  | { ok: true; district: TamilNaduDistrict }
  | { ok: false; reason: 'permission_denied' | 'outside_tamil_nadu' | 'unavailable' };

export const DETECTION_FAILURE_MESSAGES: Record<Extract<DistrictDetectionResult, { ok: false }>['reason'], string> = {
  permission_denied: 'Location permission is off. Enable it in Settings, or pick your district below.',
  outside_tamil_nadu: "You don't seem to be in Tamil Nadu. Pick a district below.",
  unavailable: "We couldn't detect your district. Check your connection or pick one below.",
};

function debug(message: string, detail?: unknown) {
  if (__DEV__) console.warn(`[district] ${message}`, detail ?? '');
}

type LookupOutcome = { district: TamilNaduDistrict } | 'outside_tamil_nadu' | null;

/** OpenStreetMap Nominatim: state_district is the Tamil Nadu revenue district. */
async function lookupWithNominatim(position: Coordinates): Promise<LookupOutcome> {
  const address = await reverseGeocode(position);
  if (!address) return null;
  const inTamilNadu = address['ISO3166-2-lvl4'] === 'IN-TN' || address.state === 'Tamil Nadu';
  if (!inTamilNadu) return 'outside_tamil_nadu';
  const district = matchTamilNaduDistrict([address.state_district, address.county, address.city, address.town]);
  return district ? { district } : null;
}

/** The phone's geocoder: `subregion` is the district on both iOS and Android. */
async function lookupOnDevice(position: Coordinates): Promise<LookupOutcome> {
  const address = await reverseGeocodeOnDevice(position);
  if (!address) return null;
  if (address.region && address.region !== 'Tamil Nadu') return 'outside_tamil_nadu';
  const district = matchTamilNaduDistrict([address.subregion, address.district, address.city]);
  return district ? { district } : null;
}

/**
 * Detects the user's Tamil Nadu district from the device: permission → position → reverse
 * geocode (Nominatim first, then the phone's own geocoder if that fails or has no match) →
 * match against the canonical district list. Never throws; failures come back as a typed reason.
 */
export async function detectDistrictFromDevice(): Promise<DistrictDetectionResult> {
  try {
    const permission = await getForegroundPermissionStatus();
    let granted = permission.status === 'granted';
    if (!granted && permission.canAskAgain) {
      const requested = await requestForegroundPermission();
      granted = requested.status === 'granted';
    }
    if (!granted) {
      debug('permission not granted');
      return { ok: false, reason: 'permission_denied' };
    }

    const position = await getCurrentPosition();

    let outside = false;
    for (const lookup of [lookupWithNominatim, lookupOnDevice]) {
      try {
        const outcome = await lookup(position);
        if (outcome && outcome !== 'outside_tamil_nadu') return { ok: true, district: outcome.district };
        if (outcome === 'outside_tamil_nadu') outside = true;
      } catch (error) {
        debug(`${lookup.name} failed`, error);
      }
    }
    return { ok: false, reason: outside ? 'outside_tamil_nadu' : 'unavailable' };
  } catch (error) {
    debug('detection failed', error);
    return { ok: false, reason: 'unavailable' };
  }
}
