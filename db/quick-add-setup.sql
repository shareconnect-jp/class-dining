-- ================================================================
-- /admin/quick-add (取材アップロード画面) のための DB 拡張
-- ================================================================

-- 1) restaurants に動画ギャラリー列を追加
alter table public.restaurants
  add column if not exists gallery_video_urls text[] default '{}';

-- 取材メモ (AI生成元の素材) を別途保存しておく
alter table public.restaurants
  add column if not exists editorial_note text;

-- 2) Storage RLS — restaurant-photos バケット用
-- (バケット自体は API で作成。ポリシーは SQL で設定)

-- 既存ポリシーがあれば削除して再作成
drop policy if exists "Public read restaurant-photos" on storage.objects;
drop policy if exists "Authed write restaurant-photos" on storage.objects;
drop policy if exists "Authed update restaurant-photos" on storage.objects;
drop policy if exists "Authed delete restaurant-photos" on storage.objects;

-- 公開: 全員が読める
create policy "Public read restaurant-photos"
  on storage.objects for select
  using (bucket_id = 'restaurant-photos');

-- 認証ユーザーが投稿
create policy "Authed write restaurant-photos"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-photos'
    and auth.role() = 'authenticated'
  );

create policy "Authed update restaurant-photos"
  on storage.objects for update
  using (
    bucket_id = 'restaurant-photos'
    and auth.role() = 'authenticated'
  );

create policy "Authed delete restaurant-photos"
  on storage.objects for delete
  using (
    bucket_id = 'restaurant-photos'
    and auth.role() = 'authenticated'
  );

-- 確認
select column_name, data_type from information_schema.columns
  where table_schema = 'public' and table_name = 'restaurants'
    and column_name in ('gallery_video_urls', 'editorial_note');
