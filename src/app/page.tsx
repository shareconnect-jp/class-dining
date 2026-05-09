import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSearch } from "@/components/hero-search";
import { fetchPublishedRestaurants } from "@/lib/data";
import { GENRES, genreSlugToName, prefectureNameToSlug } from "@/lib/types";

const STRIP_PHOTOS = [
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=2070&auto=format&fit=crop",
];

const GENRE_HERO_IMAGES: Record<string, string> = {
  sushi:
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1974&auto=format&fit=crop",
  yakiniku:
    "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1931&auto=format&fit=crop",
  washoku:
    "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=1974&auto=format&fit=crop",
  teppanyaki:
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2070&auto=format&fit=crop",
  french:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
  italian:
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=2032&auto=format&fit=crop",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2069&auto=format&fit=crop",
  yakitori:
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?q=80&w=1964&auto=format&fit=crop",
};

const FEATURED_GENRE_SLUGS = [
  "sushi",
  "yakiniku",
  "washoku",
  "teppanyaki",
  "french",
  "italian",
  "bar",
  "yakitori",
];

const GENRE_TAGLINES: Record<string, string> = {
  sushi: "役員接待・海外ゲストに。",
  yakiniku: "個室と高級和牛で外さない。",
  washoku: "落ち着きと品格の主力。",
  teppanyaki: "VIP向けのライブ感。",
  french: "格式ある会食に。",
  italian: "華やかで使いやすい。",
  bar: "2次会と商談後の余韻。",
  yakitori: "通っぽさのある名店。",
};

const MAGAZINE_ITEMS = [
  {
    href: "/osaka/yakiniku",
    tag: "OSAKA / YAKINIKU",
    title: "北新地で信頼を深める個室焼肉。",
    body: "高級和牛とワインで外さない夜。",
    img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop",
  },
  {
    href: "/tokyo/bar",
    tag: "BAR / AFTER",
    title: "商談後に使えるホテルバー。",
    body: "2軒目まで設計できる大人の導線。",
    img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2069&auto=format&fit=crop",
  },
  {
    href: "/tokyo/french",
    tag: "WINE / DINNER",
    title: "ワイン好きの役員に刺さる店。",
    body: "会話が自然に深まる一軒。",
    img: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop",
  },
];

const SEO_LINKS = [
  "/tokyo/sushi",
  "/osaka/yakiniku",
  "/aichi/washoku",
  "/fukuoka/bar",
  "/hokkaido/izakaya",
];

