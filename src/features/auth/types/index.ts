import type { Database } from '@/lib/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

/** User-friendly error shape surfaced by auth mutations/hooks. */
export interface AuthError {
  message: string;
}
