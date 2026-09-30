import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { TamilNaduDistrict } from '@/constants/tamil-nadu-districts';

/**
 * How the currently-selected district was determined:
 * - `profile`: copied from the signed-in user's profile.district
 * - `device_location`: resolved from the device's GPS position via reverse geocoding
 * - `manual`: the user explicitly picked a district from the selector
 * - `all`: the user explicitly chose to browse all of Tamil Nadu
 * - `default`: nothing could be determined, so we fell back to all of Tamil Nadu (not a user choice)
 */
export type DistrictSource = 'profile' | 'device_location' | 'manual' | 'all' | 'default';

export type DistrictResolutionStatus = 'idle' | 'resolving' | 'resolved';

export interface DistrictState {
  /** null means "All Tamil Nadu" (no district filter applied). */
  selected: TamilNaduDistrict | null;
  source: DistrictSource | null;
  status: DistrictResolutionStatus;
}

const initialState: DistrictState = {
  selected: null,
  source: null,
  status: 'idle',
};

const districtSlice = createSlice({
  name: 'district',
  initialState,
  reducers: {
    setDistrict(
      state,
      action: PayloadAction<{ district: TamilNaduDistrict | null; source: DistrictSource }>,
    ) {
      state.selected = action.payload.district;
      state.source = action.payload.source;
      state.status = 'resolved';
    },
    setDistrictStatus(state, action: PayloadAction<DistrictResolutionStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setDistrict, setDistrictStatus } = districtSlice.actions;
export default districtSlice.reducer;
