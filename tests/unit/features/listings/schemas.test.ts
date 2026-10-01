import { listingSchema } from '@/features/listings/schemas';

const basePayload = {
  categoryId: 'cat-1',
  materialName: 'Cement',
  title: 'UltraTech Cement 50kg bags',
  description: '',
  quantity: 100,
  unit: 'bags',
  price: 350,
  originalPrice: null,
  condition: 'unused' as const,
  brand: '',
  manufactureDate: '',
  expiryDate: '',
  district: 'Chennai',
  locality: 'Adyar',
  pincode: '',
  contactPhone: '98765 43210',
  pickupAvailable: true,
  deliveryAvailable: false,
};

describe('listingSchema', () => {
  it('accepts a valid listing payload', () => {
    expect(listingSchema.safeParse(basePayload).success).toBe(true);
  });

  it('rejects a quantity of 0', () => {
    const result = listingSchema.safeParse({ ...basePayload, quantity: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('quantity'))).toBe(true);
    }
  });

  it('rejects a negative quantity', () => {
    const result = listingSchema.safeParse({ ...basePayload, quantity: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = listingSchema.safeParse({ ...basePayload, price: -1 });
    expect(result.success).toBe(false);
  });

  it('requires a total price of at least ₹100', () => {
    expect(listingSchema.safeParse({ ...basePayload, price: 99 }).success).toBe(false);
    expect(listingSchema.safeParse({ ...basePayload, price: 0 }).success).toBe(false);
    expect(listingSchema.safeParse({ ...basePayload, price: 100 }).success).toBe(true);
  });

  it('rejects a missing category', () => {
    const result = listingSchema.safeParse({ ...basePayload, categoryId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing title', () => {
    const result = listingSchema.safeParse({ ...basePayload, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid pincode', () => {
    const result = listingSchema.safeParse({ ...basePayload, pincode: '12AB56' });
    expect(result.success).toBe(false);
  });

  it('accepts an empty pincode (optional)', () => {
    expect(listingSchema.safeParse({ ...basePayload, pincode: '' }).success).toBe(true);
  });

  it('requires a contact number', () => {
    const result = listingSchema.safeParse({ ...basePayload, contactPhone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('contactPhone'))).toBe(true);
    }
  });

  it('rejects a contact number that is not a valid Indian mobile number', () => {
    expect(listingSchema.safeParse({ ...basePayload, contactPhone: '12345' }).success).toBe(false);
  });

  it('accepts a contact number with a country code and separators', () => {
    expect(listingSchema.safeParse({ ...basePayload, contactPhone: '+91 98765-43210' }).success).toBe(true);
  });
});
