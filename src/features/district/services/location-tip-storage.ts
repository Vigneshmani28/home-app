import { File, Paths } from 'expo-file-system';

// A plain file (not SecureStore) so a reinstall counts as a fresh start and the tip shows again, like onboarding.
const flagFile = () => new File(Paths.document, 'location-tip-seen.txt');

function debug(message: string, error: unknown) {
  if (__DEV__) console.warn(`[location-tip-storage] ${message}`, error);
}

/** Whether the first-run location spotlight has already been shown. Storage trouble counts as "seen". */
export async function hasSeenLocationTip(): Promise<boolean> {
  try {
    return flagFile().exists;
  } catch (error) {
    debug('could not read the location tip flag', error);
    return true;
  }
}

export async function markLocationTipSeen(): Promise<void> {
  try {
    const file = flagFile();
    if (!file.exists) file.create();
    file.write('1');
  } catch (error) {
    debug('could not save the location tip flag', error);
  }
}
