-- =================================================================
-- CLASS DINING 編集ピック v1 — 全国 高級店 20件
-- 公知情報ベースの候補リスト。実取材の可否は別途。
-- - 住所は NULL (管理画面で公式情報を確認しながら追記推奨)
-- - tabelog_url はエリア+ジャンル一覧ページ (実店舗 URL は管理画面で差し替え)
-- - スコアは 4-5 で初期化、main_image_url は Unsplash プレースホルダ
-- - is_published=true で即公開、編集部メモは description 末尾に
-- =================================================================

insert into public.restaurants (
  name, slug, prefecture, area, genre, description, address,
  price_min, price_max, main_image_url, tabelog_url,
  private_room, vip_available, business_trip_friendly,
  business_dining_score, quietness_score, conversation_score, access_score,
  customer_types, is_published
) values
-- ───────── Tokyo / Sushi ─────────
(
  '鮨 さいとう',
  'roppongi-sushi-saito',
  '東京都', '六本木', 'sushi',
  '六本木の頂点に位置する江戸前鮨。世界的な評価と希少な予約枠で、最高峰の接待シーンに選ばれる一軒。',
  null,
  40000, 60000,
  'https://images.unsplash.com/photo-1607301406259-dfb186e15de8?w=1200&q=80',
  'https://tabelog.com/tokyo/A1307/A130701/rstLst/sushi/',
  true, true, true,
  5, 5, 5, 5,
  array['経営者', '弁護士', '金融関係者', '外資系役員'],
  true
),
(
  '銀座 久兵衛 本店',
  'ginza-kyubey-honten',
  '東京都', '銀座', 'sushi',
  '昭和初期創業の銀座を代表する江戸前鮨の老舗。確かな品格で重要顧客の接待に外さない。',
  null,
  20000, 40000,
  'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130101/rstLst/sushi/',
  true, true, true,
  5, 4, 4, 5,
  array['経営者', '弁護士', '医師', '不動産関係者'],
  true
),
(
  '鮨 よしたけ',
  'ginza-sushi-yoshitake',
  '東京都', '銀座', 'sushi',
  '銀座の隠れ家的カウンター鮨。少人数の濃密な時間で、海外ゲストアテンドにも好適。',
  null,
  35000, 55000,
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130101/rstLst/sushi/',
  true, true, true,
  5, 5, 5, 5,
  array['経営者', '外資系役員', '金融関係者'],
  true
),
(
  '銀座 鮨 青木 本店',
  'ginza-sushi-aoki',
  '東京都', '銀座', 'sushi',
  '正統江戸前を継承しつつ、現代的な感性で構成。会話と所作の両方で品格を保てる店構え。',
  null,
  18000, 35000,
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130101/rstLst/sushi/',
  true, false, true,
  4, 5, 5, 5,
  array['経営者', '税理士', '会計士'],
  true
),

-- ───────── Tokyo / Yakiniku ─────────
(
  'USHIGORO S. NISHIAZABU',
  'nishiazabu-ushigoro-s',
  '東京都', '西麻布', 'yakiniku',
  '西麻布の完全個室特化、和牛コース仕立ての高級焼肉。商談前後の機微な会話に最適な静謐空間。',
  null,
  20000, 35000,
  'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=1200&q=80',
  'https://tabelog.com/tokyo/A1307/A130701/rstLst/yakiniku/',
  true, true, true,
  5, 5, 5, 4,
  array['経営者', '金融関係者', '不動産関係者', '外資系役員'],
  true
),
(
  '焼肉ジャンボ 本郷店',
  'hongo-yakiniku-jumbo',
  '東京都', '本郷', 'yakiniku',
  '一頭買いの希少部位を圧倒的クオリティで供する名店。少々カジュアルだが本物志向の経営者会食に。',
  null,
  15000, 25000,
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80',
  'https://tabelog.com/tokyo/A1322/A132201/rstLst/yakiniku/',
  true, false, false,
  4, 4, 5, 4,
  array['経営者', '医師', '弁護士'],
  true
),

-- ───────── Tokyo / Washoku ─────────
(
  '神田',
  'nishiazabu-kanda',
  '東京都', '西麻布', 'washoku',
  '日本料理の最高峰の一つに数えられる名店。海外ゲスト・要人接待の決め手として選ばれる。',
  null,
  35000, 60000,
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
  'https://tabelog.com/tokyo/A1307/A130701/rstLst/japanese/',
  true, true, true,
  5, 5, 5, 4,
  array['経営者', '外資系役員', '金融関係者', '弁護士'],
  true
),
(
  '日本料理 龍吟',
  'hibiya-ryugin',
  '東京都', '日比谷', 'washoku',
  '革新的な日本料理で世界的な評価を獲得。日比谷の好立地、重要顧客のアテンドに使える格式。',
  null,
  35000, 50000,
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130103/rstLst/japanese/',
  true, true, true,
  5, 5, 4, 5,
  array['経営者', '外資系役員', '金融関係者'],
  true
),
(
  '麻布 幸村',
  'azabu-koumura',
  '東京都', '麻布十番', 'washoku',
  '麻布十番、季節を映す繊細な仕立て。落ち着いた空間と所作の上質さで、品格ある接待に。',
  null,
  25000, 40000,
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80',
  'https://tabelog.com/tokyo/A1307/A130702/rstLst/japanese/',
  true, false, true,
  5, 5, 5, 4,
  array['経営者', '医師', '税理士'],
  true
),

