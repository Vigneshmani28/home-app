import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

import type { RemoteBanner } from '../types';

const BUCKET = 'banners';
const MAX_BANNERS = 4;
const TIMEOUT_MS = 8000;

type Row = Database['public']['Tables']['banners']['Row'];

/** A banner whose action is missing its target (deleted category, bad link) stays visible but does nothing. */
function toAction(row: Row): RemoteBanner['action'] {
  switch (row.action_type) {
    case 'category':
      return row.category_id ? { type: 'category', categoryId: row.category_id } : { type: 'none' };
    case 'link':
      return row.link_url && /^https?:\/\/\S+$/i.test(row.link_url)
        ? { type: 'link', url: row.link_url }
        : { type: 'none' };
    case 'explore':
    case 'sell':
    case 'none':
      return { type: row.action_type };
  }
}

/**
 * Live banners for Home, in display order. The database only returns banners that are active and inside
 * their start/end dates (RLS), so there is nothing to filter here. Rows that can't be shown (a category
 * banner whose category was deleted) are dropped. Throws on network/server errors and after a timeout, so
 * the caller can fall back to the built-in banners instead of showing a spinner forever.
 */
export async function fetchBanners(): Promise<RemoteBanner[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(MAX_BANNERS)
      .abortSignal(controller.signal);

    if (error) throw error;

    const banners: RemoteBanner[] = [];
    for (const row of data ?? []) {
      if (!row.image_path) continue;

      banners.push({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        eyebrow: row.eyebrow,
        buttonText: row.button_text,
        theme: row.theme ?? 'green',
        imageUrl: supabase.storage.from(BUCKET).getPublicUrl(row.image_path).data.publicUrl,
        action: toAction(row),
      });
    }
    return banners;
  } finally {
    clearTimeout(timer);
  }
}
