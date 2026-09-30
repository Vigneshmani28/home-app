import { useDistrictResolver } from '../hooks/use-district';

/** Renders nothing; runs the one-time district resolution. Mount once, inside Redux + Auth providers. */
export function DistrictBootstrap() {
  useDistrictResolver();
  return null;
}