-- ───────── Tokyo / French ─────────
(
  'Quintessence',
  'shinagawa-quintessence',
  '東京都', '北品川', 'french',
  '日本フレンチの最高峰。お任せコースのみで、要人接待・記念会食に最適な世界水準。',
  null,
  30000, 50000,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  'https://tabelog.com/tokyo/A1316/A131601/rstLst/french/',
  true, true, false,
  5, 5, 4, 4,
  array['経営者', '外資系役員', '金融関係者'],
  true
),
(
  'L''Effervescence',
  'nishiazabu-leffervescence',
  '東京都', '西麻布', 'french',
  '日本の食材と仏料理の技を融合する革新的フレンチ。海外ゲストへの強いインパクトを与える一軒。',
  null,
  30000, 50000,
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1200&q=80',
  'https://tabelog.com/tokyo/A1307/A130701/rstLst/french/',
  true, true, true,
  5, 5, 5, 4,
  array['経営者', '外資系役員', '金融関係者', '医師'],
  true
),

-- ───────── Tokyo / Italian ─────────
(
  'リストランテASO',
  'daikanyama-ristorante-aso',
  '東京都', '代官山', 'italian',
  '代官山の名邸宅レストラン。テラスと格調ある内装、慶事や記念会食、ゲスト接待に華を添える。',
  null,
  20000, 35000,
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=80',
  'https://tabelog.com/tokyo/A1303/A130303/rstLst/italian/',
  true, true, false,
  4, 5, 4, 4,
  array['経営者', '外資系役員', '不動産関係者'],
  true
),

-- ───────── Tokyo / Teppanyaki ─────────
(
  '銀座 うかい亭',
  'ginza-ukaitei',
  '東京都', '銀座', 'teppanyaki',
  '美術品が並ぶ銀座の隠れ家鉄板焼。一席ごとの濃密な時間で、重要顧客のアテンドに鉄板級。',
  null,
  20000, 40000,
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130101/rstLst/teppanyaki/',
  true, true, true,
  5, 5, 5, 5,
  array['経営者', '外資系役員', '金融関係者'],
  true
),

-- ───────── Tokyo / Bar ─────────
(
  'オールドインペリアルバー (帝国ホテル)',
  'imperial-hotel-old-imperial-bar',
  '東京都', '内幸町', 'bar',
  '帝国ホテル本館、フランク・ロイド・ライト設計を継ぐ名バー。商談後の二次会の風格を担保する。',
  null,
  4000, 10000,
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130103/rstLst/bar/',
  false, true, true,
  5, 5, 5, 5,
  array['経営者', '弁護士', '医師', '外資系役員'],
  true
),
(
  'ピーター ザ・バー (ザ・ペニンシュラ東京)',
  'peninsula-tokyo-peter-bar',
  '東京都', '有楽町', 'bar',
  '皇居外苑を見下ろす最上階のホテルバー。海外ゲストに見せたい「東京の夜」がここにある。',
  null,
  5000, 12000,
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80',
  'https://tabelog.com/tokyo/A1301/A130103/rstLst/bar/',
  false, true, true,
  5, 4, 4, 5,
  array['経営者', '外資系役員', '金融関係者'],
  true
),

-- ───────── Osaka ─────────
(
  'HAJIME',
  'osaka-hajime',
  '大阪府', '江戸堀', 'french',
  '世界的に評価される大阪のイノベーティブフレンチ。出張中の経営者会食、特別な記念に。',
  null,
  40000, 60000,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  'https://tabelog.com/osaka/A2701/A270107/rstLst/french/',
  true, true, true,
  5, 5, 4, 4,
  array['経営者', '外資系役員', '金融関係者'],
  true
),
(
  '太庵',
  'kitashinchi-taian',
  '大阪府', '北新地', 'washoku',
  '北新地の正統割烹。質実な仕立てと洗練された接客で、関西出張時の会食に外さない。',
  null,
  20000, 35000,
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
  'https://tabelog.com/osaka/A2701/A270103/rstLst/japanese/',
  true, true, true,
  5, 5, 5, 5,
  array['経営者', '会計士', '税理士', '不動産関係者'],
  true
),

-- ───────── Kyoto ─────────
(
  '菊乃井 本店',
  'kyoto-kikunoi-honten',
  '京都府', '東山', 'washoku',
  '京都を代表する老舗料亭。海外ゲスト・要人接待で京都の格を見せたい時の決定打。',
  null,
  30000, 50000,
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
  'https://tabelog.com/kyoto/A2601/A260301/rstLst/japanese/',
  true, true, true,
  5, 5, 5, 4,
  array['経営者', '外資系役員', '弁護士', '医師'],
  true
),
(
  '瓢亭 本店',
  'kyoto-hyotei-honten',
  '京都府', '南禅寺', 'washoku',
  '南禅寺、400年以上の歴史を誇る老舗。朝粥でも知られ、出張時の朝食にも品格を加える。',
  null,
  25000, 45000,
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80',
  'https://tabelog.com/kyoto/A2601/A260301/rstLst/japanese/',
  true, true, false,
  5, 5, 5, 4,
  array['経営者', '外資系役員', '金融関係者'],
  true
),
(
  '木乃婦',
  'kyoto-kinobu',
  '京都府', '下京区', 'washoku',
  '京都らしさを保ちながら現代的アレンジも巧みな名店。重要顧客の京都アテンドに。',
  null,
  20000, 35000,
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80',
  'https://tabelog.com/kyoto/A2601/A260204/rstLst/japanese/',
  true, true, true,
  5, 5, 5, 4,
  array['経営者', '弁護士', '医師', '会計士'],
  true
)
on conflict (slug) do nothing;

-- 確認
select count(*) as total_restaurants from public.restaurants;
select prefecture, genre, count(*) from public.restaurants group by prefecture, genre order by prefecture, genre;
