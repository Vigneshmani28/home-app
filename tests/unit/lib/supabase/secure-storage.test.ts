const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => (mockStore.has(key) ? (mockStore.get(key) as string) : null)),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (value.length > 700) throw new Error('value too large');
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

import { secureStorage } from '@/lib/supabase/secure-storage';

const KEY = 'sb-test-auth-token';

describe('secureStorage', () => {
  beforeEach(() => mockStore.clear());

  it('returns null when nothing is stored', async () => {
    expect(await secureStorage.getItem(KEY)).toBeNull();
  });

  it('round-trips a value far larger than one SecureStore entry', async () => {
    const session = JSON.stringify({ access_token: 'a'.repeat(1500), user: { name: 'சிமெண்ட்'.repeat(100) } });
    await secureStorage.setItem(KEY, session);
    expect(await secureStorage.getItem(KEY)).toBe(session);
  });

  it('overwrites a longer value with a shorter one without leaving old chunks behind', async () => {
    await secureStorage.setItem(KEY, 'x'.repeat(3000));
    await secureStorage.setItem(KEY, 'short');
    expect(await secureStorage.getItem(KEY)).toBe('short');
    expect([...mockStore.keys()].filter((k) => k.startsWith(KEY))).toHaveLength(2); // .0 and .n
  });

  it('reads a session saved in the old single-value format', async () => {
    mockStore.set(KEY, 'legacy-session');
    expect(await secureStorage.getItem(KEY)).toBe('legacy-session');
  });

  it('removes everything, including the old format', async () => {
    mockStore.set(KEY, 'legacy');
    await secureStorage.setItem(KEY, 'y'.repeat(2000));
    await secureStorage.removeItem(KEY);
    expect([...mockStore.keys()].filter((k) => k.startsWith(KEY))).toHaveLength(0);
  });

  it('treats a missing chunk as signed out instead of returning a corrupt value', async () => {
    await secureStorage.setItem(KEY, 'z'.repeat(2000));
    mockStore.delete(`${KEY}.1`);
    expect(await secureStorage.getItem(KEY)).toBeNull();
  });
});
