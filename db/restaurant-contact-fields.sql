-- 店舗連絡先・営業情報カラム追加 (URL 自動入力対応)
-- Supabase SQL Editor にコピペで実行
--
-- 既存環境を壊さないよう全カラム NULLABLE で追加。
-- /admin/restaurants/new の URL 自動入力 (食べログ / Google マップ) から
-- 取得した値を保存できるようにする。

alter table public.restaurants
  add column if not exists postal_code text,
  add column if not exists phone text,
  add column if not exists opening_hours text,
  add column if not exists closed_days text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists price_range text;

-- 緯度経度ペアの矛盾防止 (両方入っているか、両方 null か)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'restaurants_latlng_paired_chk'
  ) then
    alter table public.restaurants
      add constraint restaurants_latlng_paired_chk
      check ((lat is null) = (lng is null));
  end if;
end $$;
