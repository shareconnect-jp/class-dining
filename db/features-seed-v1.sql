-- ================================================================
-- CLASS DINING 特集記事 v1 — 編集ピックを束ねた記事 3本
-- restaurant_ids は UUID 配列、サブクエリで slug→id を解決
-- ================================================================

insert into public.features (slug, title, subtitle, hero_image_url, body_md, restaurant_ids, is_published, published_at)
values
(
  'tokyo-sushi-best-5',
  '東京の接待向け鮨 5選',
  '銀座・六本木・麻布。外資系役員接待でも外さない名店を厳選。',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1600&q=80',
  $md$
東京は世界でも屈指の鮨激戦区。なかでも**接待・会食**で使える店を選ぶ際は、味の頂点だけでなく、静謐さ・所作の品格・予約のしやすさ・海外ゲスト対応まで含めた総合力が問われます。

CLASS DINING 編集部では、独自の評価軸 (接待向き / 静謐性 / 個室 / VIP対応) で全国の名店を継続的に取材・調査しています。本記事では、東京エリアにおいて **「重要顧客の接待で外さない」** 観点から厳選した5軒をご紹介します。

## 厳選の基準

- **接待向き**: 重要顧客・VIPに自信を持って案内できるか
- **静謐性**: 他席の声に妨げられず、機微な話ができるか
- **海外ゲスト対応**: カウンター/個室の選択肢、英語対応、所作の説明
- **予約難度と希少性**: 「呼べる」店であることのブランド価値

## ランキング

各店舗の詳細は本ページ下部のカードからご覧いただけます。順位はあくまで編集部による相対評価で、すべて高水準の名店であることに違いはありません。
$md$,
  array[
    (select id from public.restaurants where slug = 'roppongi-sushi-saito'),
    (select id from public.restaurants where slug = 'ginza-kyubey-honten'),
    (select id from public.restaurants where slug = 'ginza-sushi-yoshitake'),
    (select id from public.restaurants where slug = 'ginza-sushi-aoki'),
    (select id from public.restaurants where slug = 'ginza-sushi-takumi')
  ]::uuid[],
  true,
  now()
),
(
  'kyoto-ryotei-3',
  '京都出張で使える、老舗料亭 3選',
  '南禅寺・東山・下京。四百年の歴史と現代的感性が同居する、京都の格を体現する3軒。',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80',
  $md$
京都での会食は、単なる食事を超えた「**経営者としての文化的な所作**」を試される場でもあります。海外ゲストや本社役員の京都アテンドで失礼のない、あるいは「京都らしさ」を最大限活かせる老舗料亭を3軒厳選しました。

## なぜ京都の老舗料亭か

京都には数百年の歴史を持つ料亭が今なお現役で営業しています。これは世界的に見ても稀有なことであり、海外ゲストには **「日本の連続性」** を体験させる絶好の場となります。

また、京町家の建築・庭園・調度品といったハードウェア、そして仲居さんの所作・季節のしつらいといったソフトウェアの両方で、他では再現不可能な体験が提供されます。

## 使い分けのヒント

- **菊乃井 本店**: 海外ゲスト・要人接待で京都の格を見せたい時
- **瓢亭 本店**: 朝食(朝粥)から夜まで、出張中の連続会食シーンに
- **木乃婦**: 現代的アレンジも巧み、慣れない方を連れて行く際の安心感
$md$,
  array[
    (select id from public.restaurants where slug = 'kyoto-kikunoi-honten'),
    (select id from public.restaurants where slug = 'kyoto-hyotei-honten'),
    (select id from public.restaurants where slug = 'kyoto-kinobu')
  ]::uuid[],
  true,
  now()
),
(
  'tokyo-french-italian-pick',
  '東京の経営者会食、フレンチ × イタリアンの選び方',
  '世界水準のフレンチから、邸宅イタリアンまで。シーン別にどう使い分けるか。',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
  $md$
和食以外の選択肢として、フレンチとイタリアンは経営者会食の重要なオプションです。とくに **海外ゲストの食事制限**(生魚NG、ベジタリアン等)に対応しやすく、ワインリストの厚みも会話の重要な触媒になります。

## フレンチ: 世界基準の本気の一軒

- **Quintessence**: お任せコース一本、世界的な評価を確立した日本フレンチの最高峰
- **L'Effervescence**: 日本食材と仏料理の融合、海外ゲストへのインパクトが強い

## イタリアン: 邸宅で迎える優雅さ

- **リストランテASO**: 代官山の名邸宅、テラスと格調ある空間。慶事・記念会食の華やかさ

## 選び方のフレームワーク

| シーン | 推奨ジャンル | 理由 |
|---|---|---|
| 海外要人の最重要接待 | フレンチ (Quintessence/L'Effervescence) | 食制限対応 + 世界的評価の安心感 |
| 慶事・パートナー同席 | イタリアン (ASO) | 華やかさと開放感、写真映え |
| 静かな商談 | フレンチ個室 | 会話のしやすさ |
| 役員会の打ち上げ | イタリアン | リラックスした雰囲気 |
$md$,
  array[
    (select id from public.restaurants where slug = 'shinagawa-quintessence'),
    (select id from public.restaurants where slug = 'nishiazabu-leffervescence'),
    (select id from public.restaurants where slug = 'daikanyama-ristorante-aso')
  ]::uuid[],
  true,
  now()
)
on conflict (slug) do nothing;

-- 確認
select slug, title, array_length(restaurant_ids, 1) as restaurants, is_published
  from public.features order by created_at desc;
