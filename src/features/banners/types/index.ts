import type { Database } from '@/lib/supabase/types';

export type BannerRow = Database['public']['Tables']['banners']['Row'];

/** What the Home carousel renders for an admin-managed banner. */
export type BannerTheme = BannerRow['theme'];

export interface RemoteBanner {
  id: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  buttonText: string;
  imageUrl: string;
  theme: BannerTheme;
  action: { type: 'explore' } | { type: 'sell' } | { type: 'category'; categoryId: string } | { type: 'link'; url: string } | { type: 'none' };
}
