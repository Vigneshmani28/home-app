-- ============================================================================
-- 0022: optional small label shown above the banner title (e.g. "BUY • SELL • REUSE")
-- ============================================================================
alter table public.banners
  add column if not exists eyebrow text
    check (eyebrow is null or char_length(eyebrow) <= 40);
