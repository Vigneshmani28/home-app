export const REPORT_REASONS = [
  { value: 'scam', label: 'Scam or fraud', hint: 'Asks for advance money, fake item, suspicious seller' },
  { value: 'wrong_info', label: 'Wrong or misleading details', hint: 'Price, photos, quantity or location look incorrect' },
  { value: 'sold_unavailable', label: 'Already sold or unavailable', hint: 'The item is no longer for sale' },
  { value: 'prohibited', label: 'Prohibited or illegal item', hint: 'Not allowed on the marketplace' },
  { value: 'offensive', label: 'Offensive or inappropriate', hint: 'Abusive language or images' },
  { value: 'spam', label: 'Spam or duplicate', hint: 'Posted repeatedly or not a real listing' },
  { value: 'other', label: 'Something else', hint: 'Tell us what is wrong' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];

export const REPORT_DETAILS_MAX = 500;
/** Minimum length of the description when the reason is "Something else". */
export const REPORT_OTHER_MIN = 10;

export type ReportResult = 'ok' | 'already_reported' | 'own_listing' | 'not_found' | 'rate_limited' | 'invalid';

export interface ReportInput {
  listingId: string;
  reason: ReportReason;
  details?: string;
}
