import * as SecureStore from 'expo-secure-store';

/**
 * supabase-js `auth.storage` adapter on top of expo-secure-store (Keychain / Keystore).
 *
 * SecureStore is meant for values of up to ~2 KB, but a Supabase session (access token + refresh token +
 * the user object with its metadata) is often larger, and a value that doesn't fit can fail to save, which
 * silently leaves the user signed out the next time the app opens. So the value is split into small chunks
 * (kept to 600 characters, i.e. under 2 KB even for 3-byte characters such as Tamil text) and put back
 * together on read.
 *
 * Key layout (SecureStore keys may only contain letters, digits, ".", "-" and "_"):
 *   <key>.n      number of chunks
 *   <key>.<i>    chunk i
 *   <key>        legacy single-value format from earlier versions; still read, then replaced on the next write
 */
const CHUNK_SIZE = 600;

// Writes are serialized: supabase-js can save a refreshed session while another save is in flight, and
// interleaved chunk writes would produce a corrupted session.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readChunked(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  if (countRaw === null) {
    // Nothing chunked: fall back to the legacy single value, if any.
    return SecureStore.getItemAsync(key);
  }
  const count = Number(countRaw);
  if (!Number.isInteger(count) || count < 1) return null;
  const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)));
  // A missing chunk means a half-written or damaged value: treat it as signed out rather than parse garbage.
  return parts.some((part) => part === null) ? null : parts.join('');
}

async function removeChunked(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  const count = Number(countRaw);
  if (countRaw !== null && Number.isInteger(count) && count > 0) {
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)));
  }
  await SecureStore.deleteItemAsync(`${key}.n`);
  await SecureStore.deleteItemAsync(key); // legacy value
}

export const secureStorage = {
  getItem: (key: string): Promise<string | null> => enqueue(() => readChunked(key)),

  setItem: (key: string, value: string): Promise<void> =>
    enqueue(async () => {
      await removeChunked(key);
      const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [''];
      // Chunks first, the count last: a reader never sees a count that points at chunks not saved yet.
      for (let i = 0; i < chunks.length; i += 1) {
        await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
      }
      await SecureStore.setItemAsync(`${key}.n`, String(chunks.length));
    }),

  removeItem: (key: string): Promise<void> => enqueue(() => removeChunked(key)),
};
