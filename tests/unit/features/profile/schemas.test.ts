import { profileSchema } from '@/features/profile/schemas';

const basePayload = {
  fullName: 'Vignesh Kumar',
  phone: '9876543210',
  district: 'Chennai',
  locality: 'Adyar',
  pincode: '600020',
  showPhonePublicly: true,
};

describe('profileSchema', () => {
  it('accepts a valid profile payload', () => {
    expect(profileSchema.safeParse(basePayload).success).toBe(true);
  });

  it('rejects a pincode with fewer than 6 digits', () => {
    const result = profileSchema.safeParse({ ...basePayload, pincode: '6000' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('pincode'))).toBe(true);
    }
  });

  it('rejects a pincode with non-digit characters', () => {
    const result = profileSchema.safeParse({ ...basePayload, pincode: '60002A' });
    expect(result.success).toBe(false);
  });

  it('accepts an empty pincode (optional)', () => {
    expect(profileSchema.safeParse({ ...basePayload, pincode: '' }).success).toBe(true);
  });

  it('rejects a phone number that is too short', () => {
    const result = profileSchema.safeParse({ ...basePayload, phone: '12345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('phone'))).toBe(true);
    }
  });

  it('accepts a phone number with a country code and separators', () => {
    expect(profileSchema.safeParse({ ...basePayload, phone: '+91 98765-43210' }).success).toBe(true);
  });

  it('accepts an empty phone (optional)', () => {
    expect(profileSchema.safeParse({ ...basePayload, phone: '' }).success).toBe(true);
  });

  it('requires a district', () => {
    const result = profileSchema.safeParse({ ...basePayload, district: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('district'))).toBe(true);
    }
  });

  it('rejects a missing full name', () => {
    const result = profileSchema.safeParse({ ...basePayload, fullName: '' });
    expect(result.success).toBe(false);
  });
});
