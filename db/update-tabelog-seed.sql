-- ================================================================
-- 既存の seed 5店舗に Tabelog URL (エリア+ジャンル別の一覧ページ) を追加
-- 実店舗の URL ではなくジャンル別検索ページなので、安全に「予約導線」のデモになる
-- 本番運用時は管理画面から実店舗の URL に差し替えてください
-- ================================================================

update public.restaurants
set tabelog_url = 'https://tabelog.com/tokyo/A1301/A130101/rstLst/sushi/'
where slug = 'ginza-sushi-takumi';

update public.restaurants
set tabelog_url = 'https://tabelog.com/osaka/A2701/A270103/rstLst/yakiniku/'
where slug = 'kitashinchi-yakiniku-rin';

update public.restaurants
set tabelog_url = 'https://tabelog.com/aichi/A2301/A230101/rstLst/japanese/'
where slug = 'meieki-kappo-sou';

update public.restaurants
set tabelog_url = 'https://tabelog.com/tokyo/A1307/A130701/rstLst/teppanyaki/'
where slug = 'roppongi-teppan-kou';

update public.restaurants
set tabelog_url = 'https://tabelog.com/fukuoka/A4001/A400103/rstLst/bar/'
where slug = 'fukuoka-nakasu-bar-rei';

-- 確認
select slug, name, tabelog_url from public.restaurants order by slug;
