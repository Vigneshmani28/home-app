import { File, Paths } from 'expo-file-system';

// A plain file in the app's own storage, NOT the Keychain/SecureStore: on iOS the Keychain survives
// uninstalling the app, which would stop the intro from ever showing again after a reinstall.
const flagFile = () => new File(Paths.document, 'onboarding-seen.txt');

function debug(message: string, error: unknown) {
  if (__DEV__) console.warn(`[onboarding-storage] ${message}`, error);
}

/**
 * Whether this install has already been through the intro screens. If storage can't be read we say "yes":
 * a storage problem must never trap someone in (or repeatedly show) the intro.
 */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return flagFile().exists;
  } catch (error) {
    debug('could not read the onboarding flag', error);
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    const file = flagFile();
    if (!file.exists) file.create();
    file.write('1');
  } catch (error) {
    // Non-fatal: worst case the intro shows once more next launch.
    debug('could not save the onboarding flag', error);
  }
}
