import type { Database } from '@/lib/supabase/types';

export type Category = Database['public']['Tables']['categories']['Row'];
