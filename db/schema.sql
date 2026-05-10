-- CLASS DINING schema
-- Supabase SQL Editor にコピペで実行

-- ============================================================
-- restaurants
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
  postal_code text,
  phone text,
  opening_hours text,
  closed_days text,
  lat double precision,
  lng double precision,
  price_min integer,
  price_max integer,
  price_range text,
  tabelog_url text,
  official_url text,
  google_map_url text,
  instagram_url text,
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
-- genres (マスタ)
-- ============================================================
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- features (特集記事)
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
-- updated_at 自動更新トリガ
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
-- RLS（Row Level Security）
-- ============================================================
alter table public.restaurants enable row level security;
alter table public.genres      enable row level security;
alter table public.features    enable row level security;

-- 公開：is_published = true は誰でも読める
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

-- 認証ユーザー：全件 SELECT/INSERT/UPDATE/DELETE
-- （管理画面は service_role key を使うので実質 bypass されるが、念のため）
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
