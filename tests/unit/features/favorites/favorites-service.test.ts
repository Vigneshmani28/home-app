import { supabase } from '@/lib/supabase/client';
import { addFavorite, removeFavorite } from '@/features/favorites/services';
import { createQueryBuilderMock, mockAuthenticatedUser, type SupabaseMock } from '../../../utils/supabase-mock';

jest.mock('@/lib/supabase/client');

const supabaseMock = supabase as unknown as SupabaseMock;

describe('favorites-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addFavorite inserts a row with the authenticated user_id and given listing_id', async () => {
    mockAuthenticatedUser(supabaseMock, 'user-1');
    const builder = createQueryBuilderMock({ data: null, error: null });
    supabaseMock.from.mockReturnValue(builder);

    await addFavorite('listing-42');

    expect(supabaseMock.from).toHaveBeenCalledWith('favorites');
    expect(builder.insert).toHaveBeenCalledWith({ user_id: 'user-1', listing_id: 'listing-42' });
  });

  it('removeFavorite deletes the row scoped to the authenticated user and listing', async () => {
    mockAuthenticatedUser(supabaseMock, 'user-1');
    const builder = createQueryBuilderMock({ data: null, error: null });
    supabaseMock.from.mockReturnValue(builder);

    await removeFavorite('listing-42');

    expect(supabaseMock.from).toHaveBeenCalledWith('favorites');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1');
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'listing_id', 'listing-42');
  });

  it('addFavorite throws when there is no authenticated user', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(addFavorite('listing-42')).rejects.toThrow(/signed in/i);
  });
});
