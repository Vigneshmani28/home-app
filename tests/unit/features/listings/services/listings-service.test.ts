import { supabase } from '@/lib/supabase/client';
import {
  createListing,
  searchListings,
  updateListingStatus,
  type CreateListingInput,
} from '@/features/listings/services';
import { createQueryBuilderMock, mockAuthenticatedUser, type SupabaseMock } from '../../../../utils/supabase-mock';

jest.mock('@/lib/supabase/client');

const supabaseMock = supabase as unknown as SupabaseMock;

const listingInput: CreateListingInput = {
  categoryId: 'cat-1',
  materialName: 'Cement',
  title: 'UltraTech Cement 50kg bags',
  quantity: 100,
  unit: 'bags',
  price: 350,
  condition: 'unused',
  district: 'Chennai',
  locality: 'Adyar',
  contactPhone: '9876543210',
  pickupAvailable: true,
  deliveryAvailable: false,
};

describe('createListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives seller_id from the authenticated user, ignoring any client-supplied value', async () => {
    mockAuthenticatedUser(supabaseMock, 'authenticated-user-id');
    const builder = createQueryBuilderMock({
      data: { id: 'new-listing', seller_id: 'authenticated-user-id' },
      error: null,
    });
    supabaseMock.from.mockReturnValue(builder);

    // Even if a caller tried to smuggle a different seller_id in, the
    // CreateListingInput type doesn't accept one — createListing always
    // derives it from supabase.auth.getUser().
    await createListing(listingInput);

    expect(supabaseMock.from).toHaveBeenCalledWith('listings');
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ seller_id: 'authenticated-user-id' }),
    );
  });

  it('throws when there is no authenticated user', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(createListing(listingInput)).rejects.toThrow(/signed in/i);
  });
});

describe('updateListingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['sold', 'reserved', 'active', 'inactive'] as const)(
    'updates the listing status to %s',
    async (status) => {
      const builder = createQueryBuilderMock({ data: { id: 'listing-1', status }, error: null });
      supabaseMock.from.mockReturnValue(builder);

      await updateListingStatus('listing-1', status);

      expect(supabaseMock.from).toHaveBeenCalledWith('listings');
      expect(builder.update).toHaveBeenCalledWith({ status });
      expect(builder.eq).toHaveBeenCalledWith('id', 'listing-1');
    },
  );
});

describe('searchListings (cursor pagination)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const row = (n: number) => ({ id: `id-${n}`, created_at: `2026-09-${String(30 - n).padStart(2, '0')}T10:00:00+00:00`, price: 100 + n });

  it('asks for one extra row to detect another page, and returns a cursor for the last shown row', async () => {
    const builder = createQueryBuilderMock({ data: [row(1), row(2), row(3)], error: null });
    supabaseMock.from.mockReturnValue(builder);

    const result = await searchListings({ pageSize: 2 });

    expect(builder.limit).toHaveBeenCalledWith(3);
    expect(builder.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(builder.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(result.items.map((item) => item.id)).toEqual(['id-1', 'id-2']);
    expect(result.nextCursor).toEqual({ value: row(2).created_at, id: 'id-2' });
  });

  it('returns no cursor on the last page', async () => {
    const builder = createQueryBuilderMock({ data: [row(1), row(2)], error: null });
    supabaseMock.from.mockReturnValue(builder);

    const result = await searchListings({ pageSize: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it('continues strictly after the cursor row for the newest sort', async () => {
    const builder = createQueryBuilderMock({ data: [], error: null });
    supabaseMock.from.mockReturnValue(builder);

    await searchListings({ cursor: { value: '2026-09-28T10:00:00+00:00', id: 'id-2' } });

    expect(builder.or).toHaveBeenCalledWith(
      'created_at.lt.2026-09-28T10:00:00+00:00,and(created_at.eq.2026-09-28T10:00:00+00:00,id.lt.id-2)',
    );
  });

  it('pages by (price, id) ascending for the price_asc sort', async () => {
    const builder = createQueryBuilderMock({ data: [], error: null });
    supabaseMock.from.mockReturnValue(builder);

    await searchListings({ sort: 'price_asc', cursor: { value: 350, id: 'id-9' } });

    expect(builder.order).toHaveBeenNthCalledWith(1, 'price', { ascending: true });
    expect(builder.or).toHaveBeenCalledWith('price.gt.350,and(price.eq.350,id.gt.id-9)');
  });
});
