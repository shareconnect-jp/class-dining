-- CLASS DINING seed data
-- schema.sql の後に Supabase SQL Editor で実行

-- ============================================================
-- ジャンルマスタ
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
-- ダミー店舗 5件
-- ============================================================
insert into public.restaurants (
  name, slug, prefecture, area, genre, description, address,
  price_min, price_max, main_image_url,
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
  '福岡県福岡市博多区中洲X-X-X',
  8000, 15000,
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80',
  false, true, true,
  4, 5, 5, 4,
  array['経営者', '弁護士', '医師'],
  true
)
on conflict (slug) do nothing;
