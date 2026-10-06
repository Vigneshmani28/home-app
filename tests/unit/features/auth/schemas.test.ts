import { loginSchema, registerSchema, resetPasswordSchema, verifyCodeSchema } from '@/features/auth/schemas';

describe('loginSchema', () => {
  it('requires email and password', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(expect.arrayContaining(['email', 'password']));
    }
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({ email: 'buyer@example.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  const basePayload = {
    fullName: 'Vignesh Kumar',
    email: 'vignesh@example.com',
    phone: '',
    district: 'Pudukkottai',
    acceptTerms: true,
  };

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'short1',
      confirmPassword: 'short1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('password'))).toBe(true);
    }
  });

  it('rejects a mismatched confirmPassword', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'password123',
      confirmPassword: 'password124',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('confirmPassword'))).toBe(true);
    }
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('requires a district', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'password123',
      confirmPassword: 'password123',
      district: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('district'))).toBe(true);
    }
  });

  it('rejects a district that is not in the Tamil Nadu list', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'password123',
      confirmPassword: 'password123',
      district: 'Atlantis',
    });
    expect(result.success).toBe(false);
  });
});

describe('verifyCodeSchema', () => {
  it('accepts exactly six digits', () => {
    expect(verifyCodeSchema.safeParse({ code: '123456' }).success).toBe(true);
  });

  it.each(['12345', '1234567', '12345a', '', '12 456'])('rejects "%s"', (code) => {
    expect(verifyCodeSchema.safeParse({ code }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const base = { code: '123456', password: 'password123', confirmPassword: 'password123' };

  it('accepts a code with matching passwords', () => {
    expect(resetPasswordSchema.safeParse(base).success).toBe(true);
  });

  it('requires a valid 6-digit code', () => {
    expect(resetPasswordSchema.safeParse({ ...base, code: '12' }).success).toBe(false);
  });

  it('rejects mismatched passwords and short passwords', () => {
    expect(resetPasswordSchema.safeParse({ ...base, confirmPassword: 'different1' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' }).success).toBe(false);
  });
});
