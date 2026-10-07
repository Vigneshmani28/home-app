const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Formats a numeric price as an Indian Rupee string, e.g. 125000 -> "₹1,25,000". */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return inrFormatter.format(value);
}

const quantityFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

/** Formats a quantity + unit, e.g. (250, 'bags') -> "250 bags". */
export function formatQuantity(quantity: number | null | undefined, unit: string | null | undefined): string {
  if (quantity === null || quantity === undefined || Number.isNaN(quantity)) {
    return '';
  }
  const qty = quantityFormatter.format(quantity);
  return unit ? `${qty} ${unit}` : qty;
}

const distanceFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

/** Formats a distance in km, e.g. 3.4 -> "3.4 km", 0.4 -> "400 m". */
export function formatDistance(distanceKm: number | null | undefined): string | null {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return null;
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceFormatter.format(distanceKm)} km`;
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Formats an ISO date/timestamp string as a short human-readable date. */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

/**
 * Relative time for "Posted …" labels, e.g. "just now", "5 minutes ago", "2 hours ago", "3 days ago".
 * Older than about 8 weeks falls back to a short date. `now` is injectable for tests.
 */
export function formatTimeAgo(value: string | null | undefined, now: Date = new Date()): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < MINUTE) return 'just now';
  if (seconds < HOUR) return plural(Math.floor(seconds / MINUTE), 'minute');
  if (seconds < DAY) return plural(Math.floor(seconds / HOUR), 'hour');
  if (seconds < 7 * DAY) return plural(Math.floor(seconds / DAY), 'day');
  if (seconds < 56 * DAY) return plural(Math.floor(seconds / (7 * DAY)), 'week');
  return formatDate(value);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Relative date for "Posted …" labels, e.g. "Just now", "2 hours ago", "3 weeks ago". */
export function formatPostedDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Future dates
  if (diffMs < 0) return "Just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  if (weeks < 5) {
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  if (months < 12) {
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
