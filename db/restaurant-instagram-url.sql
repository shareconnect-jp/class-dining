-- restaurants.instagram_url 追加
-- Supabase SQL Editor にコピペで実行
--
-- 店舗の Instagram 公式アカウント URL を保存し、
-- /admin/restaurants/new の URL 自動入力 (Instagram URL) と
-- 詳細ページのリンクボタンで使用する。

alter table public.restaurants
  add column if not exists instagram_url text;
