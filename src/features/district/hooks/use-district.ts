import { useSegments } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';

import { isTamilNaduDistrict, type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import { useAuth } from '@/features/auth/services/auth-context';
import type { RootState } from '@/stores';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setDistrict, setDistrictPickerRequested, setDistrictStatus } from '@/stores/slices/district-slice';

import {
  detectDistrictFromDevice,
  loadStoredDistrict,
  saveStoredDistrict,
  type DistrictDetectionResult,
} from '../services';

/**
 * Resolves the app-wide "selected district" ONCE per app session. Mount this in exactly one
 * place (see DistrictBootstrap) — every screen reads the result through `useDistrict()`.
 *
 * Priority:
 *   1. The district saved on the device from last time. A manual pick / "All Tamil Nadu" / profile
 *      district is restored as-is. A district saved from location detection is shown instantly and
 *      then re-detected silently (no permission prompt) so moving to another district is picked up.
 *   2. First launch (nothing saved), signed in with a profile district: that district, saved.
 *   3. First launch, guest or no profile district: once they reach the browsing screens (not the
 *      welcome / sign-in / sign-up screens), ask for location and use the detected district.
 *   4. Location off / denied / unavailable / outside Tamil Nadu: ask the user to pick a district
 *      (or "All Tamil Nadu") in a modal. Until they do, All Tamil Nadu is shown, unsaved.
 */
export function useDistrictResolver() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const { source, status } = useAppSelector((state) => state.district);
  const { profile, isLoading: sessionLoading, isProfileLoading } = useAuth();
  // Wait for the profile too: the session resolves first, and the profile district is needed below.
  const authLoading = sessionLoading || isProfileLoading;
  const hasStarted = useRef(false);
  const [needsLocationLookup, setNeedsLocationLookup] = useState(false);

  // The profile may hydrate while device detection is still running; always read the latest.
  const profileDistrict = useRef(profile?.district);
  useEffect(() => {
    profileDistrict.current = profile?.district;
  }, [profile?.district]);

  useEffect(() => {
    if (authLoading || hasStarted.current) return;
    hasStarted.current = true;

    const userPickedSince = () => {
      const current = store.getState().district.source;
      return current === 'manual' || current === 'all';
    };

    const applyDetected = (district: TamilNaduDistrict) => {
      dispatch(setDistrict({ district, source: 'device_location' }));
      void saveStoredDistrict({ district, source: 'device_location' });
    };

    void (async () => {
      dispatch(setDistrictStatus('resolving'));

      const stored = await loadStoredDistrict();
      if (stored) {
        dispatch(setDistrict({ district: stored.district, source: stored.source }));
        if (stored.source !== 'device_location') return;

        const refreshed = await detectDistrictFromDevice({ prompt: false });
        if (userPickedSince() || !refreshed.ok || refreshed.district === stored.district) return;
        applyDetected(refreshed.district);
        return;
      }

      const fromProfile = profileDistrict.current;
      if (isTamilNaduDistrict(fromProfile)) {
        dispatch(setDistrict({ district: fromProfile, source: 'profile' }));
        void saveStoredDistrict({ district: fromProfile, source: 'profile' });
        return;
      }

      // Nothing saved and no profile district: ask for location, but only once the user is browsing
      // (see below) — not on the welcome / sign-in / sign-up screens.
      setNeedsLocationLookup(true);
    })();
  }, [authLoading, dispatch, store]);

  // Guest / no profile district: ask for location the first time they enter the browsing screens.
  const segments = useSegments();
  const isBrowsing = segments.length > 0 && segments[0] !== '(auth)';
  const lookupStarted = useRef(false);
  useEffect(() => {
    if (!needsLocationLookup || !isBrowsing || lookupStarted.current) return;
    // They may have signed in / registered on the way here; wait for the profile to finish loading
    // so a profile district is used instead of asking for location.
    if (isProfileLoading) return;
    lookupStarted.current = true;

    const adoptProfileDistrict = () => {
      const fromProfile = profileDistrict.current;
      if (!isTamilNaduDistrict(fromProfile)) return false;
      dispatch(setDistrict({ district: fromProfile, source: 'profile' }));
      void saveStoredDistrict({ district: fromProfile, source: 'profile' });
      return true;
    };

    void (async () => {
      if (adoptProfileDistrict()) return;

      const detected = await detectDistrictFromDevice();
      const current = store.getState().district.source;
      if (current === 'manual' || current === 'all') return; // the user chose while we were detecting
      if (adoptProfileDistrict()) return; // the profile arrived while the permission prompt was open
      if (detected.ok) {
        dispatch(setDistrict({ district: detected.district, source: 'device_location' }));
        void saveStoredDistrict({ district: detected.district, source: 'device_location' });
        return;
      }

      dispatch(setDistrict({ district: null, source: 'default' }));
      dispatch(setDistrictPickerRequested(true));
    })();
  }, [needsLocationLookup, isBrowsing, isProfileLoading, dispatch, store]);

  // Late profile: if we fell back to "all Tamil Nadu" before the profile was available (or the user
  // signs in later), adopt the profile district. Never overrides a saved, detected or chosen district.
  useEffect(() => {
    if (status !== 'resolved' || source !== 'default') return;
    if (isTamilNaduDistrict(profile?.district)) {
      dispatch(setDistrict({ district: profile.district, source: 'profile' }));
      void saveStoredDistrict({ district: profile.district, source: 'profile' });
    }
  }, [status, source, profile?.district, dispatch]);
}

/** Reads the shared district selection and exposes the actions to change it. Safe to call from any screen. */
export function useDistrict() {
  const dispatch = useAppDispatch();
  const { selected, source, status, pickerRequested } = useAppSelector((state) => state.district);

  const dismissPicker = useCallback(() => {
    dispatch(setDistrictPickerRequested(false));
  }, [dispatch]);

  /** Picking by hand (or "All Tamil Nadu") is saved and restored on the next launch. */
  const selectDistrict = useCallback(
    (district: TamilNaduDistrict | null) => {
      const source = district ? 'manual' : 'all';
      dispatch(setDistrict({ district, source }));
      void saveStoredDistrict({ district, source });
    },
    [dispatch],
  );

  /** "Use my current location": position → reverse geocode → district. Returns the outcome so the UI can explain failures. */
  const detectFromLocation = useCallback(async (): Promise<DistrictDetectionResult> => {
    const result = await detectDistrictFromDevice();
    if (result.ok) {
      dispatch(setDistrict({ district: result.district, source: 'device_location' }));
      void saveStoredDistrict({ district: result.district, source: 'device_location' });
    }
    return result;
  }, [dispatch]);

  return {
    district: selected,
    source,
    status,
    pickerRequested,
    dismissPicker,
    isResolving: status === 'idle' || status === 'resolving',
    isAllTamilNadu: selected === null && status === 'resolved',
    selectDistrict,
    detectFromLocation,
  };
}
