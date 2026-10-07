import { supabase } from '@/lib/supabase/client';

import type { ReportInput, ReportResult } from '../types';

export class ReportAuthRequiredError extends Error {
  constructor() {
    super('You must be signed in to report a listing.');
    this.name = 'ReportAuthRequiredError';
  }
}

/** Files a report. The server validates it and returns a result code; only 'ok' means a new report was stored. */
export async function reportListing({ listingId, reason, details }: ReportInput): Promise<ReportResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ReportAuthRequiredError();

  const { data, error } = await supabase.rpc('report_listing', {
    p_listing_id: listingId,
    p_reason: reason,
    p_details: details?.trim() || null,
  });
  if (error) throw error;
  return data as ReportResult;
}

/** Whether the signed-in user has already reported this listing (reports are only readable by their author). */
export async function hasReportedListing(listingId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('listing_reports')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