export default async function HomePage() {
  const all = await fetchPublishedRestaurants();
  const featured = all.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main id="top">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#050505]">
          {/* 背景：写真分割 (PCのみ) */}
          <div className="absolute inset-0 hidden md:grid grid-cols-[1.25fr_0.75fr]">
            <div className="relative h-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2070&auto=format&fit=crop"
                alt="高級レストランでの会食"
                className="w-full h-full object-cover saturate-[.92] contrast-[1.08]"
              />
            </div>
            <div className="grid grid-rows-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop"
                alt="ホテルバー"
                className="w-full h-full object-cover saturate-[.92] contrast-[1.08]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1974&auto=format&fit=crop"
                alt="高級寿司"
                className="w-full h-full object-cover saturate-[.92] contrast-[1.08]"
              />
            </div>
          </div>
          {/* モバイル背景 */}
          <div className="absolute inset-0 md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2070&auto=format&fit=crop"
              alt=""
              className="w-full h-full object-cover saturate-[.92] contrast-[1.08]"
            />
          </div>
          {/* グラデオーバーレイ */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/95 via-black/75 to-black/30 md:from-black/95 md:via-black/75 md:to-black/30" />
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_65%_42%,rgba(200,169,107,0.20),transparent_34%)] pointer-events-none" />
          {/* モバイルは下方向のオーバーレイ強め */}
          <div className="absolute inset-0 z-[1] md:hidden bg-gradient-to-t from-black via-black/70 to-black/40" />

          <div className="relative z-[2] w-[90%] max-w-[1320px] mx-auto pt-20 sm:pt-24 lg:pt-[78px]">
            <div className="max-w-[780px]">
              <p className="text-[color:var(--color-gold)] text-[11px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase font-bold mb-5 sm:mb-6">
                Executive Dining Media
              </p>
              <h1 className="font-serif text-[44px] sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.14] tracking-[0.02em] mb-6 sm:mb-7 font-black">
                信頼は、
                <br />
                食事の時間で
                <br />
                深まる。
              </h1>
              <p className="text-[#ded8ce] text-sm sm:text-base md:text-lg max-w-[620px] leading-relaxed mb-8 sm:mb-10">
                経営者・士業・ハイクラスビジネスパーソンのための、接待・会食・出張グルメメディア。品格ある一軒を、最短で。
              </p>
              <div className="flex gap-3 sm:gap-4 flex-wrap mb-10 sm:mb-12">
                <Link
                  href="/restaurants"
                  className="inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-[15px] rounded-full bg-[color:var(--color-gold)] text-[#0a0a0a] font-black text-sm tracking-wider shadow-[0_20px_60px_rgba(200,169,107,0.25)] hover:-translate-y-0.5 hover:bg-[#d7b977] transition-all"
                >
                  名店を探す
                </Link>
                <Link
                  href="#magazine"
                  className="inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-[15px] rounded-full border border-white/25 bg-white/5 text-white text-sm tracking-wider hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  特集を見る
                </Link>
              </div>
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* PHOTO STRIP */}
        <div className="py-5 bg-[#0d0d0d] border-y border-white/5 overflow-hidden">
          <div className="w-[94%] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {STRIP_PHOTOS.map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-3xl border border-white/5 group ${
                  (i === 1 || i === 4) ? "lg:h-[270px] lg:-mt-6" : "h-[170px] sm:h-[200px] lg:h-[220px]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover saturate-[.9] contrast-[1.05] group-hover:scale-[1.06] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
              </div>
            ))}
          </div>
        </div>

        {/* SCENE */}
        <Section id="scene">
          <SectionHead
            eyebrow="Luxury Scene"
            title={
              <>
                成功者の時間にふさわしい、
                <br />
                上質な会食体験を。
              </>
            }
            desc="会食、バー、鮨、個室、ホテルラウンジのビジュアルで“使いたい空気感”を伝えます。"
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-7">
            <VisualCard
              src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2070&auto=format&fit=crop"
              alt="上質な会食シーン"
              label="PRIVATE DINING"
              title="美しい時間が、品格ある会食を。"
              body="富裕層感を演出しつつ、派手すぎない“静かなラグジュアリー”へ。"
              minH="min-h-[430px] lg:min-h-[560px]"
              titleSize="text-2xl sm:text-3xl"
            />
            <div className="grid gap-6 lg:gap-7">
              <VisualCard
                src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop"
                alt="ホテルバー"
                label="HOTEL BAR"
                title="商談後の一杯まで、絵になる。"
                minH="min-h-[266px]"
                titleSize="text-xl sm:text-2xl"
              />
              <VisualCard
                src="https://images.unsplash.com/photo-1579027989536-b7b1f875659b?q=80&w=2070&auto=format&fit=crop"
                alt="高級レストラン"
                label="EXECUTIVE TABLE"
                title="選ばれた人だけが知る名店。"
                minH="min-h-[266px]"
                titleSize="text-xl sm:text-2xl"
              />
            </div>
          </div>
        </Section>

        {/* GENRE */}
        <Section id="genres" dark>
          <SectionHead
            eyebrow="Genre"
            title="ジャンルも、写真で選ぶ。"
            desc="カード型の文字中心ではなく、写真を全面に敷いたカテゴリ導線へ。"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[18px]">
            {FEATURED_GENRE_SLUGS.map((slug, i) => {
              const name = genreSlugToName(slug);
              return (
                <Link
                  key={slug}
                  href={`/tokyo/${slug}`}
                  className="relative rounded-[28px] min-h-[230px] sm:min-h-[280px] overflow-hidden border border-white/10 bg-[#151515] group hover:-translate-y-1.5 hover:border-[color:var(--color-gold)]/65 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={GENRE_HERO_IMAGES[slug]}
                    alt={name}
                    className="w-full h-full object-cover saturate-[.9] contrast-[1.04] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/85" />
                  <div className="absolute left-6 right-6 bottom-6 z-[2]">
                    <p className="text-[color:var(--color-gold)] text-xs tracking-[0.2em] mb-2.5 font-black">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="font-serif text-2xl mb-2">{name}</h3>
                    <p className="text-[#cfcfcf] text-[13px]">
                      {GENRE_TAGLINES[slug]}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>

        {/* VISUAL EDITORIAL */}
        <Section>
          <SectionHead
            eyebrow="Visual Editorial"
            title="写真で魅せる、会食シーン。"
            desc="“この店で誰と何を話すか”まで想像できるビジュアル構成にします。"
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_1fr] gap-4 sm:gap-[18px]">
            <VisualCard
              src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2070&auto=format&fit=crop"
              alt="エグゼクティブ会食"
              label="EXECUTIVE DINNER"
              title="大切な商談を、記憶に残る夜へ。"
              body="上質な空間が、会話と信頼を深める。"
              minH="min-h-[420px] lg:min-h-[620px]"
              titleSize="text-2xl sm:text-3xl"
            />
            <div className="grid gap-4 sm:gap-[18px]">
              <VisualCard
                src="https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop"
                alt="ワイン"
                label="WINE"
                title="ワインが強い店。"
                minH="min-h-[200px] lg:min-h-[301px]"
                titleSize="text-xl sm:text-2xl"
              />
              <VisualCard
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                alt="個室レストラン"
                label="PRIVATE ROOM"
                title="個室で深まる話。"
                minH="min-h-[200px] lg:min-h-[301px]"
                titleSize="text-xl sm:text-2xl"
              />
            </div>
            <VisualCard
              src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=2070&auto=format&fit=crop"
              alt="高級バー"
              label="AFTER DINING"
              title="2軒目まで、美しく設計する。"
              body="ホテルバー、会員制バー、静かなラウンジ。"
              minH="min-h-[420px] lg:min-h-[620px]"
              titleSize="text-2xl sm:text-3xl"
            />
          </div>
        </Section>

        {/* RESTAURANTS — 実データ */}
        <Section id="restaurants" dark>
          <SectionHead
            eyebrow="Restaurant Database"
            title="店舗一覧も、写真を主役に。"
            desc="店舗カードの画像比率を大きくし、ランキング感より“行きたくなる高級感”を優先します。"
          />
          <div className="flex justify-between gap-4 items-center mb-7 flex-wrap">
            <div className="flex gap-2.5 flex-wrap">
              <Chip href="/tokyo/sushi" active>東京</Chip>
              <Chip href="/osaka/yakiniku">大阪</Chip>
              <Chip href="/aichi/washoku">名古屋</Chip>
              <Chip href="/fukuoka/bar">福岡</Chip>
              <Chip href="/hokkaido/sushi">札幌</Chip>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Chip href="/tokyo/sushi" active>寿司</Chip>
              <Chip href="/tokyo/yakiniku">焼肉</Chip>
              <Chip href="/tokyo/washoku">和食</Chip>
              <Chip href="/tokyo/bar">バー</Chip>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-[26px]">
            {featured.map((r, i) => {
              const prefSlug = prefectureNameToSlug(r.prefecture ?? "");
              return (
                <Link
                  key={r.id}
                  href={`/restaurants/${r.slug}`}
                  className="bg-[#151515] border border-white/10 rounded-[32px] overflow-hidden group hover:-translate-y-1.5 hover:border-[color:var(--color-gold)]/50 transition-all block"
                >
                  <div className="h-[250px] sm:h-[310px] overflow-hidden relative">
                    {r.main_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.main_image_url}
                        alt={r.name}
                        className="w-full h-full object-cover saturate-[.92] contrast-[1.04] group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <span className="absolute top-4 left-4 bg-black/75 border border-[color:var(--color-gold)]/50 text-[color:var(--color-gold)] rounded-full px-3 py-1.5 text-xs font-black">
                      RANK {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Mini>{r.prefecture}</Mini>
                      {r.genre && <Mini>{genreSlugToName(r.genre)}</Mini>}
                      {r.private_room && <Mini>個室</Mini>}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl mb-2 leading-snug group-hover:text-[color:var(--color-gold)] transition-colors">
                      {r.name}
                    </h3>
                    <p className="text-[#aaa] text-sm mb-5 line-clamp-2">
                      {r.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 text-xs text-[#cfcfcf]">
                      <Score
                        label="接待"
                        value={"★".repeat(r.business_dining_score) + "☆".repeat(5 - r.business_dining_score)}
                      />
                      <Score
                        label="静かさ"
                        value={"★".repeat(r.quietness_score) + "☆".repeat(5 - r.quietness_score)}
                      />
                      <Score
                        label="予算"
                        value={
                          r.price_min
                            ? `¥${(r.price_min / 1000).toFixed(0)}k〜`
                            : "—"
                        }
                      />
                      <Score
                        label="VIP"
                        value={r.vip_available ? "対応" : "—"}
                      />
                    </div>
                    {prefSlug && r.genre && (
                      <p className="mt-4 text-[10px] tracking-[0.3em] text-[color:var(--color-gold)]">
                        詳細を見る →
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/restaurants"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-white/25 bg-white/5 text-white text-sm tracking-wider hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
            >
              すべての店舗を見る →
            </Link>
          </div>
        </Section>

        {/* MAGAZINE */}
        <Section id="magazine">
          <SectionHead
            eyebrow="Magazine"
            title="特集記事は、雑誌のように見せる。"
            desc="大きな写真と短いコピーで、富裕層向けメディア感を作ります。"
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-7">
            <Link href="/tokyo/sushi" className="block">
              <VisualCard
                src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1974&auto=format&fit=crop"
                alt="寿司特集"
                label="TOKYO / SUSHI"
                title="外資系役員接待で選ばれる、東京の鮨。"
                body="銀座・六本木・麻布の名店を、接待目線で厳選。"
                minH="min-h-[400px] lg:min-h-[560px]"
                titleSize="text-2xl sm:text-3xl"
              />
            </Link>
            <div className="grid gap-4">
              {MAGAZINE_ITEMS.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-4 items-center bg-[#111] border border-white/5 rounded-[26px] p-3.5 group hover:border-[color:var(--color-gold)]/40 transition-colors"
                >
                  <div className="h-[180px] sm:h-[130px] rounded-[20px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div>
                    <p className="text-[color:var(--color-gold)] text-xs tracking-[0.2em] mb-2 font-bold">
                      {m.tag}
                    </p>
                    <h4 className="font-serif text-lg sm:text-xl mb-2 leading-snug">
                      {m.title}
                    </h4>
                    <p className="text-[#aaa] text-[13px]">{m.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>

        {/* SEO BANNER */}
        <section
          className="py-20 sm:py-28 text-center bg-cover bg-center relative"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.80), rgba(0,0,0,0.88)), url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="w-[90%] max-w-[980px] mx-auto">
            <p className="text-[color:var(--color-gold)] text-xs tracking-[0.4em] uppercase font-bold mb-5">
              SEO Growth
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] leading-[1.35] mb-6">
              全国の「接待 × エリア × ジャンル」を、
              <br className="hidden sm:block" />
              写真で強くする。
            </h2>
            <p className="text-[#ddd] text-sm sm:text-base md:text-lg mb-8 leading-relaxed">
              「東京 接待 寿司」「梅田 個室 焼肉」「名古屋 出張 グルメ」などの検索流入を狙います。
            </p>
            <Link
              href="/restaurants"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[color:var(--color-gold)] text-[#0a0a0a] font-black text-sm tracking-wider shadow-[0_20px_60px_rgba(200,169,107,0.25)] hover:-translate-y-0.5 hover:bg-[#d7b977] transition-all"
            >
              店舗DBを見る
            </Link>
            <div className="flex gap-3 justify-center flex-wrap mt-8">
              {SEO_LINKS.map((href) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-[#ddd] text-[13px] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  {href}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/* ---------- 内部コンポーネント ---------- */

function Section({
  id,
  dark,
  children,
}: {
  id?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-24 lg:py-28 ${
        dark ? "bg-[#101010] border-y border-white/5" : ""
      }`}
    >
      <div className="w-[90%] max-w-[1320px] mx-auto">{children}</div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc: string;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 lg:gap-10 mb-12 sm:mb-14">
      <div>
        <p className="text-[color:var(--color-gold)] text-xs tracking-[0.4em] uppercase font-bold mb-4">
          {eyebrow}
        </p>
        <h2 className="font-serif text-[28px] sm:text-3xl md:text-4xl lg:text-[44px] leading-[1.35] font-black">
          {title}
        </h2>
      </div>
      <p className="text-[#aaa] max-w-[500px] text-sm sm:text-[15px] leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function VisualCard({
  src,
  alt,
  label,
  title,
  body,
  minH,
  titleSize,
}: {
  src: string;
  alt: string;
  label: string;
  title: string;
  body?: string;
  minH: string;
  titleSize: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[34px] ${minH} bg-[#151515] border border-white/5 group`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover saturate-[.9] contrast-[1.05] group-hover:scale-[1.04] transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
      <div className="absolute left-6 sm:left-8 right-6 sm:right-8 bottom-7 sm:bottom-8 z-[2]">
        <p className="text-[color:var(--color-gold)] text-xs tracking-[0.3em] mb-2.5 font-bold">
          {label}
        </p>
        <h3 className={`font-serif ${titleSize} leading-[1.45] mb-3`}>{title}</h3>
        {body && <p className="text-[#c9c9c9] text-sm">{body}</p>}
      </div>
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-[13px] transition-colors ${
        active
          ? "bg-[color:var(--color-gold)] text-[#090909] font-black"
          : "bg-[#151515] border border-white/10 text-[#bbb] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)]"
      }`}
    >
      {children}
    </Link>
  );
}

function Mini({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/35 px-2 py-1 rounded-full">
      {children}
    </span>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl px-2.5 py-2.5">
      <span className="text-[#888]">{label}</span>{" "}
      <b className="text-white">{value}</b>
    </div>
  );
}
