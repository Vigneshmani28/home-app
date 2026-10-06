import { type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import {
  getCurrentPosition,
  getForegroundPermissionStatus,
  requestForegroundPermission,
} from '@/features/location/services';

import { findDistrictByCoordinates } from './district-boundaries';

export type DistrictDetectionResult =
  | { ok: true; district: TamilNaduDistrict }
  | { ok: false; reason: 'permission_denied' | 'outside_tamil_nadu' | 'unavailable' };

export const DETECTION_FAILURE_MESSAGES: Record<Extract<DistrictDetectionResult, { ok: false }>['reason'], string> = {
  permission_denied: 'Location permission is off. Enable it in Settings, or pick your district below.',
  outside_tamil_nadu: "You don't seem to be in Tamil Nadu. Pick a district below.",
  unavailable: "We couldn't detect your district. Check that location is on, or pick one below.",
};

function debug(message: string, detail?: unknown) {
  if (__DEV__) console.warn(`[district] ${message}`, detail ?? '');
}

interface DetectOptions {
  /**
   * Show the OS permission prompt if permission hasn't been decided. Pass false for silent
   * background refreshes (e.g. on app launch after the user already answered once).
   */
  prompt?: boolean;
}

/**
 * Detects the user's Tamil Nadu district from the device: permission → position → point-in-polygon
 * against the bundled district boundaries (offline, no network). Never throws; failures come back
 * as a typed reason.
 */
export async function detectDistrictFromDevice({ prompt = true }: DetectOptions = {}): Promise<DistrictDetectionResult> {
  try {
    const permission = await getForegroundPermissionStatus();
    let granted = permission.status === 'granted';
    if (!granted && prompt && permission.canAskAgain) {
      const requested = await requestForegroundPermission();
      granted = requested.status === 'granted';
    }
    if (!granted) {
      debug('permission not granted');
      return { ok: false, reason: 'permission_denied' };
    }

    const position = await getCurrentPosition();
    const district = findDistrictByCoordinates(position);
    return district ? { ok: true, district } : { ok: false, reason: 'outside_tamil_nadu' };
  } catch (error) {
    // Location services off, timeout, no fix…
    debug('detection failed', error);
    return { ok: false, reason: 'unavailable' };
  }
}
