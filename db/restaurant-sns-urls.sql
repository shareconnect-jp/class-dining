-- restaurants の SNS URL カラム追加 (X / TikTok / LINE 公式)
-- Supabase SQL Editor にコピペで実行

alter table public.restaurants
  add column if not exists x_url text,
  add column if not exists tiktok_url text,
  add column if not exists line_url text;
