import { TAMIL_NADU_DISTRICTS, type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';

/** OpenStreetMap spellings that differ from our canonical list, mapped to the canonical name. */
const SPELLING_ALIASES: Record<string, string> = {
  kanchipuram: 'kancheepuram',
  tiruchchirappalli: 'tiruchirappalli',
  trichy: 'tiruchirappalli',
  thoothukkudi: 'thoothukudi',
  tuticorin: 'thoothukudi',
  kanyakumari: 'kanniyakumari',
  nilgiri: 'nilgiris',
  sivagangai: 'sivaganga',
  thiruvallur: 'tiruvallur',
  thiruvarur: 'tiruvarur',
  thiruvannamalai: 'tiruvannamalai',
  tirupur: 'tiruppur',
  villupuram: 'viluppuram',
  virudhungar: 'virudhunagar',
  tirupathur: 'tirupattur',
};

/** Normalizes a district-ish string for comparison (lowercase, strip "district" suffix, fix known spelling variants). */
function normalize(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/\bdistrict\b/g, '')
    .trim();
  return SPELLING_ALIASES[cleaned] ?? cleaned;
}

/**
 * Matches free-text place names (typically from reverse geocoding — state_district,
 * county, city, in that preference order) against the canonical Tamil
 * Nadu district list. Returns null if nothing matches closely enough, which
 * usually means the coordinates are outside Tamil Nadu.
 */
export function matchTamilNaduDistrict(
  candidates: (string | null | undefined)[],
): TamilNaduDistrict | null {
  const normalizedCandidates = candidates
    .filter((candidate): candidate is string => !!candidate)
    .map(normalize)
    .filter(Boolean);

  for (const candidate of normalizedCandidates) {
    const exact = TAMIL_NADU_DISTRICTS.find((district) => normalize(district) === candidate);
    if (exact) return exact;
  }

  // Second pass: loose substring match, in case reverse geocoding returns a
  // locality name that contains (or is contained by) a district name.
  for (const candidate of normalizedCandidates) {
    const partial = TAMIL_NADU_DISTRICTS.find((district) => {
      const normalizedDistrict = normalize(district);
      return candidate.includes(normalizedDistrict) || normalizedDistrict.includes(candidate);
    });
    if (partial) return partial;
  }

  return null;
}
