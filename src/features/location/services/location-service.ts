import * as Location from 'expo-location';

import type { Coordinates } from '../types';

/** Requests foreground location permission (does not prompt for background). */
export async function requestForegroundPermission() {
  return Location.requestForegroundPermissionsAsync();
}

export async function getForegroundPermissionStatus() {
  return Location.getForegroundPermissionsAsync();
}

const POSITION_TIMEOUT_MS = 8000;

/** Rejects if `promise` doesn't settle within `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Gets a position quickly. A district only needs city-level accuracy, so we first take the OS's
 * cached last-known fix (instant), and otherwise ask for a low-accuracy fix (fast, no GPS warm-up)
 * with a timeout instead of waiting on a balanced/GPS fix. Assumes permission is already granted.
 */
export async function getCurrentPosition(): Promise<Coordinates> {
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60 * 60 * 1000, requiredAccuracy: 5000 });
  if (lastKnown) {
    return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
  }
  const position = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
    POSITION_TIMEOUT_MS,
    'Timed out getting the current position',
  );
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

/** The phone's own geocoder (Apple/Google). Used as a fallback when Nominatim is unreachable or has no match. */
export async function reverseGeocodeOnDevice(coords: Coordinates): Promise<Location.LocationGeocodedAddress | null> {
  const results = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
  return results[0] ?? null;
}

/** Subset of the Nominatim `address` object we use (all fields optional — it varies by place). */
export interface ReverseGeocodeAddress {
  /** Administrative district (Tamil Nadu revenue district), e.g. "Pudukkottai". */
  state_district?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  'ISO3166-2-lvl4'?: string;
  country_code?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: ReverseGeocodeAddress;
  error?: string;
}

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REVERSE_GEOCODE_TIMEOUT_MS = 6000;

/**
 * Reverse-geocodes coordinates with OpenStreetMap Nominatim (zoom=10 → district-level
 * detail). Returns the response's `address` block, or null if nothing could be resolved.
 * Throws on network errors / non-2xx so callers can decide how to fall back.
 *
 * Nominatim's usage policy requires an identifying User-Agent and at most ~1 request/second;
 * we only call this once per app session (see useDistrict).
 */
export async function reverseGeocode(coords: Coordinates): Promise<ReverseGeocodeAddress | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coords.lat),
    lon: String(coords.lng),
    zoom: '10',
    addressdetails: '1',
    'accept-language': 'en',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT_MS);
  try {
    const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'ConstructionMarketplaceApp/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed (${response.status})`);
    }
    const data = (await response.json()) as NominatimReverseResponse;
    return data.address ?? null;
  } finally {
    clearTimeout(timeout);
  }
}
