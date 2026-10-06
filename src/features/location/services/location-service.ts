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
