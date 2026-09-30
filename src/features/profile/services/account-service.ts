import { supabase } from '@/lib/supabase/client';

/**
 * Requests permanent deletion of the current user's account via the
 * `delete-account` Supabase Edge Function (see
 * supabase/functions/delete-account/index.ts). The mobile app never has
 * access to the service-role key needed to call `auth.admin.deleteUser`
 * directly — that key lives only in the Edge Function's server-side
 * environment. The Supabase client SDK automatically attaches the current
 * user's JWT as the `Authorization` header on `functions.invoke`, which the
 * function verifies before deleting.
 */
export async function requestAccountDeletion(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
}
