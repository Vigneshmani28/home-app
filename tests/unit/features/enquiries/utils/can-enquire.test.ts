import { canEnquireOnListing } from '@/features/enquiries/utils/can-enquire';

describe('canEnquireOnListing', () => {
  const listing = { seller_id: 'seller-1' };

  it('returns false when the user is signed out', () => {
    expect(canEnquireOnListing(undefined, listing)).toBe(false);
    expect(canEnquireOnListing(null, listing)).toBe(false);
  });

  it('returns false when there is no listing', () => {
    expect(canEnquireOnListing('buyer-1', null)).toBe(false);
    expect(canEnquireOnListing('buyer-1', undefined)).toBe(false);
  });

  it('returns false when the user is the listing seller', () => {
    expect(canEnquireOnListing('seller-1', listing)).toBe(false);
  });

  it('returns true when a signed-in user is not the seller', () => {
    expect(canEnquireOnListing('buyer-1', listing)).toBe(true);
  });
});
