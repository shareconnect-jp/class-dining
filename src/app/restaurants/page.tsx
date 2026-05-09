import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestaurantCard } from "@/components/restaurant-card";
import { fetchPublishedRestaurants } from "@/lib/data";
import { GENRES, PREFECTURES } from "@/lib/types";

export const metadata = {
  title: "店舗一覧",
  description:
    "経営者・士業のための、接待・出張に使える厳選レストラン一覧。個室・VIP対応・静謐な空間でビジネス会食をお楽しみください。",
};

export default async function RestaurantsPage() {
  const restaurants = await fetchPublishedRestaurants();

  return (
    <>
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="mb-16 gold-divider text-center">
          <p className="text-xs tracking-[0.5em] text-[color:var(--color-gold)] mb-4">
            ALL RESTAURANTS
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">店舗一覧</h1>
        </div>

        {/* 簡易ナビ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pb-12 border-b border-[color:var(--color-border-soft)]">
          <div>
            <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-4">
              エリアから絞る
            </p>
            <div className="flex flex-wrap gap-2">
              {PREFECTURES.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}/sushi`}
                  className="px-3 py-1.5 text-xs border border-[color:var(--color-border-soft)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] hover:border-[color:var(--color-gold)] transition-colors"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-4">
              ジャンルから絞る
            </p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <Link
                  key={g.slug}
                  href={`/tokyo/${g.slug}`}
                  className="px-3 py-1.5 text-xs border border-[color:var(--color-border-soft)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] hover:border-[color:var(--color-gold)] transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <p className="text-center text-[color:var(--color-text-muted)] py-20">
            まだ店舗が登録されていません。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
