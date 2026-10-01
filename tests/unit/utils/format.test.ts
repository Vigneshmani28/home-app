import { formatDistance, formatPostedDate, formatPrice, formatQuantity, formatTimeAgo } from '@/utils/format';

describe('formatPrice', () => {
  it('formats a price using Indian digit grouping with the ₹ symbol', () => {
    expect(formatPrice(125000)).toBe('₹1,25,000');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('₹0');
  });

  it('formats small amounts', () => {
    expect(formatPrice(350)).toBe('₹350');
  });

  it('returns an em dash for null/undefined/NaN', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice(Number.NaN)).toBe('—');
  });
});

describe('formatQuantity', () => {
  it('formats a quantity with its unit', () => {
    expect(formatQuantity(250, 'bags')).toBe('250 bags');
  });

  it('omits the unit when none is given', () => {
    expect(formatQuantity(250, null)).toBe('250');
  });

  it('formats fractional quantities with up to 2 decimal places', () => {
    expect(formatQuantity(12.5, 'tonnes')).toBe('12.5 tonnes');
  });

  it('returns an empty string for null/undefined/NaN quantity', () => {
    expect(formatQuantity(null, 'bags')).toBe('');
    expect(formatQuantity(undefined, 'bags')).toBe('');
    expect(formatQuantity(Number.NaN, 'bags')).toBe('');
  });
});

describe('formatDistance', () => {
  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistance(0.4)).toBe('400 m');
  });

  it('formats distances of 1km or more in kilometers', () => {
    expect(formatDistance(3.4)).toBe('3.4 km');
  });

  it('returns null for null/undefined/NaN', () => {
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(undefined)).toBeNull();
    expect(formatDistance(Number.NaN)).toBeNull();
  });
});

describe('formatTimeAgo', () => {
  const now = new Date('2026-09-30T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it('says "just now" for the last minute', () => {
    expect(formatTimeAgo(ago(20 * 1000), now)).toBe('just now');
  });

  it('formats minutes, hours, days and weeks with correct pluralisation', () => {
    expect(formatTimeAgo(ago(1 * MIN), now)).toBe('1 minute ago');
    expect(formatTimeAgo(ago(45 * MIN), now)).toBe('45 minutes ago');
    expect(formatTimeAgo(ago(2 * HOUR), now)).toBe('2 hours ago');
    expect(formatTimeAgo(ago(1 * DAY), now)).toBe('1 day ago');
    expect(formatTimeAgo(ago(3 * DAY), now)).toBe('3 days ago');
    expect(formatTimeAgo(ago(14 * DAY), now)).toBe('2 weeks ago');
  });

  it('falls back to a short date for old listings', () => {
    expect(formatTimeAgo(ago(200 * DAY), now)).toMatch(/\d{4}/);
  });

  it('returns null for missing or invalid input', () => {
    expect(formatTimeAgo(null, now)).toBeNull();
    expect(formatTimeAgo('not-a-date', now)).toBeNull();
  });
});

describe('formatPostedDate', () => {
  it('formats as "day Mon year" regardless of device locale', () => {
    expect(formatPostedDate('2026-09-30T10:00:00+00:00')).toBe('30 Sep 2026');
    expect(formatPostedDate('2026-01-05T10:00:00+00:00')).toBe('5 Jan 2026');
  });

  it('returns null for missing or invalid input', () => {
    expect(formatPostedDate(null)).toBeNull();
    expect(formatPostedDate('nope')).toBeNull();
  });
});
