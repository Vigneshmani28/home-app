import { supabase } from '@/lib/supabase/client';

import type { Category } from '../types';

/** Active categories, ordered for display (sort_order asc). */
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
