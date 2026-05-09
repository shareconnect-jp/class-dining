import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestaurantCard } from "@/components/restaurant-card";
import { fetchPublishedRestaurants } from "@/lib/data";
import {
  GENRES,
  PREFECTURES,
  genreSlugToName,
  prefectureSlugToName,
} from "@/lib/types";

export async function generateMetadata(
  props: PageProps<"/[prefectureSlug]/[genreSlug]">,
) {
  const { prefectureSlug, genreSlug } = await props.params;
  const pref = prefectureSlugToName(prefectureSlug);
  const genre = genreSlugToName(genreSlug);
  if (!pref || !genre) return {};
  return {
    title: `${pref}の接待向け${genre}おすすめ`,
    description: `${pref}で接待・会食に使える${genre}店を厳選。個室、静かさ、会話のしやすさ、VIP対応などビジネス利用に適した名店を紹介します。`,
  };
}

export async function generateStaticParams() {
  return PREFECTURES.flatMap((p) =>
    GENRES.map((g) => ({ prefectureSlug: p.slug, genreSlug: g.slug })),
  );
}

export default async function SeoLandingPage(
  props: PageProps<"/[prefectureSlug]/[genreSlug]">,
) {
  const { prefectureSlug, genreSlug } = await props.params;
  const pref = prefectureSlugToName(prefectureSlug);
  const genre = genreSlugToName(genreSlug);

  const validPref = PREFECTURES.some((p) => p.slug === prefectureSlug);
  const validGenre = GENRES.some((g) => g.slug === genreSlug);
  if (!validPref || !validGenre) notFound();

  const restaurants = await fetchPublishedRestaurants({
    prefecture: pref,
    genre: genreSlug,
  });

  return (
    <>
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <nav className="mb-8 text-xs tracking-widest text-[color:var(--color-text-faded)]">
          <Link href="/" className="hover:text-[color:var(--color-gold)]">
            HOME
          </Link>
          <span className="mx-3 opacity-40">/</span>
          <Link
            href="/restaurants"
            className="hover:text-[color:var(--color-gold)]"
          >
            RESTAURANTS
          </Link>
          <span className="mx-3 opacity-40">/</span>
          <span className="text-[color:var(--color-gold)]">
            {pref} / {genre}
          </span>
        </nav>

        <header className="mb-16 gold-divider text-center">
          <p className="text-xs tracking-[0.5em] text-[color:var(--color-gold)] mb-4">
            BUSINESS DINING GUIDE
          </p>
          <h1 className="font-serif text-3xl md:text-5xl mb-4 leading-tight">
            {pref}の接待向け
            <span className="text-gold-gradient">{genre}</span>
            おすすめ
            {restaurants.length > 0 && (
              <span className="text-2xl md:text-3xl ml-2">
                {restaurants.length}選
              </span>
            )}
          </h1>
          <p className="text-sm text-[color:var(--color-text-muted)] max-w-2xl mx-auto leading-loose mt-6">
            {pref}で接待・会食に使える{genre}店を厳選。個室、静かさ、会話のしやすさ、VIP対応などビジネス利用に適した名店を紹介します。
          </p>
        </header>

        {restaurants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[color:var(--color-text-muted)] mb-6">
              該当する店舗はまだ登録されていません。
            </p>
            <Link
              href="/restaurants"
              className="text-sm tracking-widest text-[color:var(--color-gold)] hover:underline"
            >
              すべての店舗を見る →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}

        {/* 関連リンク */}
        <section className="mt-24 pt-12 border-t border-[color:var(--color-border-soft)]">
          <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
            他の {pref} のジャンル
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRES.filter((g) => g.slug !== genreSlug).map((g) => (
              <Link
                key={g.slug}
                href={`/${prefectureSlug}/${g.slug}`}
                className="px-3 py-1.5 text-xs border border-[color:var(--color-border-soft)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] hover:border-[color:var(--color-gold)] transition-colors"
              >
                {pref} / {g.name}
              </Link>
            ))}
          </div>
          <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6 mt-12">
            他のエリアの {genre}
          </p>
          <div className="flex flex-wrap gap-2">
            {PREFECTURES.filter((p) => p.slug !== prefectureSlug).map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}/${genreSlug}`}
                className="px-3 py-1.5 text-xs border border-[color:var(--color-border-soft)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] hover:border-[color:var(--color-gold)] transition-colors"
              >
                {p.name} / {genre}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
