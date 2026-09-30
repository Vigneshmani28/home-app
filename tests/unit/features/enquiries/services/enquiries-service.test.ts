import { supabase } from '@/lib/supabase/client';
import { createEnquiry, SelfEnquiryError } from '@/features/enquiries/services';
import { createQueryBuilderMock, mockAuthenticatedUser, type SupabaseMock } from '../../../../utils/supabase-mock';

jest.mock('@/lib/supabase/client');

const supabaseMock = supabase as unknown as SupabaseMock;

describe('createEnquiry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a self-enquiry client-side without calling the enquiries table', async () => {
    mockAuthenticatedUser(supabaseMock, 'seller-1');

    await expect(
      createEnquiry({ listingId: 'listing-1', message: 'Is this still available?', sellerId: 'seller-1' }),
    ).rejects.toThrow(SelfEnquiryError);

    expect(supabaseMock.from).not.toHaveBeenCalledWith('enquiries');
  });

  it('looks up the seller_id when not provided, and still blocks a self-enquiry', async () => {
    mockAuthenticatedUser(supabaseMock, 'seller-1');
    const listingLookupBuilder = createQueryBuilderMock({
      data: { seller_id: 'seller-1' },
      error: null,
    });
    supabaseMock.from.mockReturnValue(listingLookupBuilder);

    await expect(
      createEnquiry({ listingId: 'listing-1', message: 'Is this still available?' }),
    ).rejects.toThrow(SelfEnquiryError);

    expect(supabaseMock.from).toHaveBeenCalledWith('listings');
  });

  it('inserts an enquiry with buyer_id from the authenticated session for a normal enquiry', async () => {
    mockAuthenticatedUser(supabaseMock, 'buyer-1');
    const builder = createQueryBuilderMock({
      data: { id: 'enquiry-1', buyer_id: 'buyer-1' },
      error: null,
    });
    supabaseMock.from.mockReturnValue(builder);

    await createEnquiry({
      listingId: 'listing-1',
      message: 'Is this still available? I need it delivered.',
      sellerId: 'seller-2',
    });

    expect(supabaseMock.from).toHaveBeenCalledWith('enquiries');
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: 'listing-1',
        buyer_id: 'buyer-1',
        message: 'Is this still available? I need it delivered.',
      }),
    );
  });

  it('throws when there is no authenticated user', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createEnquiry({ listingId: 'listing-1', message: 'hi', sellerId: 'seller-2' }),
    ).rejects.toThrow(/signed in/i);
  });
});
