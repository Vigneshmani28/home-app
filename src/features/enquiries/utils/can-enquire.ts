/**
 * Authorization-sensitive check: a user can enquire about a listing only if
 * they're signed in and are not the listing's own seller. Extracted out of
 * the listing detail screen's inline JSX so the rule is unit-testable in
 * isolation from rendering.
 */
export function canEnquireOnListing(
  userId: string | null | undefined,
  listing: { seller_id: string } | null | undefined,
): boolean {
  if (!userId || !listing) return false;
  return userId !== listing.seller_id;
}
