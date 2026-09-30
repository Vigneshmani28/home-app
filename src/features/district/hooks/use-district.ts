import { useCallback, useEffect, useRef } from 'react';
import { useStore } from 'react-redux';

import { isTamilNaduDistrict, type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import { useAuth } from '@/features/auth/services/auth-context';
import type { RootState } from '@/stores';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setDistrict, setDistrictStatus } from '@/stores/slices/district-slice';

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
 *   1. The district saved on the device from last time — however it was chosen (picked by hand,
 *      "All Tamil Nadu", detected from location, or from the profile). Restored as-is: no location
 *      lookup on later launches.
 *   2. First launch (nothing saved): the device's current location, reverse-geocoded to a district.
 *   3. The signed-in user's profile.district.
 *   4. Otherwise all of Tamil Nadu (not saved, so the next launch tries again).
 * Whatever gets resolved in 2 or 3 is saved, and every later change is saved too.
 */
export function useDistrictResolver() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const { source, status } = useAppSelector((state) => state.district);
  const { profile, isLoading: authLoading } = useAuth();
  const hasStarted = useRef(false);

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

    void (async () => {
      dispatch(setDistrictStatus('resolving'));

      const stored = await loadStoredDistrict();
      if (stored) {
        dispatch(setDistrict({ district: stored.district, source: stored.source }));
        return;
      }

      const detected = await detectDistrictFromDevice();
      if (userPickedSince()) return; // the user chose something while we were detecting — respect it

      if (detected.ok) {
        dispatch(setDistrict({ district: detected.district, source: 'device_location' }));
        void saveStoredDistrict({ district: detected.district, source: 'device_location' });
        return;
      }

      const fromProfile = profileDistrict.current;
      if (isTamilNaduDistrict(fromProfile)) {
        dispatch(setDistrict({ district: fromProfile, source: 'profile' }));
        void saveStoredDistrict({ district: fromProfile, source: 'profile' });
        return;
      }
      dispatch(setDistrict({ district: null, source: 'default' }));
    })();
  }, [authLoading, dispatch, store]);

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
  const { selected, source, status } = useAppSelector((state) => state.district);

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
    isResolving: status === 'idle' || status === 'resolving',
    isAllTamilNadu: selected === null && status === 'resolved',
    selectDistrict,
    detectFromLocation,
  };
}
