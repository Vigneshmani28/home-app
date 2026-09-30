/**
 * Normalizes a loosely-formatted Indian phone number (spaces, dashes,
 * leading 0, leading +) into digits-only E.164-ish form with the country
 * code, e.g. "+91 98765-43210" / "098765 43210" / "9876543210" -> "919876543210".
 * Returns null if the input doesn't look like a valid 10-digit Indian
 * mobile number (with or without the 91 country code).
 */
export function normalizeIndianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');

  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  return null;
}
