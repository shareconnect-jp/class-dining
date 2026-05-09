-- ================================================================
-- CLASS DINING — 初期投入用 SQL (schema + seed 合体版)
-- Supabase SQL Editor に全文ペースト → Run で 1 発で完了
-- ================================================================

-- ============================================================
-- 1) restaurants テーブル
-- ============================================================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  prefecture text,
  area text,
  genre text,
  description text,
  address text,
  price_min integer,
  price_max integer,
  tabelog_url text,
  official_url text,
  google_map_url text,
  main_image_url text,
  gallery_image_urls text[] default '{}',
  private_room boolean default false,
  vip_available boolean default false,
  business_trip_friendly boolean default false,
  business_dining_score integer default 3 check (business_dining_score between 1 and 5),
  quietness_score integer default 3 check (quietness_score between 1 and 5),
  conversation_score integer default 3 check (conversation_score between 1 and 5),
  access_score integer default 3 check (access_score between 1 and 5),
  customer_types text[] default '{}',
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists restaurants_prefecture_genre_idx
  on public.restaurants (prefecture, genre)
  where is_published = true;

create index if not exists restaurants_is_published_idx
  on public.restaurants (is_published);

-- ============================================================
-- 2) genres マスタ
-- ============================================================
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 3) features (特集記事)
-- ============================================================
create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  hero_image_url text,
  body_md text,
  restaurant_ids uuid[] default '{}',
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists features_is_published_idx
  on public.features (is_published, published_at desc);

-- ============================================================
-- 4) updated_at 自動更新トリガ
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_features_updated_at on public.features;
create trigger trg_features_updated_at
  before update on public.features
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5) RLS (Row Level Security)
-- ============================================================
alter table public.restaurants enable row level security;
alter table public.genres      enable row level security;
alter table public.features    enable row level security;

-- 公開: is_published = true は誰でも読める
drop policy if exists "public read published restaurants" on public.restaurants;
create policy "public read published restaurants"
  on public.restaurants for select
  using (is_published = true);

drop policy if exists "public read genres" on public.genres;
create policy "public read genres"
  on public.genres for select
  using (true);

drop policy if exists "public read published features" on public.features;
create policy "public read published features"
  on public.features for select
  using (is_published = true);

-- 認証ユーザー: 全件 SELECT/INSERT/UPDATE/DELETE
drop policy if exists "authed full access restaurants" on public.restaurants;
create policy "authed full access restaurants"
  on public.restaurants for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authed full access genres" on public.genres;
create policy "authed full access genres"
  on public.genres for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authed full access features" on public.features;
create policy "authed full access features"
  on public.features for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 6) ジャンルマスタ seed
-- ============================================================
insert into public.genres (slug, name, display_order) values
  ('sushi',        '寿司',       10),
  ('yakiniku',     '焼肉',       20),
  ('washoku',      '和食',       30),
  ('french',       'フレンチ',   40),
  ('italian',      'イタリアン', 50),
  ('pizza',        'ピザ',       60),
  ('pasta',        'パスタ',     70),
  ('izakaya',      '居酒屋',     80),
  ('bar',          'バー',       90),
  ('teppanyaki',   '鉄板焼き',  100),
  ('yakitori',     '焼鳥',      110),
  ('kushiage',     '串揚げ',    120)
on conflict (slug) do nothing;

-- ============================================================
-- 7) ダミー店舗 5件 seed
-- ============================================================
insert into public.restaurants (
  name, slug, prefecture, area, genre, description, address,
  price_min, price_max, main_image_url, tabelog_url,
  private_room, vip_available, business_trip_friendly,
  business_dining_score, quietness_score, conversation_score, access_score,
  customer_types, is_published
) values
(
  '銀座 鮨 匠',
  'ginza-sushi-takumi',
  '東京都', '銀座', 'sushi',
  '銀座のカウンターで供される、洗練された江戸前鮨。重要な接待にふさわしい静謐な空間。',
  '東京都中央区銀座X-X-X',
  30000, 50000,
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130101/rstLst/sushi/',
  true, true, true,
  5, 5, 5, 5,
  array['経営者', '弁護士', '金融関係者'],
  true
),
(
  '北新地 焼肉 凛',
  'kitashinchi-yakiniku-rin',
  '大阪府', '北新地', 'yakiniku',
  '大阪・北新地の路地裏に佇む、完全個室の焼肉店。VIP対応の専属サービス。',
  '大阪府大阪市北区曽根崎新地X-X-X',
  25000, 40000,
  'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=1200&q=80',
  'https://tabelog.com/osaka/A2701/A270103/rstLst/yakiniku/',
  true, true, false,
  5, 4, 5, 4,
  array['経営者', '会計士', '不動産関係者'],
  true
),
(
  '名駅 割烹 蒼',
  'meieki-kappo-sou',
  '愛知県', '名駅', 'washoku',
  '名古屋駅徒歩3分。出張時の会食に最適な、本格割烹。落ち着いた個室を完備。',
  '愛知県名古屋市中村区名駅X-X-X',
  20000, 35000,
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
  'https://tabelog.com/aichi/A2301/A230101/rstLst/japanese/',
  true, false, true,
  4, 5, 5, 5,
  array['経営者', '税理士', '医師'],
  true
),
(
  '六本木 鉄板 煌',
  'roppongi-teppan-kou',
  '東京都', '六本木', 'teppanyaki',
  '六本木ヒルズエリアの鉄板焼き。目の前で繰り広げられる調理と、外資系幹部にも対応する英語サービス。',
  '東京都港区六本木X-X-X',
  35000, 60000,
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
  'https://tabelog.com/tokyo/A1307/A130701/rstLst/teppanyaki/',
  true, true, true,
  5, 4, 4, 5,
  array['経営者', '外資系役員', '金融関係者'],
  true
),
(
  '福岡 中洲 Bar Rei',
  'fukuoka-nakasu-bar-rei',
  '福岡県', '中洲', 'bar',
  '出張先での二次会に。中洲の喧騒から一歩離れた、静謐なオーセンティックバー。',
  '福岡県博多区中洲X-X-X',
  8000, 15000,
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80',
  'https://tabelog.com/fukuoka/A4001/A400103/rstLst/bar/',
  false, true, true,
  4, 5, 5, 4,
  array['経営者', '弁護士', '医師'],
  true
)
on conflict (slug) do nothing;

-- ================================================================
-- 完了確認
-- ================================================================
select
  (select count(*) from public.restaurants) as restaurants_count,
  (select count(*) from public.genres)      as genres_count,
  (select count(*) from public.features)    as features_count;
-- 期待値: restaurants=5, genres=12, features=0
