/**
 * Maps common Supabase Auth error messages/codes to user-friendly copy.
 * Supabase's GoTrue errors don't always have stable machine-readable codes
 * across versions, so we match on the well-known message text and fall back
 * to a generic message for anything unrecognized.
 */
export function toFriendlyAuthErrorMessage(error: unknown): string {
  const rawMessage =
    error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : String(error);

  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (normalized.includes('network') || normalized.includes('fetch failed')) {
    return 'Network error. Check your connection and try again.';
  }
  if (normalized.includes('token has expired') || normalized.includes('invalid token')) {
    return 'This link has expired or is invalid. Please request a new one.';
  }

  return rawMessage || 'Something went wrong. Please try again.';
}
