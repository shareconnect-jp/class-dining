-- ================================================================
-- restaurants にもりもり情報用カラム追加 (Tabelog 拡張取得 + Insta/各種)
-- ================================================================

alter table public.restaurants add column if not exists phone           text;
alter table public.restaurants add column if not exists opening_hours   text;
alter table public.restaurants add column if not exists closed_days     text;
alter table public.restaurants add column if not exists seats           text;
alter table public.restaurants add column if not exists smoking         text;
alter table public.restaurants add column if not exists cards_accepted  text;
alter table public.restaurants add column if not exists parking         text;
alter table public.restaurants add column if not exists access_text     text;
alter table public.restaurants add column if not exists dinner_budget   text;
alter table public.restaurants add column if not exists lunch_budget    text;
alter table public.restaurants add column if not exists rating          numeric(3,1);
alter table public.restaurants add column if not exists rating_count    integer;
alter table public.restaurants add column if not exists instagram_url   text;

-- 確認
select column_name, data_type from information_schema.columns
  where table_schema = 'public' and table_name = 'restaurants'
    and column_name in (
      'phone','opening_hours','closed_days','seats','smoking',
      'cards_accepted','parking','access_text','dinner_budget',
      'lunch_budget','rating','rating_count','instagram_url'
    )
  order by column_name;
