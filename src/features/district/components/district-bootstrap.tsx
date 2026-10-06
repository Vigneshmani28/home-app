import { useDistrict, useDistrictResolver } from '../hooks/use-district';
import { DistrictPickerModal } from './district-picker-modal';

/**
 * Renders the one-time district resolution and, when no district could be worked out (guest with
 * location off/denied), the "choose your district" modal. Mount once, inside Redux + Auth providers.
 */
export function DistrictBootstrap() {
  useDistrictResolver();
  const { district, pickerRequested, dismissPicker, selectDistrict, detectFromLocation } = useDistrict();

  return (
    <DistrictPickerModal
      visible={pickerRequested}
      onDismiss={dismissPicker}
      selected={district}
      onSelect={selectDistrict}
      onDetectLocation={detectFromLocation}
      title="Choose your district"
    />
  );
}
