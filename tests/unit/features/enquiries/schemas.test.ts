import { enquirySchema } from '@/features/enquiries/schemas';

describe('enquirySchema', () => {
  it('rejects a message shorter than 10 characters', () => {
    const result = enquirySchema.safeParse({ message: 'too short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('message'))).toBe(true);
    }
  });

  it('rejects an empty message', () => {
    expect(enquirySchema.safeParse({ message: '' }).success).toBe(false);
  });

  it('rejects a message longer than 500 characters', () => {
    const result = enquirySchema.safeParse({ message: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts a valid message', () => {
    const result = enquirySchema.safeParse({
      message: 'Is this cement still available? I need 50 bags delivered this week.',
    });
    expect(result.success).toBe(true);
  });
});
