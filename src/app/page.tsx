import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestaurantCard } from "@/components/restaurant-card";
import { fetchPublishedRestaurants } from "@/lib/data";
import { GENRES, PREFECTURES } from "@/lib/types";

export default async function HomePage() {
  const all = await fetchPublishedRestaurants();
  const featured = all.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,169,107,0.08),transparent_50%)]" />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 pt-20 sm:pt-28 lg:pt-32 pb-24 sm:pb-32 lg:pb-40">
            <p className="text-[10px] sm:text-xs tracking-[0.4em] sm:tracking-[0.5em] text-[color:var(--color-gold)] mb-6 sm:mb-8">
              FOR EXECUTIVES & PROFESSIONALS
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.15] mb-8 sm:mb-10 max-w-4xl">
              <span className="text-gold-gradient">接待</span>と
              <span className="text-gold-gradient">出張</span>の、
              <br />
              品格ある一軒を。
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[color:var(--color-text-muted)] leading-loose max-w-2xl mb-10 sm:mb-12">
              CLASS DINING は、経営者・弁護士・税理士・医師・金融関係者のための
              <br className="hidden md:block" />
              接待・会食・出張グルメメディア。個室・静謐・VIP対応など、
              <br className="hidden md:block" />
              ビジネス利用に特化した評価軸で、本物の名店だけを厳選してお届けします。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/restaurants"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-sm tracking-[0.3em]"
              >
                店舗を探す
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:border-[color:var(--color-text-muted)] transition-colors text-sm tracking-[0.3em]"
              >
                特集を読む
              </Link>
            </div>
          </div>
        </section>

        {/* 評価軸 */}
        <section className="border-y border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-elevated)]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-14 sm:py-20">
            <div className="text-center mb-14 sm:mb-16 gold-divider">
              <p className="text-[10px] sm:text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-3 sm:mb-4">
                THE CLASS DINING STANDARD
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl">
                ビジネス利用のための、独自の評価軸
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mt-16 sm:mt-20">
              {[
                { label: "接待向き", text: "重要顧客・VIPに自信を持って案内できるか" },
                { label: "静 謐 性", text: "他席の声に妨げられず、機微な話ができるか" },
                { label: "個 室", text: "完全個室・半個室の有無と質" },
                { label: "VIP対応", text: "予約難度・専属サービス・特別対応" },
                { label: "出張対応", text: "宿泊・空港・主要駅からのアクセス" },
                { label: "会話のしやすさ", text: "席間隔・BGM音量・天井高" },
                { label: "客 層", text: "経営者・士業・外資系幹部の比率" },
                { label: "予 算", text: "接待交際費の相場感に合致するか" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-l border-[color:var(--color-gold-deep)]/30 pl-4 sm:pl-5"
                >
                  <h3 className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] text-[color:var(--color-gold)] mb-2 sm:mb-3">
                    {item.label}
                  </h3>
                  <p className="text-[11px] sm:text-xs leading-relaxed text-[color:var(--color-text-muted)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 注目店舗 */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-20 sm:py-24 lg:py-32">
          <div className="flex items-end justify-between mb-10 sm:mb-12">
            <div>
              <p className="text-[10px] sm:text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2 sm:mb-3">
                FEATURED RESTAURANTS
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl">
                注目の名店
              </h2>
            </div>
            <Link
              href="/restaurants"
              className="hidden md:inline-flex items-center text-xs tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
            >
              すべて見る →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featured.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
          <div className="mt-10 text-center md:hidden">
            <Link
              href="/restaurants"
              className="inline-block text-xs tracking-[0.3em] text-[color:var(--color-gold)]"
            >
              すべての店舗を見る →
            </Link>
          </div>
        </section>

        {/* エリア × ジャンル ナビ */}
        <section className="bg-[color:var(--color-bg-elevated)] border-y border-[color:var(--color-border-soft)]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">
              <div>
                <p className="text-[10px] sm:text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-3 sm:mb-4">
                  AREAS
                </p>
                <h3 className="font-serif text-xl sm:text-2xl mb-6 sm:mb-8">
                  エリアから探す
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {PREFECTURES.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/${p.slug}/sushi`}
                      className="block px-3 sm:px-4 py-2.5 sm:py-3 border border-[color:var(--color-border-soft)] text-xs sm:text-sm tracking-wider text-[color:var(--color-text-muted)] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-3 sm:mb-4">
                  GENRES
                </p>
                <h3 className="font-serif text-xl sm:text-2xl mb-6 sm:mb-8">
                  ジャンルから探す
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {GENRES.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/tokyo/${g.slug}`}
                      className="block px-3 sm:px-4 py-2.5 sm:py-3 border border-[color:var(--color-border-soft)] text-xs sm:text-sm tracking-wider text-center text-[color:var(--color-text-muted)] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-10 py-20 sm:py-24 lg:py-32 text-center">
          <p className="text-[10px] sm:text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-4 sm:mb-6">
            ABOUT
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-8 sm:mb-10 leading-relaxed">
            派手な成金感ではなく、
            <br />
            落ち着いた、静かな高級感を。
          </h2>
          <p className="text-sm md:text-base text-[color:var(--color-text-muted)] leading-loose">
            CLASS DINING が選ぶのは、AMEX Platinum や Forbes JAPAN
            に通ずる、ラグジュアリーホテルのような佇まいの一軒。
            <br className="hidden sm:block" />
            一般的なグルメサイトでは語られない「ビジネス利用に耐えうるか」という観点だけを、
            真剣に、静かに評価します。
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
