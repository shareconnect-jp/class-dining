import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestaurantCard } from "@/components/restaurant-card";
import { fetchFeatureBySlug } from "@/lib/data";

export async function generateMetadata(
  props: PageProps<"/features/[slug]">,
) {
  const { slug } = await props.params;
  const result = await fetchFeatureBySlug(slug);
  if (!result) return { title: "特集が見つかりません" };
  const { feature } = result;
  return {
    title: feature.title,
    description: feature.subtitle ?? undefined,
    openGraph: {
      title: feature.title,
      description: feature.subtitle ?? undefined,
      images: feature.hero_image_url ? [feature.hero_image_url] : [],
    },
  };
}

export default async function FeatureDetailPage(
  props: PageProps<"/features/[slug]">,
) {
  const { slug } = await props.params;
  const result = await fetchFeatureBySlug(slug);
  if (!result) notFound();
  const { feature, restaurants } = result;

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] bg-[color:var(--color-bg-soft)] overflow-hidden">
          {feature.hero_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={feature.hero_image_url}
              alt={feature.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 max-w-4xl mx-auto px-5 sm:px-6 lg:px-10 pb-6 sm:pb-10 md:pb-12">
            <p className="text-[10px] tracking-[0.5em] text-[color:var(--color-gold)] mb-3 sm:mb-4 font-bold">
              FEATURE
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
              {feature.title}
            </h1>
            {feature.subtitle && (
              <p className="mt-4 text-sm sm:text-base text-[color:var(--color-text-muted)] max-w-2xl">
                {feature.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* BODY */}
        <article className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-10 py-12 sm:py-16">
          {feature.body_md ? (
            <div className="prose-feature">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {feature.body_md}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-[color:var(--color-text-muted)] text-center py-10 text-sm">
              本文はまだ書かれていません。
            </p>
          )}
        </article>

        {/* 紐付け店舗 */}
        {restaurants.length > 0 && (
          <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-12 sm:py-16 border-t border-[color:var(--color-border-soft)]">
            <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-3">
              FEATURED RESTAURANTS
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl mb-10">
              本特集で取り上げた {restaurants.length} 軒
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </section>
        )}

        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-10 py-10 text-center">
          <Link
            href="/features"
            className="text-xs tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            ← 特集一覧に戻る
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
